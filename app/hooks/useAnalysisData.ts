"use client";

import { useCallback } from "react";
import { useAnalysisState } from "./analysis/useAnalysisState";
import { useAnalysisLoader } from "./analysis/useAnalysisLoader";
import { useAnalysisManager } from "./analysis/useAnalysisManager";
import { useTaskManager } from "./analysis/useTaskManager";
import { useRealtimeStorageSync } from "@/lib/clientStorage/realtimeSync/hooks";

export function useAnalysisData() {
  const {
    analyses,
    isLoading,
    errorMessage,
    isInitialized,
    activeTasks,
    isPolling,
    updateAnalyses,
    setLoading,
    setError,
    clearError,
    markInitialized,
    startTask,
    clearAllTasks,
    refreshAnalyses: refreshAnalysesState,
    debugState,
  } = useAnalysisState();

  const { statuses } = useRealtimeStorageSync();

  // Use focused hooks for different responsibilities
  const loader = useAnalysisLoader({
    updateAnalyses,
    setLoading,
    setError,
    isInitialized,
    markInitialized,
  });

  const manager = useAnalysisManager({
    updateAnalyses,
    analyses,
    setError,
  });

  const taskManager = useTaskManager({
    startTask,
    loadAnalyses: loader.loadAnalyses,
    clearAllTasks,
  });

  // Refresh analyses data - can be called from outside
  const refreshAnalyses = useCallback(async () => {
    // Use the state refresh function which will trigger a re-render and cause loadAnalyses to be called
    refreshAnalysesState();
    // Also do a direct load to ensure fresh data
    await loader.loadAnalyses();
  }, [refreshAnalysesState, loader.loadAnalyses]);

  return {
    // Data
    analyses,
    statuses,
    isLoading,
    activeTasks,
    isPolling,

    // Actions
    startTask: taskManager.enhancedStartTask,
    clearAllTasks,

    // Analysis operations
    getAnalysis: manager.getAnalysis,
    deleteAnalysis: manager.deleteAnalysis,
    updateAnalysisStatus: manager.updateAnalysisStatus,
    markAsNewThisRun: manager.markAsNewThisRun,

    // Data operations
    loadAnalyses: loader.loadAnalyses,
    refreshAnalyses,
    searchByCompany: loader.searchByCompany,
    getByStatus: loader.getByStatus,
    getStats: loader.getStats,
    clearAll: loader.clearAll,

    // Utilities
    errorMessage,
    clearError,
    debugState,
  };
}
