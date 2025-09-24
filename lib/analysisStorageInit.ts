import { type AnalysisRecordsTable, type UsersTable, type StorageState } from './analysisStorageTypes';
import { createStorageInterface, createUserManager } from './analysisStorageInterface';

// Import shared state from a separate module
import { getStorageState, setStorageState } from './analysisStorageState';

// Initialize database storage synchronously
export async function initializeStorage() {
  const state = getStorageState();

  if (state.isInitialized) {
    return;
  }

  if (typeof window !== 'undefined') {
    const error = new Error('Cannot initialize database storage on client side');
    setStorageState({ ...state, initializationError: error });
    console.error('[analysisStorageInit] Attempted to initialize on client side');
    return;
  }

  try {
    console.info('[analysisStorageInit] Initializing database storage...');

    // Dynamic imports to avoid bundling on client - import all modules first
    const [dbModule, schemaModule, usersModule] = await Promise.all([
      import("./db/index"),
      import("./db/schema"),
      import("./db/users")
    ]);

    const { db } = dbModule;
    const { analysisRecords, users } = schemaModule;
    const { hashApiKey } = usersModule;

    // Initialize database if needed
    if (!dbModule.isDatabaseReady()) {
      console.info('[analysisStorageInit] Database not ready, initializing...');
      await dbModule.initializeDatabase();
    }

    // Create user manager first
    const getOrCreateUser = createUserManager(db, users, hashApiKey);

    // Create storage interface
    const dbStorage = createStorageInterface(db, analysisRecords, users, hashApiKey, getOrCreateUser);

    setStorageState({
      dbStorage,
      getOrCreateUser,
      isInitialized: true,
      initializationError: null
    });

    console.info('[analysisStorageInit] Database storage initialized successfully');
  } catch (error) {
    console.error('[analysisStorageInit] Failed to initialize database storage:', error);
    const initError = error instanceof Error ? error : new Error('Unknown initialization error');
    setStorageState({
      ...state,
      initializationError: initError,
      isInitialized: false
    });
    throw initError; // Re-throw to make sure the error is visible
  }
}


// Import required functions
import { and, eq, desc, like } from "drizzle-orm";
import { sql } from "drizzle-orm";
