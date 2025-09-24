"use client";

import { useState, useTransition, useCallback, useEffect } from "react";

import { AnalysesTable } from "./components/AnalysesTable";
import { JobSearchForm } from "./components/JobSearchForm";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { QuickStats } from "./components/QuickStats";
import { ProgressBar } from "./components/ProgressBar";
import { ErrorToast } from "./components/ErrorToast";
import { useAnalysisData } from "./hooks/useAnalysisData";
import { useProgressTracking } from "./hooks/useProgressTracking";
import { useTaskCancellation } from "./hooks/useTaskCancellation";
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
    statuses,
    isLoading,
    activeTasks,
    isPolling,
    loadAnalyses,
    refreshAnalyses,
    updateAnalysisStatus,
    deleteAnalysis,
    errorMessage,
    clearError,
    getStats,
    startTask,
    clearAllTasks,
    clearAll,
  } = useAnalysisData();


  const { aggregatedProgress, progressLabel, showLoadingBar, progressBarRef } =
    useProgressTracking(activeTasks, isPending, isPolling);

  // Cancel all running background tasks when page is unloaded (refresh, close, navigate)
  useTaskCancellation();

  // Create refresh function for polling results
  const handleResultRefresh = useCallback(async () => {
    await refreshAnalyses();
  }, [refreshAnalyses]);

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
      // Clear all fetched job ads from database
      await clearAll();
      console.info('[home] reset all data - cleared all fetched job ads');
    } catch (refetchError) {
      const message =
        refetchError instanceof Error
          ? refetchError.message
          : "Failed to reset data";
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
                isPending={isPending || isPolling}
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
            

            <AnalysesTable
              analyses={analyses}
              statuses={statuses}
              onStatusToggle={updateAnalysisStatus}
              onDelete={deleteAnalysis}
            />
          </div>
        )}
      </main>
    </div>
  );
}