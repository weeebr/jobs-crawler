import type { LetterLanguage } from "@/lib/letterHelpers";

import type { LetterView } from "../hooks/useLetterManager";
import { languageLabel, letterSourceLabel } from "./helpers";

interface LetterSectionProps {
  activeLetter: LetterView | null;
  activeLanguage: LetterLanguage | null;
  loadingLanguage: LetterLanguage | null;
  letterError: string | null;
  copyNotice: string | null;
  onGenerate: (language: LetterLanguage) => Promise<void>;
  onDraftChange: (language: LetterLanguage, draft: string) => void;
  onCopy: () => Promise<void>;
}

export function LetterSection({
  activeLetter,
  activeLanguage,
  loadingLanguage,
  letterError,
  copyNotice,
  onGenerate,
  onDraftChange,
  onCopy,
}: LetterSectionProps) {
  return (
    <section id="motivation-letter" className="mt-12 card p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Motivation Letter Generator</h2>
          <p className="text-gray-600">
            Generate a truthful draft that mirrors the job requirements
          </p>
        </div>
        <LetterControls
          activeLanguage={activeLanguage}
          loadingLanguage={loadingLanguage}
          copyNotice={copyNotice}
          onGenerate={onGenerate}
        />
      </div>

      {letterError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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
    </section>
  );
}

interface LetterControlsProps {
  activeLanguage: LetterLanguage | null;
  loadingLanguage: LetterLanguage | null;
  copyNotice: string | null;
  onGenerate: (language: LetterLanguage) => Promise<void>;
}

function LetterControls({
  activeLanguage,
  loadingLanguage,
  copyNotice,
  onGenerate,
}: LetterControlsProps) {
  return (
    <div className="flex items-center gap-3">
      {copyNotice && (
        <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
          {copyNotice}
        </span>
      )}
      <div className="flex gap-2">
        {(["en", "de"] as LetterLanguage[]).map((language) => {
          const label = languageLabel(language);
          const isLoading = loadingLanguage === language;
          const busy = loadingLanguage !== null && loadingLanguage !== language;
          return (
            <button
              key={`letter-btn-${language}`}
              type="button"
              onClick={() => {
                void onGenerate(language);
              }}
              disabled={isLoading || busy}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
                activeLanguage === language
                  ? "border-accent-500 bg-green-50 text-accent-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-green-400 hover:bg-green-50"
              } ${isLoading ? "opacity-70" : ""}`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </span>
              ) : (
                label
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface LetterContentProps {
  activeLetter: LetterView | null;
  activeLanguage: LetterLanguage | null;
  loadingLanguage: LetterLanguage | null;
  onDraftChange: (language: LetterLanguage, draft: string) => void;
  onCopy: () => Promise<void>;
}

function LetterContent({
  activeLetter,
  activeLanguage,
  loadingLanguage,
  onDraftChange,
  onCopy,
}: LetterContentProps) {
  if (activeLetter && activeLanguage) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={activeLetter.draft}
            onChange={(event) => {
              onDraftChange(activeLanguage, event.target.value);
            }}
            className="min-h-[32rem] w-full rounded-lg border border-gray-300 bg-white p-6 text-sm leading-relaxed text-gray-900 focus:border-green-400 focus:outline-none resize-none shadow-sm"
            placeholder="Your motivation letter will appear here..."
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                void onCopy();
              }}
              className="btn-primary text-xs px-3 py-2"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <span className="font-medium">{languageLabel(activeLanguage)} draft</span>
            <span>•</span>
            <span>{letterSourceLabel(activeLetter.source)}</span>
            <span>•</span>
            <span>{new Date(activeLetter.generatedAt).toLocaleString()}</span>
          </div>
          <div className="text-gray-600 font-medium">
            {activeLetter.draft.length} characters
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-32 text-gray-500 bg-gray-50 rounded-lg">
      {loadingLanguage ? (
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium">
            Generating {languageLabel(loadingLanguage)} letter...
          </span>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <p className="font-medium">
            Select a language to generate your motivation letter
          </p>
        </div>
      )}
    </div>
  );
}
