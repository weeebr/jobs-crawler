import type { RecentAnalysisSummary, AnalysisStatus } from "../types";

/**
 * Helper functions for realtime storage sync
 */

export function createBatchUpdateHandler(
  batchTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  updateQueueRef: React.MutableRefObject<{ recent?: RecentAnalysisSummary[]; statuses?: Record<number, AnalysisStatus> }>,
  batchUpdateCallback: () => void
) {
  return () => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    batchTimeoutRef.current = setTimeout(() => {
      const { recent: queuedRecent, statuses: queuedStatuses } = updateQueueRef.current;

      if (queuedRecent) {
        console.info(`[realtime-sync] batched update: ${queuedRecent.length} analyses`);
      }

      if (queuedStatuses) {
        console.info(`[realtime-sync] batched update: ${Object.keys(queuedStatuses).length} statuses`);
      }

      updateQueueRef.current = {};
      batchUpdateCallback();
    }, 100);
  };
}

export function createStorageChangeHandler(
  isUpdatingRef: React.MutableRefObject<boolean>,
  loadRecentSummaries: () => RecentAnalysisSummary[],
  loadAnalysisStatuses: () => Record<number, AnalysisStatus>,
  updateQueueRef: React.MutableRefObject<{ recent?: RecentAnalysisSummary[]; statuses?: Record<number, AnalysisStatus> }>,
  batchUpdateCallback: () => void,
  handleStorageChange: (event: StorageEvent, loadRecent: () => RecentAnalysisSummary[], loadStatuses: () => Record<number, AnalysisStatus>, updateQueue: React.MutableRefObject<{ recent?: RecentAnalysisSummary[]; statuses?: Record<number, AnalysisStatus> }>, batchCallback: () => void) => void
) {
  return (event: StorageEvent) => {
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
}

export function createImmediateUpdateHandler(
  isUpdatingRef: React.MutableRefObject<boolean>,
  loadRecentSummaries: () => RecentAnalysisSummary[],
  loadAnalysisStatuses: () => Record<number, AnalysisStatus>,
  updateQueueRef: React.MutableRefObject<{ recent?: RecentAnalysisSummary[]; statuses?: Record<number, AnalysisStatus> }>,
  batchUpdateCallback: () => void,
  handleImmediateUpdate: (event: CustomEvent, loadRecent: () => RecentAnalysisSummary[], loadStatuses: () => Record<number, AnalysisStatus>, updateQueue: React.MutableRefObject<{ recent?: RecentAnalysisSummary[]; statuses?: Record<number, AnalysisStatus> }>, batchCallback: () => void) => void
) {
  return (event: CustomEvent) => {
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
}
