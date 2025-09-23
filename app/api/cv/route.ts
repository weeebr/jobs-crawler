import { NextResponse } from "next/server";
import { loadDefaultCv } from "@/lib/defaultCv";

export async function GET() {
  try {
    const { markdown, profile } = await loadDefaultCv();
    return NextResponse.json({ markdown, profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load CV";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
