import { load } from "cheerio";
import { extractStructuredMetadata } from "./structuredExtraction";
import { extractSemanticMetadata } from "./semanticExtraction";

export interface StructuredMetadata {
  workload?: string;
  duration?: string;
  language?: string;
  location?: string;
  publishedAt?: string;
  salary?: string;
  companySize?: string;
}

// Enhanced metadata extraction that tries structured first, then falls back to semantic
export function extractEnhancedMetadata(
  $: ReturnType<typeof load>,
  html: string,
  text: string,
): StructuredMetadata {
  // Try structured extraction first
  const structured = extractStructuredMetadata($);

  // If we got good results, return them
  if (Object.keys(structured).length > 0) {
    // If structured extraction didn't find companySize, try semantic extraction for it
    if (!structured.companySize) {
      const semantic = extractSemanticMetadata($, text);
      if (semantic.companySize) {
        structured.companySize = semantic.companySize;
      }
    }
    return structured;
  }

  // Fall back to semantic extraction
  return extractSemanticMetadata($, text);
}
