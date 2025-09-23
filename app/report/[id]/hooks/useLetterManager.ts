import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { LetterLanguage } from "@/lib/generateMotivationLetter";
import type { AnalysisRecord } from "@/lib/types";

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
  const [letters, setLetters] = useState<
    Partial<Record<LetterLanguage, LetterView>>
  >({});
  const [activeLanguage, setActiveLanguage] = useState<LetterLanguage | null>(
    null,
  );
  const [loadingLanguage, setLoadingLanguage] = useState<LetterLanguage | null>(
    null,
  );
  const [letterError, setLetterError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!record) return;
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

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setCopyNotice(null);
  }, [activeLanguage]);

  const handleGenerate = useCallback(
    async (language: LetterLanguage) => {
      if (!record) return;

      setActiveLanguage(language);
      setLetterError(null);
      setCopyNotice(null);

      if (letters[language]) {
        return;
      }

      setLoadingLanguage(language);

      try {
        const response = await fetch(`/api/analysis/${record.id}/letter`, {
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
          setLetterError(message);
          return;
        }

        const data = (await response.json()) as {
          language: string;
          content: string;
          generatedAt: number;
          source?: string;
        };

        const source: LetterSource =
          data.source === "template" || data.source === "cache"
            ? data.source
            : "llm";

        setLetters((current) => ({
          ...current,
          [language]: {
            original: data.content,
            draft: data.content,
            generatedAt: data.generatedAt,
            source,
          },
        }));

        setRecord((current: AnalysisRecord | null) => {
          if (!current) return current;
          return {
            ...current,
            llmAnalysis: {
              ...current.llmAnalysis,
              letters: {
                ...current.llmAnalysis.letters,
                [language]: {
                  content: data.content,
                  generatedAt: data.generatedAt,
                },
              },
            },
          } satisfies AnalysisRecord;
        });
      } catch (error) {
        console.warn("[report] letter generation failed", error);
        setLetterError(
          error instanceof Error
            ? error.message
            : "Unexpected letter generation error",
        );
      } finally {
        setLoadingLanguage(null);
      }
    },
    [letters, record, setRecord],
  );

  const handleDraftChange = useCallback(
    (language: LetterLanguage, draft: string) => {
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
    },
  []);

  const handleCopy = useCallback(async () => {
    if (!activeLanguage) return;
    const letter = letters[activeLanguage];
    if (!letter) return;

    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(letter.draft);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      setLetterError(null);
      setCopyNotice("Copied to clipboard");
      copyTimeoutRef.current = setTimeout(() => {
        setCopyNotice(null);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (error) {
      console.warn("[report] copy failed", error);
      setLetterError(
        error instanceof Error
          ? error.message
          : "Copy failed. Select manually.",
      );
    }
  }, [activeLanguage, letters]);

  const activeLetter = useMemo(() => {
    return activeLanguage ? letters[activeLanguage] ?? null : null;
  }, [activeLanguage, letters]);

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
