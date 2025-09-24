import type {
  RecentAnalysisSummary,
  AnalysisStatus,
  FilterState
} from "../schemas";

// Storage keys
export const RECENT_ANALYSES_KEY = "cv-analyzer::recent";
export const REPORT_STORAGE_PREFIX = "cv-analyzer::report::";
export const USER_INTERACTIONS_KEY = "cv-analyzer::user-interactions";
export const ANALYSIS_STAGE_KEY = "cv-analyzer::stage"; // Legacy
export const FILTER_STATE_KEY = "cv-analyzer::filter-state";
export const SEEN_ANALYSES_KEY = "cv-analyzer::seen-analyses";

// Re-export types from schemas
export type { RecentAnalysisSummary, AnalysisStatus, FilterState };

export const DEFAULT_FILTER_STATE: FilterState = {
  size: "all",
  score: "all",
  location: "all",
  tech: "all",
  status: "all",
  sort: "posting-newest",
  search: "",
};

// Utility function
export function isBrowser() {
  return (typeof window !== "undefined" && typeof window.localStorage !== "undefined") ||
         (typeof global !== "undefined" && typeof global.localStorage !== "undefined");
}

// Get localStorage with fallback for test environments
export function getLocalStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (typeof global !== "undefined" && global.localStorage) {
    return global.localStorage;
  }
  return null;
}
