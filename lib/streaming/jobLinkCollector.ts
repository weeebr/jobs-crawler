import type { FetchJobAdOptions } from "@/lib/fetchJobAd";
import {
  collectJobLinks as collectJobLinksCore,
  JOB_PIPELINE_DEFAULTS,
  type LinkCollectionProgress,
} from "@/lib/jobPipeline";

export { type LinkCollectionProgress } from "@/lib/jobPipeline";

export async function collectJobLinks(
  searchUrl: string,
  fetchOptions: FetchJobAdOptions,
): Promise<{ jobLinks: string[]; fetchedPages: number }> {
  return collectJobLinksCore(searchUrl, {
    fetchOptions,
    maxPages: JOB_PIPELINE_DEFAULTS.maxSearchPages,
  });
}

export async function collectJobLinksWithProgress(
  searchUrl: string,
  fetchOptions: FetchJobAdOptions,
  onProgress: (progress: LinkCollectionProgress) => void,
): Promise<{ jobLinks: string[]; fetchedPages: number }> {
  return collectJobLinksCore(searchUrl, {
    fetchOptions,
    maxPages: JOB_PIPELINE_DEFAULTS.maxSearchPages,
    onProgress,
  });
}
