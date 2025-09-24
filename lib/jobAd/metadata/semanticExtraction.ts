import { load } from "cheerio";
import { filterDurationValue } from "./filterUtils";
import { normalizeLocationLabel } from "./locationUtils";
import { extractByPatterns, extractEmploymentType } from "./employmentTypeExtractor";

export interface StructuredMetadata {
  workload?: string;
  duration?: string;
  language?: string;
  location?: string;
  publishedAt?: string;
  salary?: string;
  companySize?: string;
}

// Fallback extraction for non-structured HTML using semantic selectors
export function extractSemanticMetadata(
  $: ReturnType<typeof load>,
  text: string,
): StructuredMetadata {
  const metadata: StructuredMetadata = {};

  // Workload patterns
  const workloadPatterns = [
    /workload[:\s-]*([0-9]{1,3}\s?(?:[-–]\s?[0-9]{1,3}\s?)?%)/i,
    /pensum[:\s-]*([0-9]{1,3}\s?(?:[-–]\s?[0-9]{1,3}\s?)?%)/i,
    /employment rate[:\s-]*([0-9]{1,3}\s?(?:[-–]\s?[0-9]{1,3}\s?)?%)/i,
  ];
  metadata.workload = extractByPatterns(text, workloadPatterns);

  // Extract employment type with proper transformation
  const employmentType = extractEmploymentType(text);
  if (employmentType) {
    const filtered = filterDurationValue(employmentType);
    if (filtered) {
      metadata.duration = filtered;
    }
  }

  // Language patterns
  const languagePatterns = [
    /language[:\s-]*([^.\n]+)/i,
    /languages[:\s-]*([^.\n]+)/i,
  ];
  metadata.language = extractByPatterns(text, languagePatterns);

  // Location patterns
  const locationPatterns = [
    /place of work[:\s-]*([^.\n]+)/i,
    /location[:\s-]*([^.\n]+)/i,
    /workplace[:\s-]*([^.\n]+)/i,
  ];
  const semanticLocation = extractByPatterns(text, locationPatterns);
  if (semanticLocation) {
    const normalized = normalizeLocationLabel(semanticLocation);
    if (normalized) {
      metadata.location = normalized;
    }
  }

  // Company size patterns - more specific to avoid false matches
  const companySizePatterns = [
    // Specific company/team size mentions with numbers
    /team size[:\s-]*(\d+)/i,
    /team\s*(?:size|größe)[:\s-]*(\d+)/i,
    /(\d+)\s*(?:people|members|developers|engineers|team members)/i,
    /team of (\d+)/i,
    /(?:team|gruppe)\s*(?:von|of)\s*(\d+)/i,
    // German patterns for small/agile teams (extract just the key word)
    /klein\w*,\s*agil\w*\s*team/i,
    /agil\w*,\s*klein\w*\s*team/i,
    /kleinen,\s*agilen\s*team/i,
    /agilen,\s*kleinen\s*team/i,
    /(?:klein|small|wenig)\w*\s*(?:agil|agile)\w*\s*team/i,
    /(?:agil|agile)\w*\s*(?:klein|small|wenig)\w*\s*team/i,
  ];

  // Extract company size and normalize to single word descriptors when possible
  const extractedCompanySize = extractByPatterns(text, companySizePatterns);
  if (extractedCompanySize) {
    // Normalize to single word - extract the most important descriptor
    if (extractedCompanySize.toLowerCase().includes('klein') || extractedCompanySize.toLowerCase().includes('small')) {
      metadata.companySize = 'klein';
    } else if (extractedCompanySize.toLowerCase().includes('agil') || extractedCompanySize.toLowerCase().includes('agile')) {
      metadata.companySize = 'agil';
    } else {
      metadata.companySize = extractedCompanySize;
    }
  }

  return metadata;
}
