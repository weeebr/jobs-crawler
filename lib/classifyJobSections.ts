import { z } from "zod";

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_JOB_CLASSIFIER_MODEL ?? "gpt-4o-mini";
const MAX_ITEMS = 8;

export interface SectionBuckets {
  qualifications: string[];
  roles: string[];
  benefits: string[];
}

interface ClassifyJobSectionsInput {
  html: string;
  heuristics: SectionBuckets;
  sourceUrl?: string;
}

const responseSchema = z.object({
  qualifications: z.array(z.string()).default([]),
  roles: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
});

export async function classifyJobSections(
  input: ClassifyJobSectionsInput,
): Promise<SectionBuckets | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.info("[classifyJobSections] missing OPENAI_API_KEY, using heuristics");
    return null;
  }

  try {
    const payload = buildRequestPayload(input);
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(
        `[classifyJobSections] OpenAI responded ${response.status}: ${text.slice(0, 200)}`,
      );
      return null;
    }

    const data = await response.json();
    const content: unknown = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      console.warn("[classifyJobSections] missing content in OpenAI response");
      return null;
    }

    const parsed = extractJson(content);
    if (!parsed) {
      console.warn("[classifyJobSections] failed to parse OpenAI JSON payload");
      return null;
    }

    const result = responseSchema.safeParse(parsed);
    if (!result.success) {
      console.warn("[classifyJobSections] invalid OpenAI payload", result.error);
      return null;
    }

    console.info(
      `[classifyJobSections] success quals=${result.data.qualifications.length} roles=${result.data.roles.length} benefits=${result.data.benefits.length}`,
    );

    return {
      qualifications: sanitizeList(result.data.qualifications),
      roles: sanitizeList(result.data.roles),
      benefits: sanitizeList(result.data.benefits),
    };
  } catch (error) {
    console.warn("[classifyJobSections] classification failure", error);
    return null;
  }
}

function buildRequestPayload(input: ClassifyJobSectionsInput) {
  const truncatedHtml = truncate(input.html, 8_000);
  const heuristicsJson = JSON.stringify(input.heuristics, null, 2);
  const system = `You are a precise classifier for job ads. Categorize bullet points into three buckets: qualifications (what the candidate must already have), roles (day-to-day responsibilities), and benefits (what the employer offers). Use only the provided job ad content. Return strict minified JSON with keys qualifications, roles, benefits. Each array must contain at most ${MAX_ITEMS} distinct strings copied verbatim (or concise excerpts) from the ad. Skip anything uncertain. Never fabricate new details.`;
  const user = `Job source: ${input.sourceUrl ?? "unknown"}

Job ad HTML (truncated):
${truncatedHtml}

Initial heuristic extraction (may be messy, dedupe and fix):
${heuristicsJson}`;

  return {
    model: OPENAI_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: system,
      },
      {
        role: "user",
        content: user,
      },
    ],
  } satisfies Record<string, unknown>;
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function extractJson(content: string): unknown {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.warn("[classifyJobSections] JSON parse error", error);
    return null;
  }
}

function sanitizeList(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) continue;
    if (seen.has(normalized.toLowerCase())) continue;
    seen.add(normalized.toLowerCase());
    output.push(normalized);
    if (output.length >= MAX_ITEMS) break;
  }

  return output;
}
