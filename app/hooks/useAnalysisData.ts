"use client";

import { useCallback, useEffect } from "react";
import {
  getAnalysis,
  deleteAnalysis as deleteAnalysisOp,
  updateAnalysisStatus as updateAnalysisStatusOp,
  markAsNewThisRun as markAsNewThisRunOp
} from "./analysis/analysisOperations";
import {
  loadAnalyses as loadAnalysesOp,
  searchByCompany as searchByCompanyOp,
  getByStatus as getByStatusOp,
  clearAll as clearAllOp,
  getStats as getStatsOp
} from "./analysis/searchOperations";
import { useAnalysisState } from "./analysis/useAnalysisState";

export function useAnalysisData() {
  const {
    analyses,
    isLoading,
    errorMessage,
    isInitialized,
    activeTasks,
    isStreaming,
    updateAnalyses,
    setLoading,
    setError,
    clearError,
    markInitialized,
    startTask,
    clearAllTasks,
    debugState,
  } = useAnalysisState();

  // Load analyses directly from database
  const loadAnalyses = useCallback(async (limit?: number) => {
    setLoading(true);
    try {
      const records = await loadAnalysesOp(
        limit,
        updateAnalyses,
        setError
      );
      updateAnalyses(records);
    } catch (error) {
      // Error already handled in the operation
    } finally {
      setLoading(false);
    }
  }, [updateAnalyses, setLoading, setError]);

  // Initialize data on mount
  useEffect(() => {
    if (!isInitialized) {
      loadAnalyses();
      markInitialized();
    }
  }, [isInitialized, loadAnalyses, markInitialized]);

  // Delete analysis
  const deleteAnalysis = useCallback(async (id: number): Promise<boolean> => {
    return await deleteAnalysisOp(id, () => {
      updateAnalyses(analyses.filter(a => a.id !== id));
    });
  }, [updateAnalyses]);

  // Update analysis status
  const updateAnalysisStatus = useCallback(async (id: number, status: 'interested' | 'applied'): Promise<boolean> => {
    return await updateAnalysisStatusOp(id, status, () => {
      getStatsOp((error: Error) => setError(error.message)); // Refresh stats in background
    });
  }, [setError]);

  // Mark analyses as new this run
  const markAsNewThisRun = useCallback(async (ids: number[]) => {
    await markAsNewThisRunOp(ids, () => {
      updateAnalyses(analyses.map(a =>
        ids.includes(a.id) ? { ...a, userInteractions: { ...a.userInteractions, isNewThisRun: true } } : a
      ));
    });
  }, [updateAnalyses]);

  // Get database statistics
  const getStats = useCallback(async () => {
    return await getStatsOp((error: Error) => setError(error.message));
  }, [setError]);

  // Search by company
  const searchByCompany = useCallback(async (company: string) => {
    setLoading(true);
    try {
      const results = await searchByCompanyOp(
        company,
        updateAnalyses,
        setError
      );
      updateAnalyses(results);
    } catch (error) {
      // Error already handled in the operation
    } finally {
      setLoading(false);
    }
  }, [updateAnalyses, setLoading, setError]);

  // Get by status
  const getByStatus = useCallback(async (status: 'interested' | 'applied') => {
    setLoading(true);
    try {
      const results = await getByStatusOp(
        status,
        updateAnalyses,
        setError
      );
      updateAnalyses(results);
    } catch (error) {
      // Error already handled in the operation
    } finally {
      setLoading(false);
    }
  }, [updateAnalyses, setLoading, setError]);

  // Clear all analyses
  const clearAll = useCallback(async () => {
    await clearAllOp(
      () => updateAnalyses([]),
      setError
    );
  }, [updateAnalyses, setError]);

  // Enhanced startTask that refreshes data after completion
  const enhancedStartTask = useCallback(async (searchUrl: string) => {
    const task = await startTask(searchUrl);

    // Add a small delay to allow the task to complete, then refresh
    setTimeout(() => {
      loadAnalyses();
    }, 2000);

    return task;
  }, [startTask, loadAnalyses]);

  return {
    // Data
    analyses,
    isLoading,
    activeTasks,
    isStreaming,

    // Actions
    startTask: enhancedStartTask,
    clearAllTasks,

    // Analysis operations
    getAnalysis,
    deleteAnalysis,
    updateAnalysisStatus,
    markAsNewThisRun,

    // Data operations
    loadAnalyses,
    searchByCompany,
    getByStatus,
    getStats,
    clearAll,

    // Utilities
    errorMessage,
    clearError,
    debugState,
  };
}
