import type { AnalysisRecord, LegacyAnalysisRecord } from "../types";
import { analysisRecordSchema, legacyAnalysisRecordSchema } from "../schemas";
import { REPORT_STORAGE_PREFIX, isBrowser } from "./types";

// Load complete analysis record with separated data
export function loadAnalysisRecord(id: number): AnalysisRecord | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(REPORT_STORAGE_PREFIX + id);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    
    // Try to validate as current format first
    try {
      return analysisRecordSchema.parse(parsed);
    } catch (error) {
      // Try legacy format
      try {
        const legacyRecord = legacyAnalysisRecordSchema.parse(parsed);
        return convertLegacyRecord(legacyRecord);
      } catch (legacyError) {
        console.warn("[clientStorage] invalid analysis record format:", error);
        return null;
      }
    }
  } catch (error) {
    console.warn("[clientStorage] failed to load analysis", error);
    return null;
  }
}

// Convert legacy records to new structure
function convertLegacyRecord(legacy: LegacyAnalysisRecord): AnalysisRecord {
  const { analysis, ...rest } = legacy;
  const { status, notes, ...llmData } = analysis;
  
  return {
    ...rest,
    llmAnalysis: llmData,
    userInteractions: {
      status,
      notes,
      lastViewedAt: Date.now(),
      interactionCount: 0,
    }
  };
}

export function persistAnalysisRecord(record: AnalysisRecord) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      REPORT_STORAGE_PREFIX + record.id,
      JSON.stringify(record),
    );
  } catch (error) {
    console.warn("[clientStorage] failed to persist analysis", error);
  }
}

export function removeAnalysisRecord(id: number) {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(REPORT_STORAGE_PREFIX + id);
  } catch (error) {
    console.warn("[clientStorage] failed to remove analysis", error);
  }
}

export function clearAllData() {
  if (!isBrowser()) return;
  try {
    // Clear all localStorage keys that start with our prefixes
    const keys = Object.keys(window.localStorage);
    let clearedCount = 0;
    
    for (const key of keys) {
      if (key.startsWith("cv-analyzer::") || key.startsWith("jobs-crawler::") || key.startsWith("recent-analyses") || key.startsWith("analysis-statuses")) {
        window.localStorage.removeItem(key);
        clearedCount++;
      }
    }
    
    console.info(`[clientStorage] cleared ${clearedCount} local data entries`);
  } catch (error) {
    console.warn("[clientStorage] failed to clear all data", error);
  }
}

// Helper functions for working with separated data
export function getFetchedJobData(id: number): AnalysisRecord['job'] | null {
  const record = loadAnalysisRecord(id);
  return record ? record.job : null;
}

export function getEnrichedAnalysis(id: number): AnalysisRecord['llmAnalysis'] | null {
  const record = loadAnalysisRecord(id);
  return record ? record.llmAnalysis : null;
}

export function getUserInteractions(id: number): AnalysisRecord['userInteractions'] | null {
  const record = loadAnalysisRecord(id);
  return record ? record.userInteractions : null;
}

// Get all existing job URLs from localStorage to check for duplicates
export function getExistingJobUrls(): Set<string> {
  if (!isBrowser()) return new Set();
  
  const existingUrls = new Set<string>();
  
  try {
    const keys = Object.keys(window.localStorage);
    for (const key of keys) {
      if (key.startsWith(REPORT_STORAGE_PREFIX)) {
        const record = loadAnalysisRecord(parseInt(key.replace(REPORT_STORAGE_PREFIX, '')));
        if (record?.job?.jobUrl) {
          existingUrls.add(record.job.jobUrl);
        }
        if (record?.job?.sourceUrl) {
          existingUrls.add(record.job.sourceUrl);
        }
      }
    }
  } catch (error) {
    console.warn("[clientStorage] failed to get existing job URLs", error);
  }
  
  return existingUrls;
}
