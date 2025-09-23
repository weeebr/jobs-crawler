"use client";

import type { FormEvent } from "react";

interface JobSearchFormProps {
  jobUrl: string;
  onJobUrlChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  canSubmit: boolean;
  isPending: boolean;
}

export function JobSearchForm({
  jobUrl,
  onJobUrlChange,
  onSubmit,
  canSubmit,
  isPending,
}: JobSearchFormProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Start Your Analysis</h3>
        <p className="text-sm text-gray-600 sm:hidden">Paste job search URL</p>
      </div>

      <form className="space-y-4 sm:space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Job Search Results URL
          </label>
          <input
            value={jobUrl}
            onChange={(event) => onJobUrlChange(event.target.value)}
            placeholder="https://jobs.ch/en/vacancies?term=frontend"
            className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            type="url"
            autoComplete="off"
          />
          <p className="text-xs sm:text-sm text-gray-500">
            All job postings on this page will be analyzed
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className="w-full py-3 px-4 bg-green-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] sm:min-h-0"
          >
            {isPending ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing Jobs...</span>
              </span>
            ) : (
              "Analyze Job Postings"
            )}
          </button>
          
          <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>AI-powered analysis with preset CV</span>
          </div>
        </div>
      </form>
    </div>
  );
}
