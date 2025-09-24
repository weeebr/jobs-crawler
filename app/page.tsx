"use client";

import { useState, useTransition, useEffect } from "react";

import { AnalysesTable } from "./components/AnalysesTable";
import { JobSearchForm } from "./components/JobSearchForm";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { QuickStats } from "./components/QuickStats";
import { ProgressBar } from "./components/ProgressBar";
import { ErrorToast } from "./components/ErrorToast";
import { useAnalysisData } from "./hooks/useAnalysisData";
import { useProgressTracking } from "./hooks/useProgressTracking";
import { getConfig } from "./lib/configStore";
import { checkApiKeyAndThrow } from "./lib/apiKeyValidation";

export default function HomePage() {
  const [isPending] = useTransition();
  const [jobUrl, setJobUrl] = useState("");
  const [error, setError] = useState<string | null>(null);


  // Load default job search URL from config
  useEffect(() => {
    const config = getConfig();
    setJobUrl(config.defaultJobSearchUrl);
  }, []);

  const {
    analyses,
    isLoading,
    activeTasks,
    isStreaming,
    loadAnalyses,
    updateAnalysisStatus,
    deleteAnalysis,
    errorMessage,
    clearError,
    getStats,
    startTask,
    clearAllTasks,
  } = useAnalysisData();


  const { aggregatedProgress, progressLabel, showLoadingBar, progressBarRef } =
    useProgressTracking(activeTasks, isPending, isStreaming);

  const canSubmit = jobUrl.trim().length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Provide a search results URL");
      return;
    }

    // Validate API key immediately
    try {
      console.log('[handleSubmit] validating API key...');
      await checkApiKeyAndThrow();
      console.log('[handleSubmit] API key validation passed');
    } catch (apiKeyError) {
      console.log('[handleSubmit] API key validation failed:', apiKeyError instanceof Error ? apiKeyError.message : apiKeyError);
      setError(apiKeyError instanceof Error ? apiKeyError.message : 'API key validation failed');
      return;
    }

    try {
      // Start the task and let it run in background
      await startTask(jobUrl.trim());
      console.info(`[home] started analysis with job URL: ${jobUrl.trim()}`);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to start background analysis";
      setError(message);
    }
  }


  async function handleRefetchWithError() {
    setError(null);

    // Validate API key immediately
    try {
      await checkApiKeyAndThrow();
    } catch (apiKeyError) {
      setError(apiKeyError instanceof Error ? apiKeyError.message : 'API key validation failed');
      return;
    }

    try {
      // Clear existing data and reload from database
      await clearAllTasks();
      await loadAnalyses();
      console.info('[home] refetched data from database');
    } catch (refetchError) {
      const message =
        refetchError instanceof Error
          ? refetchError.message
          : "Failed to refetch data";
      setError(message);
    }
  }

  // Debug logging (only in development and when there's an error)
  if (process.env.NODE_ENV === 'development' && (error || errorMessage)) {
    console.log('[page] render state:', { error, errorMessage, hasError: !!(error || errorMessage) });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {(error || errorMessage) && (
        <ErrorToast
          message={error || errorMessage || ""}
          onClose={() => {
            setError(null);
            clearError();
          }}
        />
      )}
      
      <ProgressBar
        show={showLoadingBar}
        mode={aggregatedProgress.mode}
        percent={aggregatedProgress.percent}
        phase={aggregatedProgress.phase as 'link-collection' | 'job-analysis' | null}
        ref={progressBarRef}
      />

      <Header
        progressLabel={progressLabel}
        onRefetch={handleRefetchWithError}
        isPending={isPending}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <HeroSection />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Search Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-elevated p-4 sm:p-6 lg:p-8">
              <JobSearchForm
                jobUrl={jobUrl}
                onJobUrlChange={setJobUrl}
                onSubmit={handleSubmit}
                canSubmit={canSubmit}
                isPending={isPending || isStreaming}
              />
            </div>
          </div>

          {/* Right Column - Stats and Activity */}
          <div className="space-y-6">
            <QuickStats analyses={analyses} isLoading={isLoading} />
          </div>
        </div>

        {/* Analyses Table */}
        {analyses.length > 0 && !isLoading && (
          <div className="mt-8 sm:mt-12">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Your Job Analyses</h2>
                  <p className="text-sm sm:text-base text-neutral-600 mt-1">Track your career opportunities and match scores</p>
                </div>
                <div className="text-sm text-neutral-500">
                  {analyses.length} of {analyses.length} analyses
                </div>
              </div>
            </div>

            <AnalysesTable
              analyses={analyses}
              onStatusToggle={updateAnalysisStatus}
              onDelete={deleteAnalysis}
            />
          </div>
        )}
      </main>
    </div>
  );
}