import type { AnalysisRecord, LegacyAnalysisRecord } from "../types";
import type { LLMAnalysis, UserInteractions } from "../schemas";

// Storage keys
export const RECENT_ANALYSES_KEY = "cv-analyzer::recent";
export const REPORT_STORAGE_PREFIX = "cv-analyzer::report::";
export const USER_INTERACTIONS_KEY = "cv-analyzer::user-interactions";
export const ANALYSIS_STAGE_KEY = "cv-analyzer::stage"; // Legacy
export const FILTER_STATE_KEY = "cv-analyzer::filter-state";

// Core interfaces
export interface RecentAnalysisSummary {
  id: number;
  // Fetched data
  title: string;
  company: string;
  publishedAt?: string;
  location?: string;
  workload?: string;
  duration?: string;
  size?: string;
  stack: string[];
  // Enriched data
  matchScore: number;
  status?: "interested" | "applied"; // Simplified from userStage
  // Metadata
  createdAt: number;
  updatedAt: number;
}

export type AnalysisStatus = "interested" | "applied"; // Simplified from AnalysisStage

// Filter state interface
export interface FilterState {
  size: string;
  score: string;
  location: string;
  tech: string;
  status: "all" | AnalysisStatus;
  sort: "newest" | "oldest" | "score-high" | "score-low";
}

export const DEFAULT_FILTER_STATE: FilterState = {
  size: "all",
  score: "all",
  location: "all",
  tech: "all",
  status: "all",
  sort: "newest",
};

// Utility function
export function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
