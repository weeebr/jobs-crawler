import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { analysisStorage } from "@/lib/analysisStorageHandler";

// Helper to get API key from request headers
async function getApiKeyFromRequest(): Promise<string> {
  const headersList = await headers();
  const apiKey = headersList.get('x-api-key') || headersList.get('authorization')?.replace('Bearer ', '');
  return apiKey || process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
}

export async function POST(request: Request) {
  try {
    const apiKey = await getApiKeyFromRequest();
    console.info(`[api/analyses/mark-new] marking for API key: ${apiKey.substring(0, 8)}...`);

    const { ids }: { ids: number[] } = await request.json();

    await analysisStorage.markAsNewThisRun(apiKey, ids);

    console.info(`[api/analyses/mark-new] marked ${ids.length} analyses as new`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/analyses/mark-new] error marking analyses:', error);
    return NextResponse.json({ error: 'Failed to mark analyses as new' }, { status: 500 });
  }
}
