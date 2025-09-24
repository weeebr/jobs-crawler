import { load } from "cheerio";

const DETAIL_SELECTOR = '[href*="/vacancies/detail"],[href*="/jobs/job"]';
export function extractJobLinks(html: string, baseUrl: string): string[] {
  if (!html) return [];
  const $ = load(html);
  const resolved = new Set<string>();

  console.info(`[extractJobLinks] searching for job links in ${baseUrl}`);
  console.info(`[extractJobLinks] found ${$(DETAIL_SELECTOR).length} potential job links`);

  $(DETAIL_SELECTOR).each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    const absolute = normalizeUrl(href, baseUrl);
    if (!absolute) {
      console.warn(`[extractJobLinks] failed to normalize URL: ${href}`);
      return;
    }

    console.info(`[extractJobLinks] extracted job URL: ${absolute}`);
    resolved.add(absolute);
  });

  console.info(`[extractJobLinks] returning ${resolved.size} unique job URLs`);
  return Array.from(resolved);
}

function normalizeUrl(href: string, baseUrl: string): string | null {
  try {
    const url = new URL(href, baseUrl);
    return url.toString();
  } catch {
    return null;
  }
}
