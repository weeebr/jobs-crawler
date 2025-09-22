import { 
  analysisEnrichedSchema, 
  cvProfileSchema, 
  jobAdFetchedSchema,
  llmAnalysisSchema,
  userInteractionsSchema 
} from "./schemas";
import type { AnalysisRecord, LegacyAnalysisRecord } from "./types";

type GlobalWithStore = typeof globalThis & {
  __analysisStore?: Map<number, AnalysisRecord>;
};

const globalStore = globalThis as GlobalWithStore;

if (!globalStore.__analysisStore) {
  globalStore.__analysisStore = new Map<number, AnalysisRecord>();
}

const analyses = globalStore.__analysisStore;

export function saveAnalysis(record: AnalysisRecord | LegacyAnalysisRecord): AnalysisRecord {
  const parsedJob = jobAdFetchedSchema.parse(record.job);
  const parsedCv = cvProfileSchema.parse(record.cv);
  
  // Handle both new and legacy record formats
  let normalized: AnalysisRecord;
  
  if ('llmAnalysis' in record && 'userInteractions' in record) {
    // New format
    const parsedLLM = llmAnalysisSchema.parse(record.llmAnalysis);
    const parsedUser = userInteractionsSchema.parse(record.userInteractions);
    normalized = {
      ...record,
      job: parsedJob,
      cv: parsedCv,
      llmAnalysis: parsedLLM,
      userInteractions: parsedUser,
      createdAt: record.createdAt || Date.now(),
      updatedAt: record.updatedAt || Date.now(),
    };
  } else {
    // Legacy format - convert to new structure
    const legacy = record as LegacyAnalysisRecord;
    const parsedAnalysis = analysisEnrichedSchema.parse(legacy.analysis);
    const { status, notes, ...llmData } = parsedAnalysis;
    
    normalized = {
      id: legacy.id,
      job: parsedJob,
      cv: parsedCv,
      llmAnalysis: llmData,
      userInteractions: {
        status,
        notes,
        lastViewedAt: Date.now(),
        interactionCount: 0,
      },
      createdAt: legacy.createdAt || Date.now(),
      updatedAt: legacy.updatedAt || Date.now(),
    };
  }

  analyses.set(record.id, normalized);
  return normalized;
}

export function getAnalysis(id: number): AnalysisRecord | undefined {
  return analyses.get(id);
}

export function listAnalyses(limit = 10): AnalysisRecord[] {
  return Array.from(analyses.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

export function deleteAnalysis(id: number): boolean {
  return analyses.delete(id);
}

export function clearAllAnalyses(): void {
  analyses.clear();
  console.info('[analysisStore] cleared all analyses from server-side store');
}
