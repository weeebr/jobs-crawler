"use client";

import { useCallback } from "react";
import { loadRecentSummaries, persistRecentSummaries, toSummary } from "@/lib/clientStorage";
import { isAnalysisComplete } from "@/lib/analysisValidation";
import { requireAnalysisRecords } from "@/lib/contractValidation";
import { analysisStorage } from "@/lib/analysisStorageHandler";
import type { BackgroundTask } from "@/lib/useBackgroundTasks";

const MAX_RECENT_ANALYSES = 50;

interface UseDataRefreshOptions {
  clearAllTasks: (options?: { preserveAnalyses?: boolean }) => Promise<void>;
  forceRefresh: () => void;
  onError?: (message: string) => void;
  onReset: () => Promise<void>;
  onResetComplete: () => void;
  startTask: (searchUrl: string, clearJobAdData?: boolean) => Promise<BackgroundTask>;
}

/**
 * Hook for managing data refresh operations
 * Works exactly like useDataReset but WITHOUT clearing localStorage/cached data
 * This preserves existing analyses while refreshing the data source
 */
export function useDataRefresh({
  clearAllTasks,
  forceRefresh,
  onError,
  onReset,
  onResetComplete,
  startTask,
}: UseDataRefreshOptions) {
  const handleRefresh = useCallback(async (restartSearchUrl?: string) => {
    console.info('[data-refresh] starting refresh - preserving cached data');

    try {
      await onReset();

      console.info('[data-refresh] clearing running tasks while preserving analyses');
      await clearAllTasks({ preserveAnalyses: true });
      console.info('[data-refresh] tasks cleared (analyses preserved)');

      console.info('[data-refresh] synchronizing analyses from API...');
      const response = await fetch("/api/analyses", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (response.ok) {
        const raw = await response.json();
        const records = requireAnalysisRecords(raw, 'data-refresh.fetchAnalyses');
        const completeRecords = records.filter(isAnalysisComplete);
        const incompleteCount = records.length - completeRecords.length;

        if (incompleteCount > 0) {
          console.warn(`[data-refresh] filtered out ${incompleteCount} incomplete analyses during refetch`);
        }

        const summaries = completeRecords.map((record) => {
          analysisStorage.save(record, "client");
          return toSummary(record);
        });

        const existingSummaries = loadRecentSummaries();
        const mergedSummariesMap = new Map<number, ReturnType<typeof toSummary>>();

        for (const summary of existingSummaries) {
          mergedSummariesMap.set(summary.id, summary);
        }

        for (const summary of summaries) {
          mergedSummariesMap.set(summary.id, summary);
        }

        const mergedSummaries = Array.from(mergedSummariesMap.values())
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, MAX_RECENT_ANALYSES);

        persistRecentSummaries(mergedSummaries);
        forceRefresh();
        console.info(`[data-refresh] synchronized ${summaries.length} complete analyses`);
      } else {
        const statusText = `${response.status} ${response.statusText}`.trim();
        console.warn(`[data-refresh] failed to fetch fresh data from API (status: ${statusText})`);
        onError?.('Failed to refresh analyses from API');
      }

      console.info('[data-refresh] refresh complete, normal processing resumed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh data';
      console.error('[data-refresh] error during refresh operation:', error);
      onError?.(message);
    } finally {
      onResetComplete();
    }

    // Restart background task if URL provided (only after refresh is complete)
    if (restartSearchUrl?.trim()) {
      try {
        console.info('[data-refresh] restarting background task...');
        const task = await startTask(restartSearchUrl.trim());
        console.info(`[data-refresh] restarted background task ${task.id} after refresh`);
      } catch (restartError) {
        const errorMessage = restartError instanceof Error
          ? restartError.message
          : "Failed to restart background task after refresh";
        console.error('[data-refresh] failed to restart background task:', errorMessage);
        onError?.(errorMessage);
      }
    }
  }, [clearAllTasks, forceRefresh, onError, onReset, onResetComplete, startTask]);

  return {
    handleRefresh,
  };
}
