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
    if (content && content.trim()) return content.trim();
  }

  const heading = $("h1").first().text();
  if (heading && heading.trim()) return heading.trim();

  const title = $("title").text();
  return (title && title.trim()) || undefined;
}

export function selectCompany($: ReturnType<typeof load>): string | undefined {
  // First try the specific data-cy selector for company link
  const companyLink = $('[data-cy="company-link"] span').first().text();
  if (companyLink && companyLink.trim()) return companyLink.trim();

  const companySelectors = [
    'meta[property="og:site_name"]',
    'meta[name="twitter:data1"]',
    'meta[name="company"]',
  ];

  for (const selector of companySelectors) {
    const content = $(selector).attr("content");
    if (content && content.trim()) return content.trim();
  }

  const structured =
    $("[itemprop='hiringOrganization'] [itemprop='name']").first().text() ||
    $("[data-company]").first().text() ||
    $(".company, .company-name").first().text();

  if (structured && structured.trim()) return structured.trim();

  // Fallback: try to extract company from title
  const title = $('title').text() || '';
  const titleMatch = title.match(/at (.+?) - jobs\.ch/);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }

  return undefined;
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

export function fallbackCompany() {
  // Removed fragile regex pattern matching
  // If we can't extract company from structured data, the job ad is malformed
  return undefined;
}

export function generateFallbackTitle(sourceUrl?: string): string {
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.length > 0) {
        // Convert URL slug to readable title
        return lastPart
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
      }
    } catch {
      // Ignore URL parsing errors
    }
  }
  return "Job Position";
}

export function generateFallbackCompany(sourceUrl?: string): string {
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      const hostname = url.hostname.replace(/^www\./, '');
      const parts = hostname.split('.');

      // For common job board domains, try to extract company from subdomain
      if (parts.length >= 3) {
        const subdomain = parts[0];
        if (subdomain && subdomain.length > 0 && !['www', 'jobs', 'careers', 'hiring'].includes(subdomain)) {
          return subdomain.charAt(0).toUpperCase() + subdomain.slice(1);
        }
      }

      // For company career pages, the domain itself might be the company
      if (parts.length >= 2) {
        const domain = parts[parts.length - 2];
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }
  return "Company";
}
