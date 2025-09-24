import { useCallback, useEffect, useRef, useState } from "react";
import { loadRecentSummaries, loadAnalysisStatuses } from "../index";
import type { RecentAnalysisSummary, AnalysisStatus } from "../types";
import { handleStorageChange, handleImmediateUpdate } from "./handlers";
import { batchUpdate } from "./batch";
import { refreshData, forceRefresh } from "./refresh";

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
        console.info(`[realtime-sync] batched update: ${queuedRecent.length} analyses`);
      }

      if (queuedStatuses) {
        setStatuses(queuedStatuses);
        console.info(`[realtime-sync] batched update: ${Object.keys(queuedStatuses).length} statuses`);
      }

      updateQueueRef.current = {};
    }, 100);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const timeoutId = setTimeout(() => {
      const handleStorageChangeEvent = (event: StorageEvent) => {
        if (isUpdatingRef.current) return;

        if (event.key === 'recent-analyses' || event.key === 'analysis-statuses') {
          console.info(`[realtime-sync] storage change detected for ${event.key}`);

          isUpdatingRef.current = true;

          try {
            handleStorageChange(event, loadRecentSummaries, loadAnalysisStatuses, updateQueueRef, batchUpdateCallback);
          } finally {
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 100);
          }
        }
      };

      const handleImmediateUpdateEvent = (event: CustomEvent) => {
        if (isUpdatingRef.current) return;

        console.info(`[realtime-sync] immediate update detected for ${event.detail.key}`);

        isUpdatingRef.current = true;

        try {
          handleImmediateUpdate(event, loadRecentSummaries, loadAnalysisStatuses, updateQueueRef, batchUpdateCallback);
        } finally {
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 100);
        }
      };

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

  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

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
  }, []);

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
  }, []);

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
