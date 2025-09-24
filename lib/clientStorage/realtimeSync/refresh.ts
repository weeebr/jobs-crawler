import type { RecentAnalysisSummary, AnalysisStatus } from "../types";

export function refreshData(
  loadRecentSummaries: () => RecentAnalysisSummary[],
  loadAnalysisStatuses: () => Record<number, AnalysisStatus>,
  setRecent: (setter: (prev: RecentAnalysisSummary[]) => RecentAnalysisSummary[]) => void,
  setStatuses: (setter: (prev: Record<number, AnalysisStatus>) => Record<number, AnalysisStatus>) => void,
  isUpdatingRef: React.MutableRefObject<boolean>
) {
  const newRecent = loadRecentSummaries();
  const newStatuses = loadAnalysisStatuses();

  setRecent(prev => {
    if (prev.length !== newRecent.length ||
        prev.some((item, index) => item.id !== newRecent[index]?.id)) {
      console.info(`[realtime-sync] manual refresh: ${newRecent.length} analyses`);
      return newRecent;
    }
    return prev;
  });

  setStatuses(prev => {
    const prevKeys = Object.keys(prev).sort();
    const newKeys = Object.keys(newStatuses).sort();
    if (prevKeys.length !== newKeys.length ||
        prevKeys.some((key, index) => key !== newKeys[index])) {
      console.info(`[realtime-sync] manual refresh: ${Object.keys(newStatuses).length} statuses`);
      return newStatuses;
    }
    return prev;
  });
}

export function forceRefresh(
  loadRecentSummaries: () => RecentAnalysisSummary[],
  loadAnalysisStatuses: () => Record<number, AnalysisStatus>,
  setRecent: (setter: (prev: RecentAnalysisSummary[]) => RecentAnalysisSummary[]) => void,
  setStatuses: (setter: (prev: Record<number, AnalysisStatus>) => Record<number, AnalysisStatus>) => void
) {
  const newRecent = loadRecentSummaries();
  const newStatuses = loadAnalysisStatuses();

  setRecent(prev => {
    if (JSON.stringify(prev) !== JSON.stringify(newRecent)) {
      return newRecent;
    }
    return prev;
  });

  setStatuses(prev => {
    if (JSON.stringify(prev) !== JSON.stringify(newStatuses)) {
      return newStatuses;
    }
    return prev;
  });
}
