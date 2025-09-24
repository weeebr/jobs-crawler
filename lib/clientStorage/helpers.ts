import type { AnalysisRecord } from "../types";
import { REPORT_STORAGE_PREFIX, isBrowser, getLocalStorage } from "./types";
import { loadAnalysisRecord } from "./analysisRecords";

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
  const storage = getLocalStorage();
  if (!storage) return new Set();

  const existingUrls = new Set<string>();

  try {
    const keys = Object.keys(storage);
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
