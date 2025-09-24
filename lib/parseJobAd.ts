import { load } from "cheerio";

import { classifyJobSections } from "./classifyJobSections";
import { extractTech } from "./extractTech";
import { getReadableContent } from "./jobAd/readability";
import {
  fallbackCompany,
  fallbackTitle,
  generateFallbackCompany,
  generateFallbackTitle,
  guessCompanyFromUrl,
  selectCompany,
  selectCompanyUrl,
  selectTitle,
} from "./jobAd/titleAndCompany";
import { collectJobSectionsHeuristic } from "./jobAd/sections";
import {
  extractDuration,
  extractLanguage,
  extractLocation,
  extractPublishedAt,
  extractSize,
  normalizeLocationLabel,
  extractWorkload,
} from "./jobAd/metadata";
import { extractEnhancedMetadata } from "./jobAd/metadata/structuredExtractor";
import { filterEmptyValue } from "./jobAd/metadata/filterUtils";
import { extractMottoLLM } from "./jobAd/metadata/mottoLLM";
import { jobAdFetchedSchema, type JobAdParsed } from "./schemas";

export interface ParseJobAdOptions {
  sourceUrl?: string;
}

export async function parseJobAd(
  html: string,
  options: ParseJobAdOptions = {},
): Promise<JobAdParsed> {
  if (!html || !html.trim()) {
    throw new Error("Empty job ad HTML");
  }

  const $ = load(html);
  const readable = getReadableContent(html, options.sourceUrl);

  // Simple title extraction - skip if empty
  const rawTitle = selectTitle($) ?? '';
  const title = rawTitle.trim();

  if (!title) {
    const fullJobData = {
      sourceUrl: options.sourceUrl,
      htmlLength: html.length,
      hasTitleTag: $('title').length > 0,
      titleTagContent: $('title').text().trim(),
      hasH1: $('h1').length > 0,
      h1Content: $('h1').text().trim(),
      hasMain: $('main').length > 0,
      mainContent: $('main').text().trim().substring(0, 200) + '...',
    };

    console.error('[parseJobAd] SKIPPING JOB - Empty title detected:', fullJobData);
    console.error('[parseJobAd] JOB URL:', options.sourceUrl);

    throw new Error(`SKIP_JOB: Empty title for ${options.sourceUrl}`);
  }

  const company = selectCompany($) || guessCompanyFromUrl(options.sourceUrl) || fallbackCompany() || generateFallbackCompany(options.sourceUrl);
  const companyUrl = selectCompanyUrl($);

  const combinedText = [
    $("main").text(),
    $("body").text(),
    readable.textContent,
  ]
    .filter(Boolean)
    .join("\n");

  const stack = extractTech(combinedText);
  const heuristicSections = collectJobSectionsHeuristic($, readable.contentHtml);
  const classifiedSections = await classifyJobSections({
    html,
    sourceUrl: options.sourceUrl,
    heuristics: heuristicSections,
  });
  const sections = classifiedSections ?? heuristicSections;
  const size = extractSize(combinedText);
  
  // Use LLM-based motto extraction with high confidence requirement
  const mottoResult = await extractMottoLLM(combinedText, company.trim(), options.sourceUrl);
  const motto = mottoResult.motto === "-" ? undefined : mottoResult.motto; // Convert "-" to undefined for schema compatibility
  const mottoOrigin = mottoResult.origin; // Store origin information
  
  // Try structured extraction first, then fall back to individual extractors
  const structuredMetadata = extractEnhancedMetadata($, html, combinedText);
  
  const publishedAt = structuredMetadata.publishedAt || extractPublishedAt($);
  const structuredLocation = normalizeLocationLabel(structuredMetadata.location);
  const location = structuredLocation || extractLocation($, combinedText);
  const workload = structuredMetadata.workload || extractWorkload($, combinedText);
  const duration = structuredMetadata.duration || extractDuration($, combinedText);
  const language = structuredMetadata.language || extractLanguage($, combinedText);
  const companySize = structuredMetadata.companySize;

  // Use shared filterEmptyValue utility

  const parsed: JobAdParsed = {
    title: title,
    company: company.trim(),
    companyUrl,
    stack,
    qualifications: sections.qualifications,
    roles: sections.roles,
    benefits: sections.benefits,
    sourceUrl: options.sourceUrl,
    jobUrl: options.sourceUrl,
    size,
    motto,
    mottoOrigin,
    publishedAt: filterEmptyValue(publishedAt),
    location: filterEmptyValue(location),
    workload: filterEmptyValue(workload),
    duration: filterEmptyValue(duration),
    language: filterEmptyValue(language),
    companySize: filterEmptyValue(companySize),
    fetchedAt: Date.now(),
    sourceDomain: options.sourceUrl ? new URL(options.sourceUrl).hostname : undefined,
  };

  console.info(
    `[parseJobAd] SUCCESS: title="${parsed.title}" company="${parsed.company}" stack=${parsed.stack.length} quals=${parsed.qualifications.length} roles=${parsed.roles.length} benefits=${parsed.benefits.length} motto="${motto || 'none'}" url=${options.sourceUrl}`,
  );

  // Validate but don't throw on missing data - return partial results
  try {
    return jobAdFetchedSchema.parse(parsed);
  } catch (error) {
    console.warn('[parseJobAd] Schema validation failed, returning partial data:', error);
    // Return the parsed data even if validation fails, but log the issue
    return parsed as JobAdParsed;
  }
}
