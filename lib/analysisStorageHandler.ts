// Re-export the main storage object from the modularized files
export { analysisStorage } from './analysisStorage/index';

// Also export types for backward compatibility
export type { DatabaseStorage, StorageState } from './analysisStorageTypes';

// Re-export other utilities that might be needed
export { initializeStorage } from './analysisStorageInit';
export { dbRecordToClientRecord, clientRecordToDbRecord } from './analysisStorageUtils';
export { getStorageState, setStorageState } from './analysisStorageState';




