import { useCallback } from "react";
import {
  getAnalysis,
  deleteAnalysis as deleteAnalysisOp,
  updateAnalysisStatus as updateAnalysisStatusOp,
  markAsNewThisRun as markAsNewThisRunOp
} from "../analysis/analysisOperations";
import { getStats as getStatsOp } from "../analysis/searchOperations";
import type { AnalysisRecord } from "@/lib/schemas";

interface UseAnalysisManagerProps {
  updateAnalyses: (analyses: AnalysisRecord[]) => void;
  analyses: AnalysisRecord[];
  setError: (error: string | null) => void;
}

export function useAnalysisManager({
  updateAnalyses,
  analyses,
  setError,
}: UseAnalysisManagerProps) {
  // Delete analysis
  const deleteAnalysis = useCallback(async (id: number): Promise<boolean> => {
    return await deleteAnalysisOp(id, () => {
      updateAnalyses(analyses.filter(a => a.id !== id));
    });
  }, [updateAnalyses, analyses]);

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
  }, [updateAnalyses, analyses]);

  return {
    getAnalysis,
    deleteAnalysis,
    updateAnalysisStatus,
    markAsNewThisRun,
  };
}
