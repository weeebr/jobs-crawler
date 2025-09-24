import { useCallback, useState } from "react";
import type { AnalysisRecord } from "@/lib/types";
import { usePollingTasks } from "@/lib/usePollingTasks";
import { usePageUnload } from "@/lib/usePageUnload";
import { cancelAllActiveTasks } from "@/lib/backgroundTasks";

export function useAnalysisState() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Define updateAnalyses first to avoid hoisting issues
  const updateAnalyses = useCallback((newAnalyses: AnalysisRecord[]) => {
    setAnalyses(newAnalyses);
  }, []);

  // Create refresh function after updateAnalyses is defined
  const refreshAnalyses = useCallback(() => {
    // Force a refresh by triggering loadAnalyses again
    // This will update the analyses state with fresh data from the database
    updateAnalyses([...analyses]); // This will trigger a re-render and cause useAnalysisData to reload
  }, [analyses, updateAnalyses]);

  const { tasks, startTask, clearAllTasks, isPolling } = usePollingTasks({
    onError: (message) => setErrorMessage(message),
    onResultRefresh: refreshAnalyses
  });

  const activeTasks = tasks.filter(task => task.status === 'running');

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setError = useCallback((error: string | null) => {
    setErrorMessage(error);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const markInitialized = useCallback(() => {
    setIsInitialized(true);
  }, []);

  const debugState = useCallback(() => {
    console.info('[useAnalysisState] current state:', {
      analysesCount: analyses.length,
      isLoading,
      isPolling,
      tasksCount: tasks.length,
      errorMessage
    });
  }, [analyses.length, isLoading, isPolling, tasks.length, errorMessage]);

  // Handle page unload to cancel all running tasks
  const handlePageUnload = useCallback(async () => {
    const activeTaskCount = tasks.filter(task => task.status === 'running').length;
    if (activeTaskCount > 0) {
      console.info(`[useAnalysisState] cancelling ${activeTaskCount} active tasks on page unload...`);
      cancelAllActiveTasks();
    }
  }, [tasks]);

  // Register page unload handler
  usePageUnload(handlePageUnload);

  return {
    // State
    analyses,
    isLoading,
    errorMessage,
    isInitialized,
    activeTasks,
    isPolling,

    // State setters
    updateAnalyses,
    setLoading,
    setError,
    clearError,
    markInitialized,

    // Background tasks
    tasks,
    startTask,
    clearAllTasks,

    // Refresh function
    refreshAnalyses,

    // Utilities
    debugState,
  };
}
