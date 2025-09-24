"use client";

import { usePageUnload } from "@/lib/usePageUnload";
import { cancelAllActiveTasks } from "@/lib/backgroundTasks";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Custom hook to handle task cancellation on page unload and route changes
 * Handles browser refresh, tab close, and navigation away from the page
 */
export function useTaskCancellation() {
  // Cancel all running background tasks when page is unloaded (refresh, close, navigate)
  // This covers browser refresh (F5, Ctrl+R), tab closing, and programmatic navigation
  usePageUnload(() => { cancelAllActiveTasks(); });

  // Handle Next.js route changes (programmatic navigation)
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleRouteChange = () => {
      cancelAllActiveTasks();
    };

    // Listen for route changes using pathname instead of router.events
    // This will trigger when pathname changes
    const handlePathnameChange = () => {
      handleRouteChange();
    };

    // For now, we'll just handle page unload since Next.js 13+ doesn't expose route events
    // The usePageUnload covers the main use case (refresh, close, navigate)
  }, [pathname]);
}
