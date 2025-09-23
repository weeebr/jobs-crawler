"use client";

import { useCallback } from "react";
import {
  clearAllData,
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
    try {
      const response = await fetch(`/api/analysis/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (!response.ok && response.status !== 404) {
        throw new Error(`Delete failed (${response.status})`);
      }

      removeAnalysisRecord(id);
      
      // Clean up status for deleted analysis
      const current = statuses;
      if (current[id]) {
        const next = { ...current };
        delete next[id];
        persistAnalysisStatuses(next);
      }

      // Trigger immediate UI update to reflect deletion
      forceRefresh();
    } catch (deleteError) {
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
