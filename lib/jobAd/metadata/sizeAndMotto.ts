import type { JobAdParsed } from "../../schemas";

import { MOTTO_KEYWORDS, SIZE_REGEX } from "./constants";

export function extractSize(text: string): JobAdParsed["size"] | undefined {
  const match = text.match(SIZE_REGEX);
  if (!match) return undefined;

  const value = Number.parseInt(match[1], 10);
  if (Number.isNaN(value)) return undefined;
  if (value < 5) return "5";
  if (value < 10) return "5";
  if (value < 20) return "10";
  if (value < 50) return "20";
  if (value < 100) return "50";
  if (value < 200) return "100";
  if (value < 500) return "200";
  return "500";
}

export function extractMotto(text: string): string | undefined {
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (MOTTO_KEYWORDS.some((keyword) => lower.includes(keyword))) {
      return sentence.trim();
    }
  }
  return undefined;
}
