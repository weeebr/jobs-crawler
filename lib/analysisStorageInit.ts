import { type AnalysisRecordsTable, type UsersTable, type StorageState } from './analysisStorageTypes';
import { getOrCreateUser } from './db/users';
import { eq } from 'drizzle-orm';

// Import shared state from a separate module
import { getStorageState, setStorageState } from './analysisStorageState';

// Import the consolidated analysis storage
import { analysisStorageCompat } from './db/analysisStorageConsolidated';

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
    const userManager = async (apiKey: string) => {
      const apiKeyHash = hashApiKey(apiKey);
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.apiKeyHash, apiKeyHash))
        .limit(1);

      if (existingUser.length > 0) {
        return existingUser[0];
      }

      const now = new Date();
      const newUser = await db.insert(users).values({
        apiKeyHash,
        createdAt: now,
        lastActiveAt: now,
        totalAnalyses: 0,
        preferredModel: 'gpt-4o-mini',
      }).returning();

      return newUser[0];
    };

    // Use the consolidated analysis storage
    setStorageState({
      dbStorage: analysisStorageCompat,
      getOrCreateUser: userManager,
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
import { and, desc, like } from "drizzle-orm";
import { sql } from "drizzle-orm";
