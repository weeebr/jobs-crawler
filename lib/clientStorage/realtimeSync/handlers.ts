import type { RecentAnalysisSummary, AnalysisStatus } from "../types";

export function handleStorageChange(
  event: StorageEvent,
  loadRecentSummaries: () => RecentAnalysisSummary[],
  loadAnalysisStatuses: () => Record<number, AnalysisStatus>,
  updateQueueRef: React.MutableRefObject<{ recent?: RecentAnalysisSummary[]; statuses?: Record<number, AnalysisStatus> }>,
  batchUpdate: () => void
) {
  if (event.key === 'recent-analyses') {
    const newRecent = loadRecentSummaries();
    updateQueueRef.current.recent = newRecent;
    batchUpdate();
  }

  if (event.key === 'analysis-statuses') {
    const newStatuses = loadAnalysisStatuses();
    updateQueueRef.current.statuses = newStatuses;
    batchUpdate();
  }
}

export function handleImmediateUpdate(
  event: CustomEvent,
  loadRecentSummaries: () => RecentAnalysisSummary[],
  loadAnalysisStatuses: () => Record<number, AnalysisStatus>,
  updateQueueRef: React.MutableRefObject<{ recent?: RecentAnalysisSummary[]; statuses?: Record<number, AnalysisStatus> }>,
  batchUpdate: () => void
) {
  if (event.detail.type === 'recent') {
    const newRecent = loadRecentSummaries();
    updateQueueRef.current.recent = newRecent;
    batchUpdate();
  } else if (event.detail.type === 'analysis') {
    // For individual analysis updates, refresh everything to be safe
    const newRecent = loadRecentSummaries();
    const newStatuses = loadAnalysisStatuses();
    updateQueueRef.current.recent = newRecent;
    updateQueueRef.current.statuses = newStatuses;
    batchUpdate();
  }
}
