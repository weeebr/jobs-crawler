import { useCallback, useEffect, useRef, useState } from "react";
import { loadRecentSummaries, loadAnalysisStatuses } from "./index";
import type { RecentAnalysisSummary, AnalysisStatus } from "./types";

/**
 * Custom hook for real-time localStorage synchronization
 * Listens for storage events and automatically updates state when localStorage changes
 */
export function useRealtimeStorageSync() {
  const [recent, setRecent] = useState<RecentAnalysisSummary[]>([]);
  const [statuses, setStatuses] = useState<Record<number, AnalysisStatus>>({});
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Track if we're in the middle of updating to prevent infinite loops
  const isUpdatingRef = useRef(false);
  
  // Batch update mechanism for smooth, unobtrusive updates
  const updateQueueRef = useRef<{
    recent?: RecentAnalysisSummary[];
    statuses?: Record<number, AnalysisStatus>;
  }>({});
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth batch update function
  const batchUpdate = useCallback(() => {
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
      
      // Clear the queue
      updateQueueRef.current = {};
    }, 100); // 100ms batch window for smooth updates
  }, []);

  // Load initial data
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

  // Listen for storage events (cross-tab updates)
  useEffect(() => {
    if (!isHydrated) return;
    
    // Add a small delay to prevent immediate updates during hydration
    const timeoutId = setTimeout(() => {
      const handleStorageChange = (event: StorageEvent) => {
        // Prevent infinite loops by checking if we're already updating
        if (isUpdatingRef.current) return;

        // Only respond to our specific keys
        if (event.key === 'recent-analyses' || event.key === 'analysis-statuses') {
          console.info(`[realtime-sync] storage change detected for ${event.key}`);
          
          isUpdatingRef.current = true;
          
          try {
            if (event.key === 'recent-analyses') {
              const newRecent = loadRecentSummaries();
              // Queue for batch update (smooth, unobtrusive)
              updateQueueRef.current.recent = newRecent;
              batchUpdate();
            }
            
            if (event.key === 'analysis-statuses') {
              const newStatuses = loadAnalysisStatuses();
              // Queue for batch update (smooth, unobtrusive)
              updateQueueRef.current.statuses = newStatuses;
              batchUpdate();
            }
          } finally {
            // Reset the flag after a short delay to allow for batch updates
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 100);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }, 100); // Small delay to prevent hydration conflicts
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isHydrated, batchUpdate]);

  // Cleanup batch timeout on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  // Manual refresh function for same-tab updates
  const refreshData = useCallback(() => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    try {
      const newRecent = loadRecentSummaries();
      const newStatuses = loadAnalysisStatuses();
      
      // Only update if data actually changed (prevent unnecessary re-renders)
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
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, []);

  // Force refresh function with loop protection
  const lastForceRefreshRef = useRef<number>(0);
  const forceRefresh = useCallback(() => {
    const now = Date.now();
    // Prevent calls within 50ms of each other
    if (now - lastForceRefreshRef.current < 50) {
      console.warn('[realtime-sync] force refresh throttled to prevent loops');
      return;
    }
    lastForceRefreshRef.current = now;
    
    const newRecent = loadRecentSummaries();
    const newStatuses = loadAnalysisStatuses();
    
    
    // Always update for force refresh (used for critical updates)
    // Force immediate state updates for critical updates
    setRecent(newRecent);
    setStatuses(newStatuses);
    
    console.info(`[realtime-sync] force refresh: ${newRecent.length} analyses, ${Object.keys(newStatuses).length} statuses`);
  }, []);

  // Clear all data function that resets state
  const clearAllData = useCallback(() => {
    // Clear all state
    setRecent([]);
    setStatuses({});
    
    // Clear all refs and internal state
    isUpdatingRef.current = false;
    updateQueueRef.current = {};
    
    // Clear any pending batch updates
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    
    // Reset hydration state to ensure proper re-initialization
    setIsHydrated(false);
    
    // Re-hydrate immediately after clearing
    setTimeout(() => {
      const storedRecent = loadRecentSummaries();
      const storedStatuses = loadAnalysisStatuses();
      setRecent(storedRecent);
      setStatuses(storedStatuses);
      setIsHydrated(true);
      console.info('[realtime-sync] re-hydrated after clear');
    }, 50);
    
    console.info('[realtime-sync] cleared all data from state and refs');
  }, []);

  return {
    recent,
    statuses,
    isHydrated,
    refreshData,
    forceRefresh,
    clearAllData,
  };
}
