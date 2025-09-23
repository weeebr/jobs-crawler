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
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  
  const removed = deleteAnalysis(id);
  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
