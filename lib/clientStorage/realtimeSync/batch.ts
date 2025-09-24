import type { RecentAnalysisSummary, AnalysisStatus } from "../types";

export function batchUpdate(
  updateQueueRef: React.MutableRefObject<{ recent?: RecentAnalysisSummary[]; statuses?: Record<number, AnalysisStatus> }>,
  setRecent: (recent: RecentAnalysisSummary[]) => void,
  setStatuses: (statuses: Record<number, AnalysisStatus>) => void
) {
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
}
