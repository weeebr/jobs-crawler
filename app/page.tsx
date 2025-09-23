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
    recent,
    statuses,
    activeTasks,
    isStreaming,
    handleRefetch,
    handleRefresh,
    handleStatusToggle,
    handleDelete,
    errorMessage,
    clearError,
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
      // Use the same refresh logic as the refresh button, but preserve cached data
      await handleRefresh(jobUrl.trim());
      console.info(`[home] started refresh with job URL: ${jobUrl.trim()}`);
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
      await handleRefetch(jobUrl);
    } catch (refetchError) {
      const message =
        refetchError instanceof Error
          ? refetchError.message
          : "Failed to refetch data";
      setError(message);
    }
  }

  // Debug logging
  console.log('[page] render state:', { error, errorMessage, hasError: !!(error || errorMessage) });

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
            <QuickStats recent={recent} statuses={statuses} />
          </div>
        </div>

        {/* Analyses Table */}
        {recent.length > 0 && (
          <div className="mt-8 sm:mt-12">
            <AnalysesTable
              analyses={recent}
              statuses={statuses}
              onStatusToggle={handleStatusToggle}
              onDelete={handleDelete}
            />
          </div>
        )}
      </main>
    </div>
  );
}