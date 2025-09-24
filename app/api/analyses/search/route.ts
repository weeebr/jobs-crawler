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
    const url = new URL(request.url);
    const company = url.searchParams.get('company');

    if (!company) {
      return NextResponse.json({ error: 'Company parameter is required' }, { status: 400 });
    }

    const apiKey = await getApiKeyFromRequest();
    console.info(`[api/analyses/search] searching for "${company}" for API key: ${apiKey.substring(0, 8)}...`);

    const analyses = await analysisStorage.searchByCompany(company);

    console.info(`[api/analyses/search] found ${analyses.length} results for "${company}"`);

    return NextResponse.json(analyses);
  } catch (error) {
    console.error('[api/analyses/search] error searching analyses:', error);
    return NextResponse.json({ error: 'Failed to search analyses' }, { status: 500 });
  }
}
