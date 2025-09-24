import type { LetterLanguage } from "@/lib/letterHelpers";
import { languageLabel } from "../helpers";

interface LetterControlsProps {
  activeLanguage: LetterLanguage | null;
  loadingLanguage: LetterLanguage | null;
  copyNotice: string | null;
  onGenerate: (language: LetterLanguage) => Promise<void>;
}

export function LetterControls({
  activeLanguage,
  loadingLanguage,
  copyNotice,
  onGenerate,
}: LetterControlsProps) {
  return (
    <div className="flex items-center gap-3 mb-6">
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
