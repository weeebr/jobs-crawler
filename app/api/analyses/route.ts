import { NextResponse } from "next/server";

import { listAnalyses, clearAllAnalyses } from "@/lib/analysisStore";
import type { AnalysisRecord } from "@/lib/types";

export function GET() {
  const analyses = listAnalyses(Number.MAX_SAFE_INTEGER);
  const payload: AnalysisRecord[] = analyses.map((analysis) => analysis);

  console.info(`[api/analyses] returning ${payload.length} records`);

  return NextResponse.json(payload);
}

export function DELETE() {
  clearAllAnalyses();
  console.info('[api/analyses] cleared all analyses from server-side store');
  
  return NextResponse.json({ success: true });
}
