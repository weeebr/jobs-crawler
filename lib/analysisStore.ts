import { 
  cvProfileSchema, 
  jobAdFetchedSchema,
  llmAnalysisSchema,
  userInteractionsSchema 
} from "./schemas";
import type { AnalysisRecord } from "./types";

type GlobalWithStore = typeof globalThis & {
  __analysisStore?: Map<number, AnalysisRecord>;
};

const globalStore = globalThis as GlobalWithStore;

if (!globalStore.__analysisStore) {
  globalStore.__analysisStore = new Map<number, AnalysisRecord>();
}

const analyses = globalStore.__analysisStore;

export function saveAnalysis(record: AnalysisRecord): AnalysisRecord {
  const parsedJob = jobAdFetchedSchema.parse(record.job);
  const parsedCv = cvProfileSchema.parse(record.cv);
  const parsedLLM = llmAnalysisSchema.parse(record.llmAnalysis);
  const parsedUser = userInteractionsSchema.parse(record.userInteractions);
  
  const normalized: AnalysisRecord = {
    ...record,
    job: parsedJob,
    cv: parsedCv,
    llmAnalysis: parsedLLM,
    userInteractions: parsedUser,
    createdAt: record.createdAt || Date.now(),
    updatedAt: record.updatedAt || Date.now(),
  };

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
  console.log(`[analysisStore] deleteAnalysis called for id: ${id}`);
  console.log(`[analysisStore] current store size: ${analyses.size}`);
  console.log(`[analysisStore] store keys:`, Array.from(analyses.keys()));
  const removed = analyses.delete(id);
  console.log(`[analysisStore] delete result: ${removed}`);
  console.log(`[analysisStore] new store size: ${analyses.size}`);
  return removed;
}

export function clearAllAnalyses(): void {
  analyses.clear();
  console.info('[analysisStore] cleared all analyses from server-side store');
}
