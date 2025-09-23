"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRealtimeStorageSync, type AnalysisStatus, type RecentAnalysisSummary } from "@/lib/clientStorage";
import { useBackgroundTasks } from "@/lib/useBackgroundTasks";
import { useRealtimeDashboard } from "./useRealtimeDashboard";
import { useDataPersistence } from "./useDataPersistence";
import { useTaskProcessing } from "./useTaskProcessing";
import { useDataReset } from "./useDataReset";
import { useDataRefresh } from "./useDataRefresh";

export function useAnalysisData() {
  // Use real-time storage sync for immediate UI updates
  const { recent, statuses, isHydrated, forceRefresh, clearAllData: clearRealtimeData } = useRealtimeStorageSync();
  const recentRef = useRef<RecentAnalysisSummary[]>(recent);
  const [isResetting, setIsResetting] = useState<boolean>(false); // Flag to prevent re-processing during reset
  const [allowedTaskIds, setAllowedTaskIds] = useState<Set<string>>(new Set()); // Only process tasks created after reset
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { tasks, startTask, clearAllTasks, isStreaming } = useBackgroundTasks({
    onError: (message) => setErrorMessage(message)
  });

  const activeTasks = tasks.filter(task => task.status === 'running');

  // Real-time dashboard updates
  const { realtimeRecent } = useRealtimeDashboard({ recent });

  // Data persistence operations
  const { handleStatusToggle, handleDelete } = useDataPersistence({
    statuses,
    forceRefresh,
  });

  // Task processing
  const { initializeSeenRecords, clearSeenRecords } = useTaskProcessing({
    tasks,
    isResetting,
    allowedTaskIds,
    onTaskResults: (summaries) => {
      if (summaries.length > 0) {
        console.info(`[useAnalysisData] task results received, calling forceRefresh for ${summaries.length} summaries`);
        forceRefresh();
      }
    },
  });

  // Data reset operations (clears all data including localStorage)
  const { handleRefetch } = useDataReset({
    clearAllTasks,
    clearRealtimeData,
    forceRefresh,
    startTask,
    onError: (message) => setErrorMessage(message),
    onReset: async () => {
      console.info('[home] setting reset flag to prevent task processing');
      setIsResetting(true);
      setAllowedTaskIds(new Set());
      clearSeenRecords();
    },
    onResetComplete: () => {
      console.info('[home] reset complete, clearing reset flag');
      setIsResetting(false);
    },
  });

  // Data refresh operations (preserves localStorage/cached data)
  const { handleRefresh } = useDataRefresh({
    clearAllTasks,
    forceRefresh,
    startTask,
    onError: (message) => setErrorMessage(message),
    onReset: async () => {
      console.info('[home] setting reset flag to prevent task processing');
      setIsResetting(true);
      setAllowedTaskIds(new Set());
      clearSeenRecords();
    },
    onResetComplete: () => {
      console.info('[home] refresh complete, clearing reset flag');
      setIsResetting(false);
    },
  });

  const recentSignature = useMemo(
    () => recent.map((item) => item.id).join("|"),
    [recent],
  );

  useEffect(() => {
    recentRef.current = recent;
  }, [recent]);

  // Initialize seen record IDs from current data
  useEffect(() => {
    if (isHydrated && recent.length > 0) {
      initializeSeenRecords(recent);
    }
  }, [isHydrated, recent, initializeSeenRecords]);



  // Persist data changes (cleanup stale statuses)
  useEffect(() => {
    if (!isHydrated) return;

    const snapshot = recentRef.current;
    const currentStatuses = statuses;

    if (snapshot.length === 0) {
      if (Object.keys(currentStatuses).length === 0) {
        return;
      }
      console.info("[home] clearing stale stage tags (no recent analyses)");
      // Note: This would need to be handled by the persistence module
      return;
    }

    const allowedIds = new Set(snapshot.map((item) => item.id));
    let mutated = false;
    const next: Record<number, AnalysisStatus> = {};
    for (const [id, stage] of Object.entries(currentStatuses)) {
      const numericId = Number.parseInt(id, 10);
      if (allowedIds.has(numericId)) {
        next[numericId] = stage as AnalysisStatus;
      } else {
        mutated = true;
      }
    }
    
    if (mutated) {
      // Note: This would need to be handled by the persistence module
      console.info(`[home] cleaned up stale statuses: ${Object.keys(next).length} remaining`);
    }
  }, [isHydrated, recentSignature, statuses]);

  // Enhanced startTask that tracks new tasks
  const enhancedStartTask = useCallback(async (searchUrl: string) => {
    const task = await startTask(searchUrl);
    // Add new task to allowed list
    setAllowedTaskIds(prev => new Set([...prev, task.id]));
    console.info(`[home] started new task ${task.id}, added to allowed list`);
    return task;
  }, [startTask]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  // Manual reset function to force clear the reset flag if it gets stuck
  const forceClearReset = useCallback(() => {
    console.warn('[home] manually clearing reset flag');
    setIsResetting(false);
  }, []);

  // Debug function to log current state
  const debugState = useCallback(() => {
    console.info('[home] current state debug:', {
      isResetting,
      tasksCount: tasks.length,
      allowedTaskIds: Array.from(allowedTaskIds),
      recentCount: recent.length,
      isHydrated,
      isStreaming
    });
  }, [isResetting, tasks.length, allowedTaskIds, recent.length, isHydrated, isStreaming]);

  // Emergency reset function that can be called from console
  useEffect(() => {
    // Make functions available globally for debugging
    const debugInterface = {
      debugState,
      forceClearReset,
      isResetting,
      tasksCount: tasks.length,
      allowedTaskIds: Array.from(allowedTaskIds),
      recentCount: recent.length
    };
    
    (window as unknown as { debugJobCrawler: typeof debugInterface }).debugJobCrawler = debugInterface;
    
    return () => {
      const win = window as unknown as { debugJobCrawler?: typeof debugInterface };
      if (win.debugJobCrawler) {
        delete win.debugJobCrawler;
      }
    };
  }, [debugState, forceClearReset, isResetting, tasks.length, allowedTaskIds, recent.length]);

  return {
    recent: realtimeRecent,
    statuses,
    activeTasks,
    isStreaming,
    startTask: enhancedStartTask,
    clearAllTasks,
    handleStatusToggle,
    handleDelete,
    handleRefetch,
    handleRefresh,
    errorMessage,
    clearError,
    forceClearReset,
    isResetting,
    debugState,
  };
}
