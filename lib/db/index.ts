import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Ensure data directory exists
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = './data/jobs-crawler.db';

try {
  mkdirSync(dirname(DB_PATH), { recursive: true });
} catch (error) {
  // Directory might already exist, that's fine
}

// Initialize SQLite database
const sqlite = new Database(DB_PATH);

// Enable foreign keys and other optimizations
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export the raw database for direct queries if needed
export { sqlite };

// Helper function to check if database is initialized
export function isDatabaseReady(): boolean {
  try {
    const result = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='analysis_records'").get();
    return !!result;
  } catch {
    return false;
  }
}

// Graceful database initialization
export async function initializeDatabase() {
  if (isDatabaseReady()) {
    console.info('[db] Database already initialized');
    return;
  }

  console.info('[db] Initializing database...');

  try {
    // Import migrations and run them
    const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
    migrate(db, { migrationsFolder: './lib/db/migrations' });
    console.info('[db] Database initialized successfully');
  } catch (error) {
    console.error('[db] Failed to initialize database:', error);
    throw error;
  }
}
