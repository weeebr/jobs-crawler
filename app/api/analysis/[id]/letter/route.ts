import { NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";

import { analysisStorage } from "@/lib/analysisStorageHandler";
import { compareCv } from "@/lib/compareCv";
import { generateMotivationLetter } from "@/lib/generateMotivationLetter";

// Helper to get API key from request headers
async function getApiKeyFromRequest(): Promise<string> {
  const headersList = await headers();
  const apiKey = headersList.get('x-api-key') || headersList.get('authorization')?.replace('Bearer ', '');
  return apiKey || process.env.NEXT_PUBLIC_ANALYSIS_API_KEY || "default-user";
}

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

  const apiKey = await getApiKeyFromRequest();
  const record = await analysisStorage.getById(apiKey, id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { language, refresh } = parsed.data;

  // Record is already in client format from analysisStorage.getById()
  const clientRecord = record;

  const cached = clientRecord.llmAnalysis.letters?.[language];
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

  const heuristics = compareCv(clientRecord.job, clientRecord.cv);
  const result = await generateMotivationLetter({
    job: clientRecord.job,
    cv: clientRecord.cv,
    heuristics,
    language,
  });

  const letter = {
    content: result.content,
    generatedAt: Date.now(),
  } as const;

  // Update the record with the new letter
  const updatedClientRecord = {
    ...clientRecord,
    llmAnalysis: {
      ...clientRecord.llmAnalysis,
      letters: {
        ...clientRecord.llmAnalysis.letters,
        [language]: letter,
      },
    },
    updatedAt: Date.now(),
  };

  // Update the record with the new letter
  await analysisStorage.update(apiKey, id, updatedClientRecord);

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
