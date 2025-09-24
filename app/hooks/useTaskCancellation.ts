"use client";

import { usePageUnload } from "@/lib/usePageUnload";
import { cancelAllActiveTasks } from "@/lib/backgroundTasks";

/**
 * Custom hook to handle task cancellation on page unload and route changes
 * Handles browser refresh, tab close, and navigation away from the page
 */
export function useTaskCancellation() {
  // Cancel all running background tasks when page is unloaded (refresh, close, navigate)
  // This covers browser refresh (F5, Ctrl+R), tab closing, and programmatic navigation
  usePageUnload(() => { cancelAllActiveTasks(); });
}
