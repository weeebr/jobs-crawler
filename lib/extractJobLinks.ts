import { load } from "cheerio";

const DETAIL_SELECTOR = '[href*="/vacancies/detail"],[href*="/jobs/job"]';
export function extractJobLinks(html: string, baseUrl: string): string[] {
  if (!html) return [];
  const $ = load(html);
  const resolved = new Set<string>();

  $(DETAIL_SELECTOR).each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    const absolute = normalizeUrl(href, baseUrl);
    if (!absolute) return;
    resolved.add(absolute);
  });

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
