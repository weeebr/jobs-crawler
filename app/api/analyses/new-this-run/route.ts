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

export async function GET(_request: Request) {
  try {
    const apiKey = await getApiKeyFromRequest();
    console.info(`[api/analyses/new-this-run] fetching for API key: ${apiKey.substring(0, 8)}...`);

    const analyses = await analysisStorage.getNewThisRun(apiKey);

    console.info(`[api/analyses/new-this-run] returning ${analyses.length} records`);

    return NextResponse.json(analyses);
  } catch (error) {
    console.error('[api/analyses/new-this-run] error fetching analyses:', error);
    return NextResponse.json({ error: 'Failed to fetch new analyses' }, { status: 500 });
  }
}
