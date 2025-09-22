import { load } from "cheerio";

import type { ReadableContent } from "./readability";

export function selectTitle($: ReturnType<typeof load>): string | undefined {
  const metaCandidates = [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[name="title"]',
  ];

  for (const selector of metaCandidates) {
    const content = $(selector).attr("content");
    if (content) return content;
  }

  const heading = $("h1").first().text();
  if (heading) return heading;

  const title = $("title").text();
  return title || undefined;
}

export function selectCompany($: ReturnType<typeof load>): string | undefined {
  // First try the specific data-cy selector for company link
  const companyLink = $('[data-cy="company-link"] span').first().text();
  if (companyLink) return companyLink;

  const companySelectors = [
    'meta[property="og:site_name"]',
    'meta[name="twitter:data1"]',
    'meta[name="company"]',
  ];

  for (const selector of companySelectors) {
    const content = $(selector).attr("content");
    if (content) return content;
  }

  const structured =
    $("[itemprop='hiringOrganization'] [itemprop='name']").first().text() ||
    $("[data-company]").first().text() ||
    $(".company, .company-name").first().text();

  return structured || undefined;
}

export function guessCompanyFromUrl(url?: string): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const parts = host.split(".");

    if (parts.length >= 2) {
      return parts[parts.length - 2]
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    return host;
  } catch {
    return undefined;
  }
}

export function fallbackTitle(readable: ReadableContent) {
  return readable.title;
}

export function selectCompanyUrl($: ReturnType<typeof load>): string | undefined {
  // Extract company URL from data-cy="company-url" anchor tag
  const companyUrlElement = $('[data-cy="company-url"]');
  if (companyUrlElement.length) {
    const href = companyUrlElement.attr('href');
    if (href && isValidUrl(href)) return href;
  }
  
  // Fallback: try to find company link in various selectors
  const companyLinkSelectors = [
    '[data-cy="company-link"]',
    '.company a',
    '.company-name a',
    '[itemprop="hiringOrganization"] a'
  ];
  
  for (const selector of companyLinkSelectors) {
    const element = $(selector).first();
    if (element.length) {
      const href = element.attr('href');
      if (href && isValidUrl(href)) return href;
    }
  }
  
  return undefined;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function fallbackCompany(readable: ReadableContent) {
  // Removed fragile regex pattern matching
  // If we can't extract company from structured data, the job ad is malformed
  return undefined;
}
