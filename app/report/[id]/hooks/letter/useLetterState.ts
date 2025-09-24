import { useCallback, useEffect, useState } from "react";
import type { LetterLanguage } from "@/lib/letterHelpers";
import type { AnalysisRecord } from "@/lib/types";
import type { LetterSource, LetterView } from "../useLetterManager";

export function useLetterState(record: AnalysisRecord | null) {
  const [letters, setLetters] = useState<Partial<Record<LetterLanguage, LetterView>>>({});
  const [activeLanguage, setActiveLanguage] = useState<LetterLanguage | null>(null);
  const [loadingLanguage, setLoadingLanguage] = useState<LetterLanguage | null>(null);
  const [letterError, setLetterError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  // Initialize letters from record
  useEffect(() => {
    if (!record) {
      setLetters({});
      setActiveLanguage(null);
      setLetterError(null);
      return;
    }

    const storedLetters = record.llmAnalysis.letters ?? {};
    const initial: Partial<Record<LetterLanguage, LetterView>> = {};

    (Object.entries(storedLetters) as [
      LetterLanguage,
      { content: string; generatedAt: number },
    ][]).forEach(([language, value]) => {
      initial[language] = {
        original: value.content,
        draft: value.content,
        generatedAt: value.generatedAt,
        source: "cache",
      } satisfies LetterView;
    });

    setLetters(initial);
    const available = Object.keys(initial) as LetterLanguage[];
    if (available.length > 0) {
      setActiveLanguage((current) => current ?? available[0]);
    }
    setLetterError(null);
  }, [record]);

  // Clear copy notice when language changes
  useEffect(() => {
    setCopyNotice(null);
  }, [activeLanguage]);

  const updateLetter = useCallback((language: LetterLanguage, letter: LetterView) => {
    setLetters((current) => ({
      ...current,
      [language]: letter,
    }));
  }, []);

  const updateDraft = useCallback((language: LetterLanguage, draft: string) => {
    setLetters((current) => {
      const existing = current[language];
      if (!existing) {
        return current;
      }
      return {
        ...current,
        [language]: {
          ...existing,
          draft,
        },
      };
    });
  }, []);

  const setLoading = useCallback((language: LetterLanguage | null) => {
    setLoadingLanguage(language);
  }, []);

  const setError = useCallback((error: string | null) => {
    setLetterError(error);
  }, []);

  const setCopySuccess = useCallback((notice: string | null) => {
    setCopyNotice(notice);
  }, []);

  const activeLetter = activeLanguage ? letters[activeLanguage] ?? null : null;

  return {
    letters,
    activeLanguage,
    setActiveLanguage,
    activeLetter,
    loadingLanguage,
    setLoading,
    letterError,
    setError,
    copyNotice,
    setCopySuccess,
    updateLetter,
    updateDraft,
  };
}
