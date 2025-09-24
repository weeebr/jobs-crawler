import { clientAnalysisStorage } from "@/lib/clientStorage/clientAnalysisStorage";
import type { AnalysisRecord } from "@/lib/types";

export async function getAnalysis(id: number): Promise<AnalysisRecord | null> {
  try {
    return await clientAnalysisStorage.get(id);
  } catch (error) {
    console.error(`[analysisOperations] failed to get analysis ${id}:`, error);
    return null;
  }
}

export async function deleteAnalysis(
  id: number,
  onSuccess?: () => void
): Promise<boolean> {
  try {
    const success = await clientAnalysisStorage.remove(id);
    if (success) {
      console.info(`[analysisOperations] deleted analysis ${id}`);
      onSuccess?.();
    }
    return success;
  } catch (error) {
    console.error(`[analysisOperations] failed to delete analysis ${id}:`, error);
    return false;
  }
}

export async function updateAnalysisStatus(
  id: number,
  status: 'interested' | 'applied',
  onSuccess?: () => void
): Promise<boolean> {
  try {
    const updated = await clientAnalysisStorage.update(id, {
      userInteractions: {
        status,
        interactionCount: 0,
        isNewThisRun: false
      }
    });

    if (updated) {
      console.info(`[analysisOperations] updated analysis ${id} status to ${status}`);
      onSuccess?.();
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[analysisOperations] failed to update analysis ${id} status:`, error);
    return false;
  }
}

export async function markAsNewThisRun(ids: number[], onSuccess?: () => void): Promise<void> {
  try {
    await clientAnalysisStorage.markAsNewThisRun(ids);
    console.info(`[analysisOperations] marked ${ids.length} analyses as new`);
    onSuccess?.();
  } catch (error) {
    console.error('[analysisOperations] failed to mark analyses as new:', error);
  }
}
