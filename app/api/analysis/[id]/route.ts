import { NextResponse } from "next/server";

import { deleteAnalysis, getAnalysis } from "@/lib/analysisStore";

interface Params {
  params: { id: string };
}

export function GET(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  
  const record = getAnalysis(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}

export function DELETE(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  console.log(`[api/analysis/${id}] DELETE request received`);
  
  if (Number.isNaN(id)) {
    console.log(`[api/analysis/${id}] Invalid ID format`);
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  
  console.log(`[api/analysis/${id}] Attempting to delete from server store`);
  const removed = deleteAnalysis(id);
  console.log(`[api/analysis/${id}] Delete result:`, removed);
  
  if (!removed) {
    console.log(`[api/analysis/${id}] Analysis not found in server store`);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  console.log(`[api/analysis/${id}] Successfully deleted from server store`);
  return new NextResponse(null, { status: 204 });
}
