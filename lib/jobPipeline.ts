import { fetchJobAd, type FetchJobAdOptions } from "./fetchJobAd";
import { parseJobAd } from "./parseJobAd";
import { compareCv } from "./compareCv";
import { rankMatchScore } from "./rankMatch";
import { analysisStorage } from "./analysisStorageHandler";
import { extractJobLinks } from "./extractJobLinks";
import {
  jobAdFetchedSchema,
  llmAnalysisSchema,
  userInteractionsSchema,
  type CVProfile,
  type JobAdParsed,
  type JobAdFetched,
  type LLMAnalysis,
  type UserInteractions,
} from "./schemas";
import type { AnalysisRecord } from "./types";

export const JOB_PIPELINE_DEFAULTS = Object.freeze({
  timeoutMs: 8_000,
  retryCount: 2,
  maxSearchPages: 12,
});

export type LinkCollectionProgress = { message: string; total: number; completed: number };
export type CollectJobLinksOptions = {
  fetchOptions?: Partial<FetchJobAdOptions>;
  maxPages?: number;
  onProgress?: (progress: LinkCollectionProgress) => void;
};
export type JobHtmlSource = { jobUrl?: string; rawHtml?: string };
export type AnalyzeJobOptions = {
  fetchOptions?: Partial<FetchJobAdOptions>;
  clearJobAdData?: boolean;
  abortSignal?: AbortSignal;
};

export async function collectJobLinks(
  searchUrl: string,
  options: CollectJobLinksOptions = {},
): Promise<{ jobLinks: string[]; fetchedPages: number }> {
  const initialUrl = new URL(searchUrl);
  const initialPage = parseNonNegativeInt(initialUrl.searchParams.get("page")) ?? 1;
  const normalizedInitialUrl = initialUrl.toString();

  const seen = new Set<string>();
  let fetchedPages = 0;

  const fetchOptions = buildFetchOptions(options.fetchOptions);
  const maxPages = options.maxPages ?? JOB_PIPELINE_DEFAULTS.maxSearchPages;

  for (let offset = 0; offset < maxPages; offset += 1) {
    const pageNumber = initialPage + offset;
    const pageUrl = offset === 0 ? normalizedInitialUrl : buildPageUrl(normalizedInitialUrl, pageNumber);

    options.onProgress?.({ message: `Scanning page ${pageNumber} for job links...`, total: maxPages, completed: offset });

    const html = await fetchJobAd(pageUrl, fetchOptions);
    fetchedPages += 1;

    const resolvedLinks = extractJobLinks(html, pageUrl);
    let newLinks = 0;
    for (const link of resolvedLinks) {
      if (!seen.has(link)) {
        seen.add(link);
        newLinks += 1;
      }
    }

  console.info(`[jobPipeline] page ${pageNumber}: ${resolvedLinks.length} total links, ${newLinks} new links`);

    options.onProgress?.({ message: `Page ${pageNumber}: found ${resolvedLinks.length} links (${newLinks} new)`, total: maxPages, completed: offset + 1 });

    if (newLinks === 0) {
      console.info(`[jobPipeline] No new links found on page ${pageNumber}, stopping pagination`);
      break;
    }
  }

  options.onProgress?.({ message: `Completed: ${seen.size} unique job links across ${fetchedPages} pages`, total: fetchedPages, completed: fetchedPages });

  console.info(`[jobPipeline] completed: ${seen.size} unique job links across ${fetchedPages} page(s)`);
  return { jobLinks: Array.from(seen), fetchedPages };
}

export async function analyzeJob(
  source: JobHtmlSource,
  cvProfile: CVProfile,
  options: AnalyzeJobOptions = {},
): Promise<AnalysisRecord> {
  throwIfAborted(options.abortSignal);
  const { html, sourceUrl } = await resolveJobHtml(source, options);
  throwIfAborted(options.abortSignal);
  const job = await parseJobAd(html, { sourceUrl });
  const normalizedJob = normalizeFetchedJob(job, sourceUrl);
  throwIfAborted(options.abortSignal);
  const comparison = compareCv(normalizedJob, cvProfile);
  throwIfAborted(options.abortSignal);
  const ranking = await rankMatchScore({
    job: normalizedJob,
    cv: cvProfile,
    heuristics: comparison,
  });

  const llmAnalysisInput = {
    matchScore: ranking.matchScore,
    reasoning: comparison.reasoning,
    letters: {},
    analyzedAt: Date.now(),
    analysisVersion: "1.0",
  } satisfies LLMAnalysis;

  const userInteractionsInput = {
    interactionCount: 0,
  } satisfies UserInteractions;

  const llmAnalysis = llmAnalysisSchema.parse(llmAnalysisInput);
  const userInteractions = userInteractionsSchema.parse(userInteractionsInput);

  const record = analysisStorage.save({
    id: Date.now(),
    job: normalizedJob,
    cv: cvProfile,
    llmAnalysis,
    userInteractions,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }, "server");

  console.info(`[jobPipeline] analyzed job id=${record.id} score=${llmAnalysis.matchScore} source=${ranking.source}`);

  return record;
}

function buildFetchOptions(overrides: Partial<FetchJobAdOptions> | undefined): FetchJobAdOptions {
  return {
    timeoutMs: overrides?.timeoutMs ?? JOB_PIPELINE_DEFAULTS.timeoutMs,
    retryCount: overrides?.retryCount ?? JOB_PIPELINE_DEFAULTS.retryCount,
    clearJobAdData: overrides?.clearJobAdData ?? false,
  } satisfies FetchJobAdOptions;
}

async function resolveJobHtml(
  source: JobHtmlSource,
  options: AnalyzeJobOptions,
): Promise<{ html: string; sourceUrl?: string }> {
  if (source.jobUrl) {
    const fetchOptions = buildFetchOptions({
      ...(options.fetchOptions ?? {}),
      clearJobAdData: options.clearJobAdData,
    });

    const html = await fetchJobAd(source.jobUrl, fetchOptions);
    return { html, sourceUrl: source.jobUrl };
  }

  if (source.rawHtml) {
    return { html: source.rawHtml };
  }

  throw new Error("No job content provided");
}

function normalizeFetchedJob(job: JobAdParsed, sourceUrl?: string): JobAdFetched {
  return jobAdFetchedSchema.parse({
    ...job,
    fetchedAt: Date.now(),
    sourceDomain: sourceUrl ? new URL(sourceUrl).hostname : undefined,
  });
}

function buildPageUrl(baseUrl: string, pageNumber: number): string {
  const url = new URL(baseUrl);
  url.searchParams.set("page", String(pageNumber));
  return url.toString();
}

function parseNonNegativeInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) {
    throw new Error("Job analysis aborted");
  }
}
