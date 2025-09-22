import { fetchJobAd, type FetchJobAdOptions } from "@/lib/fetchJobAd";
import { extractJobLinks } from "@/lib/extractJobLinks";

const MAX_SEARCH_PAGES = 12;

export interface LinkCollectionProgress {
  message: string;
  total: number;
  completed: number;
}

export async function collectJobLinks(
  searchUrl: string,
  fetchOptions: FetchJobAdOptions,
): Promise<{ jobLinks: string[]; fetchedPages: number }> {
  const initialUrl = new URL(searchUrl);
  const initialPage =
    parseNonNegativeInt(initialUrl.searchParams.get("page")) ?? 1;
  const normalizedInitialUrl = initialUrl.toString();

  const seen = new Set<string>();
  let fetchedPages = 0;

  for (let offset = 0; offset < MAX_SEARCH_PAGES; offset += 1) {
    const pageNumber = initialPage + offset;
    const pageUrl =
      offset === 0
        ? normalizedInitialUrl
        : buildPageUrl(normalizedInitialUrl, pageNumber);

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

    console.info(`[collectJobLinks] page ${pageNumber}: found ${resolvedLinks.length} total links, ${newLinks} new links`);

    // Critical fix: Stop when no new links are found
    if (newLinks === 0) {
      console.info(`[collectJobLinks] No new links found on page ${pageNumber}, stopping pagination`);
      break;
    }
  }

  console.info(`[collectJobLinks] completed: ${seen.size} unique job links across ${fetchedPages} pages`);
  return { jobLinks: Array.from(seen), fetchedPages };
}

export async function collectJobLinksWithProgress(
  searchUrl: string,
  fetchOptions: FetchJobAdOptions,
  onProgress: (progress: LinkCollectionProgress) => void,
): Promise<{ jobLinks: string[]; fetchedPages: number }> {
  const initialUrl = new URL(searchUrl);
  const initialPage =
    parseNonNegativeInt(initialUrl.searchParams.get("page")) ?? 1;
  const normalizedInitialUrl = initialUrl.toString();

  const seen = new Set<string>();
  let fetchedPages = 0;

  for (let offset = 0; offset < MAX_SEARCH_PAGES; offset += 1) {
    const pageNumber = initialPage + offset;
    const pageUrl =
      offset === 0
        ? normalizedInitialUrl
        : buildPageUrl(normalizedInitialUrl, pageNumber);

    onProgress({
      message: `Scanning page ${pageNumber} for job links...`,
      total: MAX_SEARCH_PAGES,
      completed: offset
    });

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

    console.info(`[collectJobLinks] page ${pageNumber}: found ${resolvedLinks.length} total links, ${newLinks} new links`);

    onProgress({
      message: `Page ${pageNumber}: found ${resolvedLinks.length} links (${newLinks} new)`,
      total: MAX_SEARCH_PAGES,
      completed: offset + 1
    });

    // Critical fix: Stop when no new links are found
    if (newLinks === 0) {
      console.info(`[collectJobLinks] No new links found on page ${pageNumber}, stopping pagination`);
      break;
    }
  }

  onProgress({
    message: `Completed: ${seen.size} unique job links across ${fetchedPages} pages`,
    total: fetchedPages,
    completed: fetchedPages
  });

  console.info(`[collectJobLinks] completed: ${seen.size} unique job links across ${fetchedPages} pages`);
  return { jobLinks: Array.from(seen), fetchedPages };
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
