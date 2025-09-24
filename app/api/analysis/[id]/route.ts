import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { analysisStorage } from "@/lib/analysisStorageHandler";
import type { AnalysisRecord } from "@/lib/types";

interface Params {
  params: { id: string };
}

// Helper to get API key from request headers
async function getApiKeyFromRequest(): Promise<string> {
  const headersList = await headers();
  const apiKey = headersList.get('x-api-key') || headersList.get('authorization')?.replace('Bearer ', '');
  return apiKey || process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
}

export async function GET(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const apiKey = await getApiKeyFromRequest();
    const record = await analysisStorage.getById(apiKey, id);
    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ analysis: record });
  } catch (error) {
    console.error(`[api/analysis/${id}] error fetching record:`, error);
    return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const apiKey = await getApiKeyFromRequest();
    const updates: Partial<AnalysisRecord> = await request.json();

    // Update the record with client format updates
    const updated = await analysisStorage.update(apiKey, id, updates);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ analysis: updated });
  } catch (error) {
    console.error(`[api/analysis/${id}] error updating record:`, error);
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  console.log(`[api/analysis/${id}] DELETE request received`);

  if (Number.isNaN(id)) {
    console.log(`[api/analysis/${id}] Invalid ID format`);
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const apiKey = await getApiKeyFromRequest();
    console.log(`[api/analysis/${id}] Attempting to delete from unified storage for API key: ${apiKey.substring(0, 8)}...`);
    const removed = await analysisStorage.remove(apiKey, id);
    console.log(`[api/analysis/${id}] Delete result:`, removed);

    if (!removed) {
      console.log(`[api/analysis/${id}] Analysis not found in unified storage`);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    console.log(`[api/analysis/${id}] Successfully deleted from unified storage`);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`[api/analysis/${id}] error deleting record:`, error);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
