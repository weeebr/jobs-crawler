// Re-export all types and constants
export * from "./types";

// Re-export client-side storage functions (no database dependencies)
export {
  loadUserInteractions,
  persistUserInteractions,
  updateUserInteractions,
  updateAnalysisEnrichment,
} from "./userInteractions";

// Re-export recent summaries
export {
  loadRecentSummaries,
  persistRecentSummaries,
  toSummary,
  rebuildRecentSummaries,
} from "./recentSummaries";

// Re-export analysis status
export {
  loadAnalysisStatuses,
  persistAnalysisStatuses,
  clearAnalysisStatus,
  setAnalysisStatus,
} from "./analysisStatus";

// Re-export filter state
export {
  loadFilterState,
  persistFilterState,
} from "./filterState";

// Re-export realtime sync
export {
  useRealtimeStorageSync,
} from "./realtimeSync";

// Create a separate export for database-dependent functions
// This should only be used in server-side contexts
export {
  loadAnalysisRecord,
  persistAnalysisRecord,
  removeAnalysisRecord,
  clearAllData,
  getFetchedJobData,
  getEnrichedAnalysis,
  getUserInteractions,
} from "./core";
