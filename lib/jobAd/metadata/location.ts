import { load } from "cheerio";
import { extractEnhancedMetadata } from "./structuredExtractor";
import { filterEmptyValue } from "./filterUtils";

export function extractLocation(
  $: ReturnType<typeof load>,
  text: string,
): string | undefined {
  // Try structured extraction first
  const structured = extractEnhancedMetadata($, $.html(), text);
  if (structured.location) {
    return structured.location;
  }

  // Fallback to original logic
  const selectors = [
    "[itemprop='jobLocation'] [itemprop='addressLocality']",
    "[itemprop='addressLocality']",
    "[data-testid='job-location']",
    "[data-qa='job-location']",
    "[data-field='location']",
    ".job-location",
    ".listing-location",
    "[class*='location']",
  ];

  for (const selector of selectors) {
    const candidate = $(selector).first().text().trim();
    const filtered = filterEmptyValue(candidate);
    if (filtered && isValidLocation(filtered)) {
      return filtered.replace(/\s+/g, " ");
    }
  }

  const locationLine = extractLocationFromText(text);
  const filtered = filterEmptyValue(locationLine || undefined);
  return filtered || undefined;
}

function extractLocationFromText(text: string): string | null {
  const lines = text.split(/\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // Look for explicit location patterns first
    const locationMatch = trimmed.match(/(?:location|city|place)[:]\s*([A-Za-z\s,.-]+)/i);
    if (locationMatch && locationMatch[1]) {
      const candidate = locationMatch[1].trim();
      const filtered = filterEmptyValue(candidate);
      if (filtered && isValidLocation(filtered)) {
        return filtered;
      }
    }

    // Only consider lines that explicitly mention location
    if (trimmed.toLowerCase().includes('location') || 
        trimmed.toLowerCase().includes('city') || 
        trimmed.toLowerCase().includes('place')) {
      const filtered = filterEmptyValue(trimmed);
      if (filtered && isValidLocation(filtered) && filtered.length >= 2 && filtered.length <= 30) {
        return filtered;
      }
    }
  }

  return null;
}

function isValidLocation(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return false;

  if (
    trimmed.includes("://") ||
    trimmed.includes("LOCATIONIQ_MAPS_KEY") ||
    trimmed.includes("Starting date") ||
    trimmed.includes("Founded in") ||
    trimmed.includes("your application cannot be considered") ||
    trimmed.includes("Lambda Health System") ||
    trimmed.match(/^[A-Z_]+$/)
  ) {
    return false;
  }

  return /^[A-Za-z\s,.-]+$/.test(trimmed) && trimmed.length <= 50;
}
