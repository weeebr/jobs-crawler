// Re-export all storage modules
export { analysisStorage, analysisStorageCompat } from './analysisStorageConsolidated';
export { jobSearchStorage } from './jobSearchStorage';
export { cvProfileStorage } from './cvProfileStorage';
export { dbUtils } from './dbUtils';

// Main analysis storage interface - this is the primary export used throughout the app
export { analysisStorage as default } from './analysisStorageConsolidated';
