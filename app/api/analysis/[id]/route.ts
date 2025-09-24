import { NextResponse } from "next/server";

import { analysisStorage } from "@/lib/analysisStorageHandler";
import type { AnalysisRecord } from "@/lib/types";

interface Params {
  params: { id: string };
}

export async function GET(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const record = await analysisStorage.getById(id);
    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(record);
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
    const updates: Partial<AnalysisRecord> = await request.json();
    const updated = await analysisStorage.update(id, updates);

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
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
    console.log(`[api/analysis/${id}] Attempting to delete from unified storage`);
    const removed = await analysisStorage.remove(id);
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
