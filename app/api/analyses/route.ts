import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { analysisStorage } from "@/lib/analysisStorageHandler";
import type { AnalysisRecord } from "@/lib/types";

// Helper to get API key from request headers
async function getApiKeyFromRequest(): Promise<string> {
  const headersList = await headers();
  const apiKey = headersList.get('x-api-key') || headersList.get('authorization')?.replace('Bearer ', '');
  return apiKey || process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
}

export async function GET(request: Request) {
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
        analyses = await analysisStorage.searchByCompany(company);
      } else if (status) {
        debugInfo.step = 'getByStatus';
        analyses = await analysisStorage.getByStatus(status as 'interested' | 'applied');
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

        // Try storage layer first
        try {
          analyses = await analysisStorage.list(limit ? parseInt(limit, 10) : undefined);
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

export async function POST(request: Request) {
  try {
    const apiKey = await getApiKeyFromRequest();
    console.info(`[api/analyses] saving for API key: ${apiKey.substring(0, 8)}...`);

    const record: AnalysisRecord = await request.json();
    const savedRecord = await analysisStorage.save(record);

    console.info(`[api/analyses] saved record ${savedRecord.id}`);

    return NextResponse.json(savedRecord);
  } catch (error) {
    console.error('[api/analyses] error saving analysis:', error);
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const apiKey = await getApiKeyFromRequest();
    console.info(`[api/analyses] clearing for API key: ${apiKey.substring(0, 8)}...`);

    await analysisStorage.clear();
    console.info('[api/analyses] cleared all analyses from unified storage');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/analyses] error clearing analyses:', error);
    return NextResponse.json({ error: 'Failed to clear analyses' }, { status: 500 });
  }
}
