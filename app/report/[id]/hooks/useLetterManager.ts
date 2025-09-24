import { useCallback, useEffect, useRef } from "react";
import type { LetterLanguage } from "@/lib/letterHelpers";
import type { AnalysisRecord } from "@/lib/types";
import type { Dispatch, SetStateAction } from "react";
import { generateLetter, createLetterView } from "./letter";
import { copyToClipboard } from "./letter/copyService";
import { useLetterState } from "./letter/useLetterState";

export type LetterSource = "llm" | "template" | "cache";

export interface LetterView {
  original: string;
  draft: string;
  generatedAt: number;
  source: LetterSource;
}

interface UseLetterManagerArgs {
  record: AnalysisRecord | null;
  setRecord: Dispatch<SetStateAction<AnalysisRecord | null>>;
}

interface UseLetterManagerResult {
  letters: Partial<Record<LetterLanguage, LetterView>>;
  activeLanguage: LetterLanguage | null;
  activeLetter: LetterView | null;
  loadingLanguage: LetterLanguage | null;
  letterError: string | null;
  copyNotice: string | null;
  setActiveLanguage: Dispatch<SetStateAction<LetterLanguage | null>>;
  handleGenerate: (language: LetterLanguage) => Promise<void>;
  handleDraftChange: (language: LetterLanguage, draft: string) => void;
  handleCopy: () => Promise<void>;
}

export function useLetterManager({
  record,
  setRecord,
}: UseLetterManagerArgs): UseLetterManagerResult {
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
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
  } = useLetterState(record);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, []);

  const handleGenerate = useCallback(
    async (language: LetterLanguage) => {
      if (!record) return;

      setActiveLanguage(language);
      setError(null);
      setCopySuccess(null);

      if (letters[language]) {
        return;
      }

      setLoading(language);

      const letter = await generateLetter(record.id, language, setError);

      if (letter) {
        updateLetter(language, letter);

        // Update the record with the new letter
        setRecord((current: AnalysisRecord | null) => {
          if (!current) return current;
          return {
            ...current,
            llmAnalysis: {
              ...current.llmAnalysis,
              letters: {
                ...current.llmAnalysis.letters,
                [language]: {
                  content: letter.original,
                  generatedAt: letter.generatedAt,
                },
              },
            },
          } satisfies AnalysisRecord;
        });
      }

      setLoading(null);
    },
    [record, letters, setRecord, setActiveLanguage, setError, setCopySuccess, setLoading, updateLetter],
  );

  const handleDraftChange = useCallback(
    (language: LetterLanguage, draft: string) => {
      updateDraft(language, draft);
    },
    [updateDraft],
  );

  const handleCopy = useCallback(async () => {
    if (!activeLanguage || !activeLetter) return;

    await copyToClipboard(
      activeLetter.draft,
      () => {
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        setError(null);
        setCopySuccess("Copied to clipboard");
        copyTimeoutRef.current = setTimeout(() => {
          setCopySuccess(null);
          copyTimeoutRef.current = null;
        }, 2000);
      },
      setError
    );
  }, [activeLanguage, activeLetter, setError, setCopySuccess]);

  return {
    letters,
    activeLanguage,
    activeLetter,
    loadingLanguage,
    letterError,
    copyNotice,
    setActiveLanguage,
    handleGenerate,
    handleDraftChange,
    handleCopy,
  };
}
