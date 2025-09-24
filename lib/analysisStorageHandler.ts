// Import and re-export the main storage object from the consolidated module
import { analysisStorage } from './db/analysisStorageConsolidated';

// Also export types for backward compatibility
export type { DatabaseStorage, StorageState } from './analysisStorageTypes';

// Re-export other utilities that might be needed
export { initializeStorage } from './analysisStorageInit';
export { dbRecordToClientRecord, clientRecordToDbRecord } from './analysisStorageUtils';
export { getStorageState, setStorageState } from './analysisStorageState';

// Re-export with explicit typing
export { analysisStorage };




