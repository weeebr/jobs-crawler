import { filterDurationValue } from "./filterUtils";

// Helper to extract metadata using regex patterns
function extractByPatterns(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const trimmed = match[1].trim();
      const filtered = filterDurationValue(trimmed);
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

export { extractByPatterns, extractEmploymentType, transformEmploymentType };
