import type { AnalysisRecord } from "./types";

/**
 * Validates that an analysis record is complete with all required LLM data
 */
export function isAnalysisComplete(record: AnalysisRecord): boolean {
  // Check if LLM analysis exists and has required fields
  if (!record.llmAnalysis) {
    return false;
  }
  
  const { llmAnalysis } = record;
  
  // Must have match score
  if (typeof llmAnalysis.matchScore !== 'number' || isNaN(llmAnalysis.matchScore) || llmAnalysis.matchScore < 0 || llmAnalysis.matchScore > 100) {
    return false;
  }
  
  // Must have reasoning (at least one reasoning point)
  if (!Array.isArray(llmAnalysis.reasoning) || llmAnalysis.reasoning.length === 0) {
    return false;
  }
  
  // Must have analysis timestamp
  if (typeof llmAnalysis.analyzedAt !== 'number' || llmAnalysis.analyzedAt <= 0) {
    return false;
  }
  
  // Check if job data is complete
  if (!record.job || !record.job.title || !record.job.company) {
    return false;
  }
  
  // Check if CV data is complete
  if (!record.cv || !Array.isArray(record.cv.roles) || !Array.isArray(record.cv.skills)) {
    return false;
  }
  
  return true;
}

/**
 * Filters complete analyses from a list of records
 */
export function filterCompleteAnalyses(records: AnalysisRecord[]): AnalysisRecord[] {
  return records.filter(isAnalysisComplete);
}

/**
 * Gets count of incomplete analyses
 */
export function getIncompleteCount(records: AnalysisRecord[]): number {
  return records.length - filterCompleteAnalyses(records).length;
}