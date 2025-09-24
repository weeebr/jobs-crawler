"use client";

import type { LetterLanguage } from "@/lib/letterHelpers";
import type { LetterView } from "../hooks/useLetterManager";
import { LetterControls, LetterContent, LetterModalHeader } from "./letter";

interface MotivationLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLetter: LetterView | null;
  activeLanguage: LetterLanguage | null;
  loadingLanguage: LetterLanguage | null;
  letterError: string | null;
  copyNotice: string | null;
  onGenerate: (language: LetterLanguage) => Promise<void>;
  onDraftChange: (language: LetterLanguage, draft: string) => void;
  onCopy: () => Promise<void>;
}

export function MotivationLetterModal({
  isOpen,
  onClose,
  activeLetter,
  activeLanguage,
  loadingLanguage,
  letterError,
  copyNotice,
  onGenerate,
  onDraftChange,
  onCopy,
}: MotivationLetterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          <LetterModalHeader onClose={onClose} />

          {/* Content */}
          <div className="p-6">
            <LetterControls
              activeLanguage={activeLanguage}
              loadingLanguage={loadingLanguage}
              copyNotice={copyNotice}
              onGenerate={onGenerate}
            />

            {letterError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{letterError}</p>
              </div>
            )}

            <LetterContent
              activeLetter={activeLetter}
              activeLanguage={activeLanguage}
              loadingLanguage={loadingLanguage}
              onDraftChange={onDraftChange}
              onCopy={onCopy}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

