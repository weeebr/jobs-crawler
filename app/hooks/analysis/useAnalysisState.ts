import { useCallback, useState } from "react";
import type { AnalysisRecord } from "@/lib/types";
import { useBackgroundTasks } from "@/lib/useBackgroundTasks";
import { usePageUnload } from "@/lib/usePageUnload";
import { cancelAllActiveTasks } from "@/lib/backgroundTasks";

export function useAnalysisState() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { tasks, startTask, clearAllTasks, isStreaming } = useBackgroundTasks({
    onError: (message) => setErrorMessage(message)
  });

  const activeTasks = tasks.filter(task => task.status === 'running');

  const updateAnalyses = useCallback((newAnalyses: AnalysisRecord[]) => {
    setAnalyses(newAnalyses);
  }, []);

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
      isStreaming,
      tasksCount: tasks.length,
      errorMessage
    });
  }, [analyses.length, isLoading, isStreaming, tasks.length, errorMessage]);

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
    isStreaming,

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

    // Utilities
    debugState,
  };
}
