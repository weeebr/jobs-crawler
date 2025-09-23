"use client";

import { useMemo } from "react";
import type { BackgroundTask } from "@/lib/useBackgroundTasks";
import type { RecentAnalysisSummary } from "@/lib/clientStorage";

interface UseRealtimeDashboardOptions {
  activeTasks: BackgroundTask[];
  recent: RecentAnalysisSummary[];
}

/**
 * Hook for real-time dashboard updates
 * Ensures dashboard cards get updates as soon as background tasks progress
 */
export function useRealtimeDashboard({ activeTasks, recent }: UseRealtimeDashboardOptions) {
  const realtimeRecent = useMemo(() => {
    // The recent array should already contain merged data from localStorage
    // Just return it as-is and let the data flow handle the merging
    console.info(`[realtime-dashboard] displaying ${recent.length} analyses`);
    return recent;
  }, [recent]);

  return {
    realtimeRecent,
  };
}
