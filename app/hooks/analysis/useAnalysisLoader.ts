import { useCallback, useEffect } from "react";
import {
  loadAnalyses as loadAnalysesOp,
  searchByCompany as searchByCompanyOp,
  getByStatus as getByStatusOp,
  clearAll as clearAllOp,
  getStats as getStatsOp
} from "../analysis/searchOperations";
import type { AnalysisRecord } from "@/lib/schemas";

interface UseAnalysisLoaderProps {
  updateAnalyses: (analyses: AnalysisRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  isInitialized: boolean;
  markInitialized: () => void;
}

export function useAnalysisLoader({
  updateAnalyses,
  setLoading,
  setError,
  isInitialized,
  markInitialized,
}: UseAnalysisLoaderProps) {
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

  // Get database statistics
  const getStats = useCallback(async () => {
    return await getStatsOp((error: Error) => setError(error.message));
  }, [setError]);

  return {
    loadAnalyses,
    searchByCompany,
    getByStatus,
    getStats,
    clearAll,
  };
}
