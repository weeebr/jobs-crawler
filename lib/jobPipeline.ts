import { fetchJobAd, type FetchJobAdOptions } from "./fetchJobAd";
import { parseJobAd } from "./parseJobAd";
import { compareCv } from "./compareCv";
import { rankMatchScore } from "./rankMatch";
import { analysisStorage } from "./analysisStorageHandler";
import { extractJobLinks } from "./extractJobLinks";
import { jobAdFetchedSchema, llmAnalysisSchema, userInteractionsSchema, type CVProfile, type JobAdParsed, type JobAdFetched, type LLMAnalysis, type UserInteractions, type AnalysisRecord } from "./schemas";

export const JOB_PIPELINE_DEFAULTS = Object.freeze({
  timeoutMs: 8_000,
  retryCount: 2,
  maxSearchPages: 12,
});

export type LinkCollectionProgress = { message: string; total: number; completed: number };
export type CollectJobLinksOptions = { fetchOptions?: Partial<FetchJobAdOptions>; maxPages?: number; onProgress?: (progress: LinkCollectionProgress) => void };
export type JobHtmlSource = { jobUrl?: string; rawHtml?: string };
export type AnalyzeJobOptions = { fetchOptions?: Partial<FetchJobAdOptions>; clearJobAdData?: boolean; abortSignal?: AbortSignal };

export async function collectJobLinks(
  searchUrl: string,
  options: CollectJobLinksOptions = {},
): Promise<{ jobLinks: string[]; fetchedPages: number }> {
  const initialUrl = new URL(searchUrl);
  const initialPage = (() => {
    const value = initialUrl.searchParams.get("page");
    if (!value) return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  })() ?? 1;
  const normalizedInitialUrl = initialUrl.toString();

  const seen = new Set<string>();
  let fetchedPages = 0;

  const fetchOptions: FetchJobAdOptions = {
    timeoutMs: options.fetchOptions?.timeoutMs ?? JOB_PIPELINE_DEFAULTS.timeoutMs,
    retryCount: options.fetchOptions?.retryCount ?? JOB_PIPELINE_DEFAULTS.retryCount,
    clearJobAdData: options.fetchOptions?.clearJobAdData ?? false,
  };
  const maxPages = options.maxPages ?? JOB_PIPELINE_DEFAULTS.maxSearchPages;

  for (let offset = 0; offset < maxPages; offset += 1) {
    const pageNumber = initialPage + offset;
    const pageUrl = offset === 0 ? normalizedInitialUrl : (() => {
      const url = new URL(normalizedInitialUrl);
      url.searchParams.set("page", String(pageNumber));
      return url.toString();
    })();

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
  apiKey?: string,
): Promise<AnalysisRecord> {
  if (options.abortSignal?.aborted) throw new Error("Job analysis aborted");

  console.info(`[jobPipeline] Starting analysis for ${source.jobUrl || 'unknown URL'}`);

  const { html, sourceUrl } = source.jobUrl ? await (async () => {
    const fetchOptions: FetchJobAdOptions = {
      timeoutMs: options.fetchOptions?.timeoutMs ?? JOB_PIPELINE_DEFAULTS.timeoutMs,
      retryCount: options.fetchOptions?.retryCount ?? JOB_PIPELINE_DEFAULTS.retryCount,
      clearJobAdData: options.clearJobAdData ?? false,
    };
    return { html: await fetchJobAd(source.jobUrl!, fetchOptions), sourceUrl: source.jobUrl };
  })() : source.rawHtml ? { html: source.rawHtml } : (() => { throw new Error("No job content provided"); })();
  if (options.abortSignal?.aborted) throw new Error("Job analysis aborted");

  console.info(`[jobPipeline] Fetched HTML for ${sourceUrl}, length: ${html.length}`);

  // Parse job ad with skip handling
  let job;
  try {
    job = await parseJobAd(html, { sourceUrl });
    console.info(`[jobPipeline] Successfully parsed job: ${job.title} at ${job.company}`);
  } catch (error) {
    console.error(`[jobPipeline] Failed to parse job ad for ${sourceUrl}:`, error);
    if (error instanceof Error && error.message.startsWith('SKIP_JOB:')) {
      throw new Error(`Job skipped due to empty title: ${sourceUrl}`);
    }
    throw error;
  }

  const normalizedJob = jobAdFetchedSchema.parse({ ...job, fetchedAt: Date.now(), sourceDomain: sourceUrl ? new URL(sourceUrl).hostname : undefined });
  if (options.abortSignal?.aborted) throw new Error("Job analysis aborted");
  const comparison = compareCv(normalizedJob, cvProfile);
  if (options.abortSignal?.aborted) throw new Error("Job analysis aborted");
  const ranking = await rankMatchScore({
    job: normalizedJob,
    cv: cvProfile,
    heuristics: comparison,
  });

  const llmAnalysis = llmAnalysisSchema.parse({
    matchScore: ranking.matchScore,
    reasoning: comparison.reasoning,
    letters: {},
    analyzedAt: Date.now(),
    analysisVersion: "1.0",
  } satisfies LLMAnalysis);

  const userInteractions = userInteractionsSchema.parse({ interactionCount: 0, isNewThisRun: false } satisfies UserInteractions);

  const recordToSave = {
    id: Date.now(),
    job: normalizedJob,
    cv: cvProfile,
    llmAnalysis,
    userInteractions,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  } as const;

  // Additional validation to ensure title is not lost
  if (!recordToSave.job.title || recordToSave.job.title.trim() === '') {
    console.error(`[jobPipeline] ERROR - Title is null or empty before save:`, {
      title: recordToSave.job.title,
      company: recordToSave.job.company,
      sourceUrl: recordToSave.job.sourceUrl,
    });
    throw new Error(`Cannot save record with null/empty title: ${recordToSave.job.title}`);
  }

  const record = await analysisStorage.save(apiKey || "default-user", recordToSave);

  console.info(`[jobPipeline] analyzed job id=${record.id} score=${llmAnalysis.matchScore} source=${ranking.source}`);

  return record;
}

export async function analyzeJobsInParallel(
  jobLinks: string[],
  cvProfile: CVProfile,
  options: AnalyzeJobOptions = {},
  apiKey?: string,
): Promise<{ records: AnalysisRecord[]; errors: { url: string; message: string }[] }> {
  const records: AnalysisRecord[] = [];
  const errors: { url: string; message: string }[] = [];

  const analysisPromises = jobLinks.map(async (link, index) => {
    if (options.abortSignal?.aborted) throw new Error("Job analysis aborted");

    try {
      console.info(`[jobPipeline] Queueing analysis for job ${index + 1}/${jobLinks.length}: ${link}`);
      const record = await analyzeJob({ jobUrl: link }, cvProfile, options, apiKey);
      console.info(`[jobPipeline] Successfully analyzed job ${index + 1}/${jobLinks.length}: ${record.job.title} at ${record.job.company}`);
      return record;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown analysis failure";
      console.warn(`[jobPipeline] Failed to analyze job ${index + 1}/${jobLinks.length}: ${link}`, error);
      throw { url: link, message };
    }
  });

  // Wait for all analyses to complete, handling failures gracefully
  const results = await Promise.allSettled(analysisPromises);
  for (const result of results) {
    if (result.status === 'fulfilled') {
      records.push(result.value);
    } else {
      errors.push(result.reason);
    }
  }

  console.info(`[jobPipeline] Parallel analysis complete: ${records.length} successful, ${errors.length} failed`);
  return { records, errors };
}
