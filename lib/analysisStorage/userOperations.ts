import { initializeStorage } from "../analysisStorageInit";
import { getCurrentApiKey } from "../analysisStorageUtils";
import { getStorageState } from "../analysisStorageState";

export const userOperations = {
  // Mark analyses as new this run
  async markAsNewThisRun(ids: number[]): Promise<void> {
    if (typeof window !== 'undefined') {
      throw new Error('Database storage is not available on client side. This operation should be called from server-side API routes.');
    }

    const state = getStorageState();

    // Initialize storage if not already done
    if (!state.isInitialized || state.initializationError) {
      await initializeStorage();
      const updatedState = getStorageState();
      if (updatedState.initializationError) {
        throw new Error(`Database initialization failed: ${updatedState.initializationError.message}`);
      }
    }

    const currentState = getStorageState();
    if (!currentState.dbStorage) {
      throw new Error('Database storage not available after initialization');
    }

    const apiKey = await getCurrentApiKey();
    for (const id of ids) {
      await currentState.dbStorage.update(apiKey, id, { isNewThisRun: true });
    }
  },
};
