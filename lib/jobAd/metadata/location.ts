import { load } from "cheerio";
import { extractEnhancedMetadata } from "./structuredExtractor";
import { filterEmptyValue } from "./filterUtils";
import { normalizeLocationLabel } from "./locationUtils";

export function extractLocation(
  $: ReturnType<typeof load>,
  text: string,
): string | undefined {
  // Try structured extraction first
  const structured = extractEnhancedMetadata($, $.html(), text);
  if (structured.location) {
    const normalizedStructured = normalizeLocationLabel(structured.location);
    if (normalizedStructured && isValidLocation(normalizedStructured)) {
      return normalizedStructured;
    }
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
    if (filtered) {
      const normalized = normalizeLocationLabel(filtered);
      if (normalized && isValidLocation(normalized)) {
        return normalized;
      }
    }
  }

  const locationLine = extractLocationFromText(text);
  const filtered = filterEmptyValue(locationLine || undefined);
  if (!filtered) {
    return undefined;
  }
  const normalized = normalizeLocationLabel(filtered);
  return normalized && isValidLocation(normalized) ? normalized : undefined;
}

function extractLocationFromText(text: string): string | null {
  const lines = text.split(/\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // Look for explicit location patterns first
    const locationMatch = trimmed.match(/(?:location|city|place)[:]\s*([^\n]+)/i);
    if (locationMatch && locationMatch[1]) {
      const candidate = locationMatch[1].trim();
      const filtered = filterEmptyValue(candidate);
      if (filtered) {
        const normalized = normalizeLocationLabel(filtered);
        if (normalized && isValidLocation(normalized)) {
          return normalized;
        }
      }
    }

    // Only consider lines that explicitly mention location
    if (trimmed.toLowerCase().includes('location') || 
        trimmed.toLowerCase().includes('city') || 
        trimmed.toLowerCase().includes('place')) {
      const filtered = filterEmptyValue(trimmed);
      if (filtered) {
        const normalized = normalizeLocationLabel(filtered);
        if (normalized && isValidLocation(normalized) && normalized.length >= 2 && normalized.length <= 80) {
          return normalized;
        }
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

  if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(trimmed)) {
    return false;
  }

  if (/[{}[\]<>|]/.test(trimmed)) {
    return false;
  }

  const allowedPattern = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s,.'()\/&+\-\u2013\u2014]+$/u;
  return allowedPattern.test(trimmed);
}
