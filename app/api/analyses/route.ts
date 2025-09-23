import { NextResponse } from "next/server";

import { analysisStorage } from "@/lib/analysisStorageHandler";
import type { AnalysisRecord } from "@/lib/types";

export function GET() {
  const analyses = analysisStorage.list(Number.MAX_SAFE_INTEGER, "server");
  const payload: AnalysisRecord[] = analyses.map((analysis) => analysis);

  console.info(`[api/analyses] returning ${payload.length} records`);

  return NextResponse.json(payload);
}

export function DELETE() {
  analysisStorage.clear("server");
  console.info('[api/analyses] cleared all analyses from server-side store');
  
  return NextResponse.json({ success: true });
}
