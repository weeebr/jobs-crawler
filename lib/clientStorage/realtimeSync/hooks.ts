import { useCallback, useEffect, useRef, useState } from "react";
import { loadRecentSummaries } from "../recentSummaries";
import { loadAnalysisStatuses } from "../analysisStatus";
import type { RecentAnalysisSummary, AnalysisStatus } from "../types";
import { handleStorageChange, handleImmediateUpdate } from "./handlers";
import { batchUpdate } from "./batch";
import { refreshData, forceRefresh } from "./refresh";
import {
  createBatchUpdateHandler,
  createStorageChangeHandler,
  createImmediateUpdateHandler
} from "./syncHelpers";

/** Simplified real-time localStorage sync hook */
export function useRealtimeStorageSync() {
  const [recent, setRecent] = useState<RecentAnalysisSummary[]>([]);
  const [statuses, setStatuses] = useState<Record<number, AnalysisStatus>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateQueueRef = useRef<{ recent?: RecentAnalysisSummary[]; statuses?: Record<number, AnalysisStatus> }>({});
  const isUpdatingRef = useRef<boolean>(false);
  const lastForceRefreshRef = useRef<number>(0);
  const pendingUpdateRef = useRef<{ recent?: RecentAnalysisSummary[]; statuses?: Record<number, AnalysisStatus> } | null>(null);

  useEffect(() => {
    const loadInitialData = () => {
      const storedRecent = loadRecentSummaries();
      const storedStatuses = loadAnalysisStatuses();

      setRecent(storedRecent);
      setStatuses(storedStatuses);
      setIsHydrated(true);

      console.info(`[realtime-sync] loaded ${storedRecent.length} analyses and ${Object.keys(storedStatuses).length} statuses`);
    };

    loadInitialData();
  }, []);

  const batchUpdateCallback = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      const { recent: queuedRecent, statuses: queuedStatuses } = updateQueueRef.current;

      if (queuedRecent) {
        setRecent(queuedRecent);
      }

      if (queuedStatuses) {
        setStatuses(queuedStatuses);
      }

      updateQueueRef.current = {};
    }, 100);
  }, [setRecent, setStatuses]);

  useEffect(() => {
    if (!isHydrated) return;

    const timeoutId = setTimeout(() => {
      const handleStorageChangeEvent = createStorageChangeHandler(
        isUpdatingRef,
        loadRecentSummaries,
        loadAnalysisStatuses,
        updateQueueRef,
        batchUpdateCallback,
        handleStorageChange
      );

      const handleImmediateUpdateEvent = createImmediateUpdateHandler(
        isUpdatingRef,
        loadRecentSummaries,
        loadAnalysisStatuses,
        updateQueueRef,
        batchUpdateCallback,
        handleImmediateUpdate
      );

      window.addEventListener('storage', handleStorageChangeEvent);
      window.addEventListener('localStorageImmediateUpdate', handleImmediateUpdateEvent as EventListener);

      return () => {
        window.removeEventListener('storage', handleStorageChangeEvent);
        window.removeEventListener('localStorageImmediateUpdate', handleImmediateUpdateEvent as EventListener);
      };
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isHydrated, batchUpdateCallback]);


  const refreshDataCallback = useCallback(() => {
    if (isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    try {
      refreshData(
        loadRecentSummaries,
        loadAnalysisStatuses,
        setRecent,
        setStatuses,
        isUpdatingRef
      );
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [setRecent, setStatuses]);

  const forceRefreshCallback = useCallback(() => {
    const now = Date.now();

    if (now - lastForceRefreshRef.current < 100) {
      if (pendingUpdateRef.current) {
        return;
      }

      pendingUpdateRef.current = { recent: [], statuses: {} };
      setTimeout(() => {
        if (pendingUpdateRef.current) {
          const newRecent = loadRecentSummaries();
          const newStatuses = loadAnalysisStatuses();
          setRecent(newRecent);
          setStatuses(newStatuses);
          pendingUpdateRef.current = null;
        }
      }, 100);
      return;
    }

    lastForceRefreshRef.current = now;

    forceRefresh(
      loadRecentSummaries,
      loadAnalysisStatuses,
      setRecent,
      setStatuses
    );
  }, [setRecent, setStatuses]);

  const clearAllData = useCallback(() => {
    setRecent([]);
    setStatuses({});

    isUpdatingRef.current = false;
    updateQueueRef.current = {};

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    setIsHydrated(false);

    setTimeout(() => {
      const storedRecent = loadRecentSummaries();
      const storedStatuses = loadAnalysisStatuses();
      setRecent(storedRecent);
      setStatuses(storedStatuses);
      setIsHydrated(true);
    }, 50);
  }, []);

  return {
    recent,
    statuses,
    isHydrated,
    refreshData: refreshDataCallback,
    forceRefresh: forceRefreshCallback,
    clearAllData,
  };
}
