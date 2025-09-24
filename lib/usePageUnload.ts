"use client";

import { useEffect, useCallback } from "react";

/**
 * Hook to handle page unload events and cancel running background tasks
 */
export function usePageUnload(onUnload?: () => void | Promise<void>) {
  const handleBeforeUnload = useCallback(async (event: BeforeUnloadEvent) => {
    // Only prevent default if there are async operations to cancel
    if (onUnload) {
      event.preventDefault();
      event.returnValue = '';

      // Execute cleanup asynchronously
      try {
        await onUnload();
      } catch (error) {
        console.warn('[usePageUnload] Error during cleanup:', error);
      }
    }
  }, [onUnload]);

  const handleUnload = useCallback(async () => {
    if (onUnload) {
      try {
        await onUnload();
      } catch (error) {
        console.warn('[usePageUnload] Error during cleanup:', error);
      }
    }
  }, [onUnload]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('unload', handleUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('unload', handleUnload);
      };
    }
  }, [handleBeforeUnload, handleUnload]);
}
