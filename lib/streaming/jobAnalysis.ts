import type { CVProfile } from "@/lib/schemas";
import type { AnalysisRecord } from "@/lib/types";
import {
  analyzeJob as analyzeJobCore,
  JOB_PIPELINE_DEFAULTS,
  type AnalyzeJobOptions,
  type JobHtmlSource,
} from "@/lib/jobPipeline";

export async function analyzeSingleJob(
  source: JobHtmlSource,
  cvProfile: CVProfile,
  options: { clearJobAdData?: boolean } = {},
  abortController?: AbortController,
): Promise<AnalysisRecord> {
  const analyzeOptions: AnalyzeJobOptions = {
    clearJobAdData: options.clearJobAdData,
    fetchOptions: {
      timeoutMs: JOB_PIPELINE_DEFAULTS.timeoutMs,
      retryCount: JOB_PIPELINE_DEFAULTS.retryCount,
      clearJobAdData: options.clearJobAdData,
    },
    abortSignal: abortController?.signal,
  };

  return analyzeJobCore(source, cvProfile, analyzeOptions);
}
