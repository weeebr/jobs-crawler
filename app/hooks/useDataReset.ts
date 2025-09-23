"use client";

import { useCallback } from "react";
import { clearAllData, persistAnalysisRecord, persistRecentSummaries, toSummary } from "@/lib/clientStorage";
import { isAnalysisComplete } from "@/lib/analysisValidation";
import { requireAnalysisRecords } from "@/lib/contractValidation";

interface UseDataResetOptions {
  clearAllTasks: () => Promise<void>;
  clearRealtimeData: () => void;
  forceRefresh: () => void;
  onReset: () => Promise<void>;
  onResetComplete: () => void;
  startTask: (searchUrl: string) => Promise<{ id: string }>;
  onError?: (message: string) => void;
}

/**
 * Hook for managing data reset operations
 * Handles complete clearing of all data and state
 */
export function useDataReset({ 
  clearAllTasks, 
  clearRealtimeData, 
  forceRefresh, 
  onReset,
  onResetComplete,
  startTask,
  onError
}: UseDataResetOptions) {
  const handleRefetch = useCallback(async (restartSearchUrl?: string) => {
    console.info('[data-reset] starting complete refetch - clearing all state');
    
    try {
      // Step 1: Set reset flag and clear task tracking
      console.info('[data-reset] calling onReset...');
      await onReset();
      console.info('[data-reset] onReset completed');
      
      // Step 2: Clear all background tasks first (including server-side cancellation)
      console.info('[data-reset] clearing all tasks...');
      await clearAllTasks();
      console.info('[data-reset] tasks cleared');
      
      // Step 3: Clear all localStorage data
      console.info('[data-reset] clearing localStorage...');
      clearAllData();
      console.info('[data-reset] localStorage cleared');
      
      // Step 4: Clear real-time sync state (this will trigger UI updates)
      console.info('[data-reset] clearing realtime data...');
      clearRealtimeData();
      console.info('[data-reset] realtime data cleared');
      
      // Step 5: Wait for all clearing to complete
      console.info('[data-reset] waiting for state clearing to complete...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Longer delay to ensure clearing
      
      // Step 6: Clear reset flag BEFORE fetching new data
      console.info('[data-reset] clearing reset flag before fetching new data');
      onResetComplete();
      
      // Step 7: Fetch fresh data from API
      console.info('[data-reset] fetching fresh data from API...');
      const response = await fetch("/api/analyses", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (response.ok) {
        const raw = await response.json();
        const records = requireAnalysisRecords(raw, 'data-reset.fetchAnalyses');
        const completeRecords = records.filter(isAnalysisComplete);
        const incompleteCount = records.length - completeRecords.length;
        
        if (incompleteCount > 0) {
          console.warn(`[data-reset] filtered out ${incompleteCount} incomplete analyses during refetch`);
        }
        
        const summaries = completeRecords.map((record) => {
          persistAnalysisRecord(record);
          return toSummary(record);
        });
        
        persistRecentSummaries(summaries);
        // Trigger immediate UI update
        forceRefresh();
        console.info(`[data-reset] refetched ${summaries.length} complete analyses`);
      } else {
        console.warn('[data-reset] failed to fetch fresh data from API');
      }

      console.info('[data-reset] reset complete, normal processing resumed');

      // Step 8: Restart background task if URL provided (only after reset is complete)
      if (restartSearchUrl?.trim()) {
        try {
          console.info('[data-reset] restarting background task...');
          const task = await startTask(restartSearchUrl.trim());
          console.info(`[data-reset] restarted background task ${task.id} after refresh`);
        } catch (restartError) {
          const errorMessage = restartError instanceof Error 
            ? restartError.message 
            : "Failed to restart background task after refresh";
          console.error('[data-reset] failed to restart background task:', errorMessage);
          onError?.(errorMessage);
        }
      }
    } catch (error) {
      console.error('[data-reset] error during reset operation:', error);
      // Clear reset flag even if there's an error
      onResetComplete();
    }
  }, [clearAllTasks, clearRealtimeData, forceRefresh, onReset, onResetComplete, startTask, onError]);

  return {
    handleRefetch,
  };
}
