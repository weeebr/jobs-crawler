import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { analysisStorage } from "@/lib/analysisStorageHandler";

// Helper to get API key from request headers
async function getApiKeyFromRequest(): Promise<string> {
  const headersList = await headers();
  const apiKey = headersList.get('x-api-key') || headersList.get('authorization')?.replace('Bearer ', '');
  return apiKey || process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
}

export async function GET(_request: Request) {
  try {
    const apiKey = await getApiKeyFromRequest();
    console.info(`[api/analyses/stats] fetching stats for API key: ${apiKey.substring(0, 8)}...`);

    const stats = await analysisStorage.getStats(apiKey);

    console.info(`[api/analyses/stats] returning stats`);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[api/analyses/stats] error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
