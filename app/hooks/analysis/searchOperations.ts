import { clientAnalysisStorage } from "@/lib/clientStorage/clientAnalysisStorage";
import type { AnalysisRecord } from "@/lib/types";

export async function loadAnalyses(
  limit?: number,
  onSuccess?: (records: AnalysisRecord[]) => void,
  onError?: (error: string) => void
): Promise<AnalysisRecord[]> {
  try {
    const records = await clientAnalysisStorage.list(limit);
    onSuccess?.(records);
    return records;
  } catch (error) {
    const errorMessage = 'Failed to load analyses from database';
    onError?.(errorMessage);
    throw new Error(errorMessage);
  }
}

export async function searchByCompany(
  company: string,
  onSuccess?: (results: AnalysisRecord[]) => void,
  onError?: (error: string) => void
): Promise<AnalysisRecord[]> {
  try {
    const results = await clientAnalysisStorage.searchByCompany(company);
    console.info(`[searchOperations] searched for "${company}", found ${results.length} results`);
    onSuccess?.(results);
    return results;
  } catch (error) {
    const errorMessage = 'Failed to search by company';
    console.error('[searchOperations] failed to search by company:', error);
    onError?.(errorMessage);
    throw new Error(errorMessage);
  }
}

export async function getByStatus(
  status: 'interested' | 'applied',
  onSuccess?: (results: AnalysisRecord[]) => void,
  onError?: (error: string) => void
): Promise<AnalysisRecord[]> {
  try {
    const results = await clientAnalysisStorage.getByStatus(status);
    console.info(`[searchOperations] filtered by status "${status}", found ${results.length} results`);
    onSuccess?.(results);
    return results;
  } catch (error) {
    const errorMessage = 'Failed to filter by status';
    console.error('[searchOperations] failed to filter by status:', error);
    onError?.(errorMessage);
    throw new Error(errorMessage);
  }
}

export async function clearAll(
  onSuccess?: () => void,
  onError?: (error: string) => void
): Promise<void> {
  try {
    await clientAnalysisStorage.clear();
    console.info('[searchOperations] cleared all analyses');
    onSuccess?.();
  } catch (error) {
    const errorMessage = 'Failed to clear analyses';
    console.error('[searchOperations] failed to clear analyses:', error);
    onError?.(errorMessage);
    throw new Error(errorMessage);
  }
}

export async function getStats(onError?: (error: Error) => void) {
  try {
    return await clientAnalysisStorage.getStats();
  } catch (error) {
    console.error('[searchOperations] failed to get stats:', error);
    onError?.(error as Error);
    return {
      total: 0,
      interested: 0,
      applied: 0,
      averageScore: 0,
      userId: 0,
      memberSince: Date.now(),
    };
  }
}
