import type { StorageState } from './analysisStorageTypes';

// Shared storage state that all modules can access and modify
let storageState: StorageState = {
  dbStorage: null,
  getOrCreateUser: null,
  isInitialized: false,
  initializationError: null,
};

export function getStorageState(): StorageState {
  return storageState;
}

export function setStorageState(newState: Partial<StorageState>): void {
  storageState = { ...storageState, ...newState };
}
