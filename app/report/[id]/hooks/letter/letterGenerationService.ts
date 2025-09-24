import type { AnalysisRecord } from "@/lib/types";
import type { LetterLanguage } from "@/lib/letterHelpers";
import type { LetterSource, LetterView } from "../useLetterManager";

export interface GeneratedLetter {
  language: string;
  content: string;
  generatedAt: number;
  source?: string;
}

export async function generateLetter(
  recordId: number,
  language: LetterLanguage,
  onError: (message: string) => void
): Promise<LetterView | null> {
  try {
    const response = await fetch(`/api/analysis/${recordId}/letter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message =
        typeof payload.error === "string"
          ? payload.error
          : `Letter generation failed (${response.status})`;
      onError(message);
      return null;
    }

    const data = (await response.json()) as GeneratedLetter;

    const source: LetterSource =
      data.source === "template" || data.source === "cache"
        ? data.source
        : "llm";

    return {
      original: data.content,
      draft: data.content,
      generatedAt: data.generatedAt,
      source,
    };
  } catch (error) {
    console.warn("[letterGenerationService] letter generation failed", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected letter generation error";
    onError(message);
    return null;
  }
}

export function createLetterView(
  content: string,
  generatedAt: number,
  source: LetterSource
): LetterView {
  return {
    original: content,
    draft: content,
    generatedAt,
    source,
  };
}
