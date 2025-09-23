"use client";

import { useCallback } from "react";
import {
  clearAllData,
  loadRecentSummaries,
  persistAnalysisRecord,
  persistAnalysisStatuses,
  persistRecentSummaries,
  removeAnalysisRecord,
  toSummary,
  type AnalysisStatus,
  type RecentAnalysisSummary,
} from "@/lib/clientStorage";
import { isAnalysisComplete } from "@/lib/analysisValidation";
import type { AnalysisRecord } from "@/lib/types";

interface UseDataPersistenceOptions {
  statuses: Record<number, AnalysisStatus>;
  forceRefresh: () => void;
}

/**
 * Hook for managing data persistence operations
 * Handles CRUD operations for analysis data
 */
export function useDataPersistence({ statuses, forceRefresh }: UseDataPersistenceOptions) {
  const handleStatusToggle = useCallback((id: number, status: AnalysisStatus) => {
    const current = statuses;
    const next = { ...current };
    if (next[id] === status) {
      delete next[id];
    } else {
      next[id] = status;
    }
    persistAnalysisStatuses(next);
    // Trigger immediate UI update
    forceRefresh();
  }, [statuses, forceRefresh]);

  const handleDelete = useCallback(async (id: number) => {
    console.log('[useDataPersistence] handleDelete called for id:', id);
    try {
      console.log('[useDataPersistence] making DELETE request to /api/analysis/' + id);
      const response = await fetch(`/api/analysis/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      console.log('[useDataPersistence] DELETE response status:', response.status);
      if (!response.ok && response.status !== 404) {
        throw new Error(`Delete failed (${response.status})`);
      }

      console.log('[useDataPersistence] removing analysis record from localStorage');
      removeAnalysisRecord(id);
      
      // Update recent summaries to remove the deleted analysis
      const currentRecent = loadRecentSummaries();
      const updatedRecent = currentRecent.filter(analysis => analysis.id !== id);
      persistRecentSummaries(updatedRecent);
      console.log('[useDataPersistence] updated recent summaries, removed analysis', id);
      
      // Clean up status for deleted analysis
      const current = statuses;
      if (current[id]) {
        console.log('[useDataPersistence] cleaning up status for deleted analysis');
        const next = { ...current };
        delete next[id];
        persistAnalysisStatuses(next);
      }

      console.log('[useDataPersistence] triggering forceRefresh');
      // Trigger immediate UI update to reflect deletion
      forceRefresh();
      console.log('[useDataPersistence] delete completed successfully');
    } catch (deleteError) {
      console.error('[useDataPersistence] delete error:', deleteError);
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete analysis";
      throw new Error(message);
    }
  }, [statuses, forceRefresh]);

  const persistCompleteAnalyses = useCallback((records: AnalysisRecord[]) => {
    const completeRecords = records.filter(isAnalysisComplete);
    const summaries = completeRecords.map((record) => {
      persistAnalysisRecord(record);
      return toSummary(record);
    });
    
    if (summaries.length > 0) {
      persistRecentSummaries(summaries);
      forceRefresh();
    }
    
    return summaries;
  }, [forceRefresh]);

  return {
    handleStatusToggle,
    handleDelete,
    persistCompleteAnalyses,
  };
}
