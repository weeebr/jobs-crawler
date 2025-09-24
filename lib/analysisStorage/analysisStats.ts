import { initializeStorage } from "../analysisStorageInit";
import { getCurrentApiKey } from "../analysisStorageUtils";
import { getStorageState } from "../analysisStorageState";

export const analysisStats = {
  // Get statistics from database
  async getStats() {
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
    return await currentState.dbStorage.getStats(apiKey);
  },
};
