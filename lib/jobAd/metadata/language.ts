import { load } from "cheerio";
import { extractEnhancedMetadata } from "./structuredExtractor";
import { filterEmptyValue } from "./filterUtils";

export function extractLanguage(
  $: ReturnType<typeof load>,
  text: string,
): string | undefined {
  // Try structured extraction first
  const structured = extractEnhancedMetadata($, $.html(), text);
  if (structured.language) {
    return structured.language;
  }

  // Fallback to semantic extraction
  const languagePatterns = [
    /language[:\s-]*([^.\n]+)/i,
    /languages[:\s-]*([^.\n]+)/i,
    /language requirements[:\s-]*([^.\n]+)/i,
    /required languages[:\s-]*([^.\n]+)/i,
  ];

  for (const pattern of languagePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const language = match[1].trim();
      const filtered = filterEmptyValue(language);
      if (filtered && isValidLanguage(filtered)) {
        return filtered;
      }
    }
  }

  return undefined;
}

function isValidLanguage(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return false;

  // Common language patterns
  const languageKeywords = [
    'english', 'german', 'french', 'spanish', 'italian', 'portuguese',
    'dutch', 'swedish', 'norwegian', 'danish', 'finnish', 'polish',
    'russian', 'chinese', 'japanese', 'korean', 'arabic', 'hindi',
    'fluent', 'native', 'intermediate', 'beginner', 'advanced',
    'conversational', 'business', 'technical'
  ];

  const lowerText = trimmed.toLowerCase();
  return languageKeywords.some(keyword => lowerText.includes(keyword));
}
