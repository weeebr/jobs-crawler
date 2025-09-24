import { NextResponse } from "next/server";
import { z } from "zod";

import { analysisStorage } from "@/lib/analysisStorageHandler";
import { compareCv } from "@/lib/compareCv";
import { generateMotivationLetter } from "@/lib/generateMotivationLetter";

const requestSchema = z.object({
  language: z.enum(["en", "de"]),
  refresh: z.boolean().optional(),
});

type Params = {
  params: { id: string };
};

export async function POST(request: Request, { params }: Params) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const record = await analysisStorage.getById(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { language, refresh } = parsed.data;
  const cached = record.llmAnalysis.letters?.[language];
  if (cached && !refresh) {
    console.info(
      `[api/analysis/${params.id}/letter] returning cached letter (${language})`,
    );
    return NextResponse.json({
      language,
      content: cached.content,
      generatedAt: cached.generatedAt,
      source: "cache",
    });
  }

  const heuristics = compareCv(record.job, record.cv);
  const result = await generateMotivationLetter({
    job: record.job,
    cv: record.cv,
    heuristics,
    language,
  });

  const letter = {
    content: result.content,
    generatedAt: Date.now(),
  } as const;

  analysisStorage.save({
    ...record,
    llmAnalysis: {
      ...record.llmAnalysis,
      letters: {
        ...record.llmAnalysis.letters,
        [language]: letter,
      },
    },
    updatedAt: Date.now(),
  });

  console.info(
    `[api/analysis/${params.id}/letter] generated letter (${language}) source=${result.source}`,
  );

  return NextResponse.json({
    language,
    content: letter.content,
    generatedAt: letter.generatedAt,
    source: result.source,
  });
}
