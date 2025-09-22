import { z } from "zod";

import type { CVProfile, JobAdParsed } from "./schemas";
import type { ComparisonResult } from "./compareCv";
import { roundMatchScore } from "./matchScore";

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MATCH_MODEL ?? "gpt-4o-mini";
const OPENAI_TIMEOUT_MS = parseInt(process.env.OPENAI_TIMEOUT_MS ?? "30000", 10);

const responseSchema = z.object({
  matchScore: z
    .number()
    .min(0)
    .max(100),
  reasoning: z.string().min(1),
});

export interface MatchRanking {
  matchScore: number;
  reasoning: string;
  source: "llm" | "heuristic";
}

interface RankMatchInput {
  job: JobAdParsed;
  cv: CVProfile;
  heuristics: ComparisonResult;
}

export async function rankMatchScore(
  input: RankMatchInput,
): Promise<MatchRanking> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      source: "heuristic",
      matchScore: input.heuristics.matchScore,
      reasoning: "LLM scoring unavailable - no API key. Using heuristic-based scoring as fallback"
    };
  }

  try {
    const payload = buildRequestPayload(input);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
    
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      console.warn(`[rankMatchScore] OpenAI responded ${response.status}: ${text.slice(0, 200)}`);
      return fallbackRanking(input.heuristics);
    }

    const data = await response.json();
    const content: unknown = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      console.warn("[rankMatchScore] missing content in OpenAI response");
      return fallbackRanking(input.heuristics);
    }

    const parsed = extractJson(content);
    if (!parsed) {
      console.warn("[rankMatchScore] failed to parse OpenAI JSON payload");
      return fallbackRanking(input.heuristics);
    }

    const result = responseSchema.safeParse(parsed);
    if (!result.success) {
      console.warn("[rankMatchScore] invalid OpenAI payload", result.error);
      return fallbackRanking(input.heuristics);
    }

    const clamped = clamp(result.data.matchScore, 0, 100);
    const rounded = roundMatchScore(clamped);

    console.info(`[rankMatchScore] llm score=${rounded}`);

    return {
      matchScore: rounded,
      reasoning: result.data.reasoning.trim(),
      source: "llm",
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`[rankMatchScore] OpenAI timeout after ${OPENAI_TIMEOUT_MS}ms`);
    } else {
      console.warn("[rankMatchScore] scoring failure", error);
    }
    return fallbackRanking(input.heuristics);
  }
}

function fallbackRanking(heuristics: ComparisonResult): MatchRanking {
  console.info(`[rankMatchScore] fallback score=${heuristics.matchScore}`);
  return { matchScore: heuristics.matchScore, reasoning: "LLM scoring unavailable; using heuristic stack overlap and keyword coverage.", source: "heuristic" };
}

function buildRequestPayload({ job, cv, heuristics }: RankMatchInput) {
  const system =
    "You are a meticulous hiring manager. Score how well the candidate fits the job from 0 to 100 based strictly on provided facts. Never invent experience. If evidence is missing, penalize the score and mention the missing proof.";

  const jobSummary = formatJob(job);
  const cvSummary = formatCv(cv);
  const heuristicsSummary = formatHeuristics(heuristics, job);

  const user = `JOB AD SUMMARY\n${jobSummary}\n\nCANDIDATE PROFILE\n${cvSummary}\n\nHEURISTIC SIGNALS\n${heuristicsSummary}\n\nTASK\nReturn compact JSON with keys matchScore (0-100 number) and reasoning (one paragraph). Justify the score referencing only verifiable facts.`;

  return {
    model: OPENAI_MODEL,
    temperature: 0.1,
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

function formatJob(job: JobAdParsed): string {
  const stack = job.stack.slice(0, 12).join(", ") || "(stack unspecified)";
  const quals = summarizeList(job.qualifications, 8);
  const roles = summarizeList(job.roles, 6);
  return [`Title: ${job.title}`, `Company: ${job.company}`, `Stack: ${stack}`, quals ? `Qualifications: ${quals}` : null, roles ? `Responsibilities: ${roles}` : null, job.motto ? `Values: ${job.motto}` : null]
    .filter(Boolean)
    .join("\n");
}

function formatCv(cv: CVProfile): string {
  const roleSummaries = cv.roles.slice(0, 4).map((role) => {
    const stack = role.stack.slice(0, 8).join(", ") || "(no stack listed)";
    return `${role.title} — stack: ${stack}${typeof role.years === "number" ? ` (${role.years}y)` : ""}`;
  });
  const projects = cv.projects.slice(0, 3).map((project) => {
    const stack = project.stack.slice(0, 6).join(", ") || "(no stack listed)";
    return `${project.name}: ${stack}${project.impact ? ` — ${project.impact}` : ""}`;
  });
  return [
    roleSummaries.length ? `Roles: ${roleSummaries.join("; ")}` : null,
    cv.skills.length ? `Skills: ${cv.skills.slice(0, 12).join(", ")}` : null,
    projects.length ? `Projects: ${projects.join("; ")}` : null,
    cv.keywords.length ? `Keywords: ${cv.keywords.slice(0, 12).join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatHeuristics(heuristics: ComparisonResult, job: JobAdParsed): string {
  const missing = heuristics.gaps.length
    ? `Missing stack evidence: ${heuristics.gaps.join(", ")}`
    : "No missing stack according to heuristics.";
  return `Heuristic score: ${heuristics.matchScore.toFixed(1)}\n${missing}\nJob stack count: ${job.stack.length}`;
}

function summarizeList(values: string[], limit: number): string {
  if (values.length === 0) return "";
  const truncated = values.slice(0, limit);
  const suffix = values.length > limit ? "…" : "";
  return `${truncated.join("; ")}${suffix}`;
}

function extractJson(content: string): unknown {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.warn("[rankMatchScore] JSON parse error", error);
    return null;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
