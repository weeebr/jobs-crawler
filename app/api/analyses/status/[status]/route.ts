import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { analysisStorage } from "@/lib/analysisStorageHandler";
import type { AnalysisRecord } from "@/lib/types";

interface Params {
  params: { status: string };
}

// Helper to get API key from request headers
async function getApiKeyFromRequest(): Promise<string> {
  const headersList = await headers();
  const apiKey = headersList.get('x-api-key') || headersList.get('authorization')?.replace('Bearer ', '');
  return apiKey || process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const status = params.status as 'interested' | 'applied';
    const apiKey = await getApiKeyFromRequest();
    console.info(`[api/analyses/status/${status}] fetching for API key: ${apiKey.substring(0, 8)}...`);

    const analyses = await analysisStorage.getByStatus(apiKey, status);

    console.info(`[api/analyses/status/${status}] returning ${analyses.length} records`);

    return NextResponse.json(analyses);
  } catch (error) {
    console.error(`[api/analyses/status/${params.status}] error fetching analyses:`, error);
    return NextResponse.json({ error: 'Failed to fetch analyses by status' }, { status: 500 });
  }
}
