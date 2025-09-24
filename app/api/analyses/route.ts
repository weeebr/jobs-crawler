import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { analysisStorage } from "@/lib/analysisStorageHandler";
import type { AnalysisRecord } from "@/lib/types";

// Helper to get API key from request headers
async function getApiKeyFromRequest(): Promise<string> {
  const headersList = await headers();
  const apiKey = headersList.get('x-api-key') || headersList.get('authorization')?.replace('Bearer ', '');
  return apiKey || process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,x-api-key,Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    // For now, we'll use the default API key since we don't have proper auth yet
    const apiKey = await getApiKeyFromRequest();
    console.info(`[api/analyses] fetching for API key: ${apiKey.substring(0, 8)}...`);

    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const company = url.searchParams.get('company');
    const status = url.searchParams.get('status');

    let analyses: AnalysisRecord[] = [];
    const debugInfo = { step: '', userId: 0, directQueryCount: 0, storageQueryCount: 0, storageError: '' };

    try {
      if (company) {
        debugInfo.step = 'searchByCompany';
        analyses = await analysisStorage.searchByCompany(apiKey, company);
      } else if (status) {
        debugInfo.step = 'getByStatus';
        analyses = await analysisStorage.getByStatus(apiKey, status as 'interested' | 'applied');
      } else {
        debugInfo.step = 'list';
        // Test direct database access
        const { db } = await import('@/lib/db/index');
        const { analysisRecords } = await import('@/lib/db/schema');
        const { eq, desc } = await import('drizzle-orm');

        const directQuery = await db
          .select({ count: analysisRecords.id })
          .from(analysisRecords)
          .where(eq(analysisRecords.userId, 3));

        debugInfo.directQueryCount = directQuery[0]?.count || 0;
        debugInfo.userId = 3;

        // Try storage layer first - pass the API key from request
        try {
          analyses = await analysisStorage.list(apiKey, limit ? parseInt(limit, 10) : undefined);
          debugInfo.storageQueryCount = analyses.length;
        } catch (storageError) {
          debugInfo.storageError = storageError instanceof Error ? storageError.message : 'Unknown storage error';
          console.error('[api/analyses] storage error:', storageError);

        // If storage layer fails, try direct transformation
        console.info('[api/analyses] trying direct transformation...');
        const dbRecords = await db
          .select()
          .from(analysisRecords)
          .where(eq(analysisRecords.userId, 3))
          .orderBy(desc(analysisRecords.createdAt))
          .limit(limit ? parseInt(limit, 10) : 50);

        debugInfo.directQueryCount = dbRecords.length;

        const { dbRecordToClientRecord } = await import('@/lib/analysisStorageUtils');
        analyses = [];

        for (const record of dbRecords) {
          try {
            const { dbRecordToClientRecord } = await import('@/lib/analysisStorageUtils');
            const clientRecord = dbRecordToClientRecord(record);
            analyses.push(clientRecord);
          } catch (transformError) {
            console.error('[api/analyses] failed to transform record:', record.id, transformError);
          }
        }

          debugInfo.storageQueryCount = analyses.length;
          console.info('[api/analyses] direct transformation returned', analyses.length, 'records');
        }
      }
    } catch (error) {
      debugInfo.step = 'error';
      debugInfo.storageError = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({
        error: 'Database query failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: debugInfo
      }, { status: 500 });
    }

    return NextResponse.json({ analyses, debug: debugInfo });
  } catch (error) {
    console.error('[api/analyses] error fetching analyses:', error);
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = await getApiKeyFromRequest();
    console.info(`[api/analyses] saving for API key: ${apiKey.substring(0, 8)}...`);

    const record: AnalysisRecord = await request.json();
    console.info(`[api/analyses] received record:`, JSON.stringify(record, null, 2));

    // Validate required fields
    if (!record.job?.title) {
      console.error('[api/analyses] missing title in job data');
      return NextResponse.json({ error: 'Missing job title' }, { status: 400 });
    }

    if (!record.job?.company) {
      console.error('[api/analyses] missing company in job data');
      return NextResponse.json({ error: 'Missing company' }, { status: 400 });
    }

    if (!record.llmAnalysis?.matchScore) {
      console.error('[api/analyses] missing match score');
      return NextResponse.json({ error: 'Missing match score' }, { status: 400 });
    }

    const savedRecord = await analysisStorage.save(apiKey, record);

    console.info(`[api/analyses] saved record ${savedRecord.id}`);

    return NextResponse.json(savedRecord);
  } catch (error) {
    console.error('[api/analyses] error saving analysis:', error);
    console.error('[api/analyses] error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json({ error: 'Failed to save analysis', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const apiKey = await getApiKeyFromRequest();
    console.info(`[api/analyses] clearing for API key: ${apiKey.substring(0, 8)}...`);

    await analysisStorage.clear(apiKey);
    console.info('[api/analyses] cleared all analyses from unified storage');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/analyses] error clearing analyses:', error);
    return NextResponse.json({ error: 'Failed to clear analyses' }, { status: 500 });
  }
}
