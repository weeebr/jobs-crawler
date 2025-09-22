import { fetchJobAd, type FetchJobAdOptions } from "@/lib/fetchJobAd";
import { parseJobAd } from "@/lib/parseJobAd";
import { compareCv } from "@/lib/compareCv";
import { rankMatchScore } from "@/lib/rankMatch";
import { saveAnalysis } from "@/lib/analysisStore";
import {
  analysisEnrichedSchema,
  jobAdFetchedSchema,
  type AnalysisEnriched,
  type CVProfile,
} from "@/lib/schemas";
import type { AnalysisRecord } from "@/lib/types";

const FETCH_TIMEOUT_MS = 6_000;
const FETCH_RETRY_COUNT = 1;


export async function analyzeSingleJob(
  source: { jobUrl?: string; rawHtml?: string },
  cvProfile: CVProfile,
  options: { clearJobAdData?: boolean } = {},
  abortController?: AbortController,
): Promise<AnalysisRecord> {
  // Check if aborted before starting
  if (abortController?.signal.aborted) {
    throw new Error('Job analysis aborted');
  }

  const { html, sourceUrl } = await resolveJobHtml(source, options);
  
  // Check if aborted after fetching HTML
  if (abortController?.signal.aborted) {
    throw new Error('Job analysis aborted');
  }

  const job = await parseJobAd(html, { sourceUrl });
  const normalizedJob = jobAdFetchedSchema.parse({
    ...job,
    fetchedAt: Date.now(),
    sourceDomain: sourceUrl ? new URL(sourceUrl).hostname : undefined,
  });

  // Check if aborted before comparison
  if (abortController?.signal.aborted) {
    throw new Error('Job analysis aborted');
  }

  const comparison = compareCv(normalizedJob, cvProfile);

  // Check if aborted before LLM ranking
  if (abortController?.signal.aborted) {
    throw new Error('Job analysis aborted');
  }

  const ranking = await rankMatchScore({
    job: normalizedJob,
    cv: cvProfile,
    heuristics: comparison,
  });

  const analysisInput = {
    matchScore: ranking.matchScore,
    reasoning: comparison.reasoning,
    letters: {},
    analyzedAt: Date.now(),
    analysisVersion: "1.0",
    interactionCount: 0,
  } satisfies AnalysisEnriched;

  const analysis = analysisEnrichedSchema.parse(analysisInput);

  const record = saveAnalysis({
    id: Date.now(),
    job: normalizedJob,
    cv: cvProfile,
    analysis,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return record;
}

async function resolveJobHtml(source: {
  jobUrl?: string;
  rawHtml?: string;
}, options: { clearJobAdData?: boolean } = {}): Promise<{ html: string; sourceUrl?: string }> {
  if (source.jobUrl) {
    const html = await fetchJobAd(source.jobUrl, {
      timeoutMs: FETCH_TIMEOUT_MS,
      retryCount: FETCH_RETRY_COUNT,
      clearJobAdData: options.clearJobAdData,
    });
    return { html, sourceUrl: source.jobUrl };
  }
  if (source.rawHtml) {
    return { html: source.rawHtml };
  }
  throw new Error("No job content provided");
}
