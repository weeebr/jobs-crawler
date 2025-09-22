import type { 
  AnalysisEnriched, 
  CVProfile, 
  JobAdFetched, 
  LLMAnalysis, 
  UserInteractions 
} from "./schemas";

// Complete analysis record with clear separation
export type AnalysisRecord = {
  id: number; // Numeric ID instead of UUID
  // Fetched data from external sources (immutable)
  job: JobAdFetched;
  cv: CVProfile;
  // LLM-generated analysis (immutable after generation)
  llmAnalysis: LLMAnalysis;
  // User interactions and preferences (mutable)
  userInteractions: UserInteractions;
  // Record metadata
  createdAt: number;
  updatedAt: number;
};

// Legacy combined record for backwards compatibility
export type LegacyAnalysisRecord = {
  id: number;
  job: JobAdFetched;
  cv: CVProfile;
  analysis: AnalysisEnriched; // Combined LLM + User data
  createdAt: number;
  updatedAt: number;
};

// Legacy type for backwards compatibility
export type { AnalysisDTO, JobAdParsed } from "./schemas";
