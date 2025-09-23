import { load } from "cheerio";
import { filterEmptyValue, filterDurationValue } from "./filterUtils";
import { normalizeLocationLabel } from "./locationUtils";

// Enhanced metadata extraction leveraging structured HTML (jobs.ch-style)

export interface StructuredMetadata {
  workload?: string;
  duration?: string;
  language?: string;
  location?: string;
  publishedAt?: string;
  salary?: string;
  teamSize?: string;
}

// Extract metadata from structured HTML using data attributes and semantic selectors
export function extractStructuredMetadata(
  $: ReturnType<typeof load>,
  html: string,
): StructuredMetadata {
  const metadata: StructuredMetadata = {};

  // Extract workload using data-cy attribute (jobs.ch specific)
  const workloadElement = $('[data-cy="info-workload"]');
  if (workloadElement.length) {
    const workloadText = workloadElement.find('span:contains("Workload:")').next().text().trim();
    const filtered = filterEmptyValue(workloadText);
    if (filtered) {
      metadata.workload = filtered;
    }
  }

  // Extract contract type using data-cy attribute
  const contractElement = $('[data-cy="info-contract"]');
  if (contractElement.length) {
    const contractText = contractElement.find('span:contains("Contract type:")').next().text().trim();
    const filtered = filterDurationValue(contractText);
    if (filtered) {
      // Transform employment type to remove common suffixes
      const transformed = transformEmploymentType(filtered);
      const finalFiltered = filterDurationValue(transformed);
      if (finalFiltered) {
        metadata.duration = finalFiltered;
      }
    }
  }

  // Extract language requirements
  const languageElement = $('[data-cy="info-language"]');
  if (languageElement.length) {
    const languageText = languageElement.find('span:contains("Language:")').next().text().trim();
    const filtered = filterEmptyValue(languageText);
    if (filtered) {
      metadata.language = filtered;
    }
  }

  // Extract location
  const locationElement = $('[data-cy="info-location-link"]');
  if (locationElement.length) {
    const locationText = locationElement.text().trim();
    const filtered = filterEmptyValue(locationText);
    if (filtered) {
      const normalized = normalizeLocationLabel(filtered);
      if (normalized) {
        metadata.location = normalized;
      }
    }
  }

  // Extract publication date
  const publicationElement = $('[data-cy="info-publication"]');
  if (publicationElement.length) {
    const publicationText = publicationElement.find('span:contains("Publication date:")').next().text().trim();
    const filtered = filterEmptyValue(publicationText);
    if (filtered) {
      metadata.publishedAt = filtered;
    }
  }

  // Extract salary estimate
  const salaryElement = $('[data-cy="info-salary_estimate"]');
  if (salaryElement.length) {
    const salaryText = salaryElement.find('span:contains("Salary estimate")').next().text().trim();
    const filtered = filterEmptyValue(salaryText);
    if (filtered) {
      metadata.salary = filtered;
    }
  }

  // Extract team size
  const teamSizeElement = $('[data-cy="info-team_size"]');
  if (teamSizeElement.length) {
    const teamSizeText = teamSizeElement.find('span:contains("Team size:")').next().text().trim();
    const filtered = filterEmptyValue(teamSizeText);
    if (filtered) {
      metadata.teamSize = filtered;
      console.info(`[extractStructuredMetadata] found teamSize: "${filtered}"`);
    }
  }
  

  return metadata;
}

// Helper to extract metadata using regex patterns
function extractByPatterns(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const trimmed = match[1].trim();
      const filtered = filterEmptyValue(trimmed);
      if (filtered) {
        return filtered;
      }
    }
  }
  return undefined;
}

// Extract employment type with proper transformation
function extractEmploymentType(text: string): string | undefined {
  // First try to match employment types with optional "employment" suffix
  const employmentMatch = text.match(/\b(unlimited|permanent|temporary|fixed-term|part-time|full-time)(?:\s+employment)?\b/i);
  if (employmentMatch && employmentMatch[1]) {
    const employmentType = employmentMatch[1].trim();
    const filtered = filterDurationValue(employmentType);
    if (filtered) {
      return filtered;
    }
  }
  
  // Fallback to contract type pattern
  const contractMatch = text.match(/contract type[:\s-]*([^.\n]+)/i);
  if (contractMatch && contractMatch[1]) {
    const contractType = contractMatch[1].trim();
    const filtered = filterDurationValue(contractType);
    if (filtered) {
      // Transform common employment types
      const transformed = transformEmploymentType(filtered);
      const finalFiltered = filterDurationValue(transformed);
      return finalFiltered;
    }
  }
  
  return undefined;
}

// Transform employment type strings to remove common suffixes
function transformEmploymentType(type: string): string {
  const lower = type.toLowerCase();
  
  // Remove common suffixes
  if (lower.endsWith(' employment')) {
    return type.slice(0, -11); // Remove " employment"
  }
  if (lower.endsWith(' contract')) {
    return type.slice(0, -9); // Remove " contract"
  }
  if (lower.endsWith(' position')) {
    return type.slice(0, -10); // Remove " position"
  }
  
  return type;
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

  // Team size patterns - more specific to avoid false matches
  const teamSizePatterns = [
    // Specific team size mentions with numbers
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
  
  // Extract team size and normalize to single word
  const extractedTeamSize = extractByPatterns(text, teamSizePatterns);
  if (extractedTeamSize) {
    // Normalize to single word - extract the most important descriptor
    if (extractedTeamSize.toLowerCase().includes('klein') || extractedTeamSize.toLowerCase().includes('small')) {
      metadata.teamSize = 'klein';
    } else if (extractedTeamSize.toLowerCase().includes('agil') || extractedTeamSize.toLowerCase().includes('agile')) {
      metadata.teamSize = 'agil';
    } else {
      metadata.teamSize = extractedTeamSize;
    }
  }

  return metadata;
}

// Enhanced metadata extraction that tries structured first, then falls back to semantic
export function extractEnhancedMetadata(
  $: ReturnType<typeof load>,
  html: string,
  text: string,
): StructuredMetadata {
  // Try structured extraction first
  const structured = extractStructuredMetadata($, html);
  
  // If we got good results, return them
  if (Object.keys(structured).length > 0) {
    // If structured extraction didn't find teamSize, try semantic extraction for it
    if (!structured.teamSize) {
      const semantic = extractSemanticMetadata($, text);
      if (semantic.teamSize) {
        structured.teamSize = semantic.teamSize;
      }
    }
    return structured;
  }

  // Fall back to semantic extraction
  return extractSemanticMetadata($, text);
}
