import type { AnalysisRecord } from "./types";
import type { AnalysisRecord as DbAnalysisRecord } from "./db/schema";

// Define database table types
export type AnalysisRecordsTable = typeof import('./db/schema').analysisRecords;
export type UsersTable = typeof import('./db/schema').users;

// Define types for the database storage interface
export interface DatabaseStorage {
  save: (apiKey: string, record: Omit<DbAnalysisRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<DbAnalysisRecord>;
  getById: (apiKey: string, id: number) => Promise<DbAnalysisRecord | null>;
  getAll: (apiKey: string, limit?: number) => Promise<DbAnalysisRecord[]>;
  delete: (apiKey: string, id: number) => Promise<boolean>;
  getStats: (apiKey: string) => Promise<{ total: number; interested: number; applied: number; averageScore: number; userId: number; memberSince: number }>;
  getNewThisRun: (apiKey: string) => Promise<DbAnalysisRecord[]>;
  update: (apiKey: string, id: number, updates: Partial<DbAnalysisRecord>) => Promise<DbAnalysisRecord | null>;
  searchByCompany: (apiKey: string, company: string) => Promise<DbAnalysisRecord[]>;
  getByStatus: (apiKey: string, status: "interested" | "applied") => Promise<DbAnalysisRecord[]>;
}

// Storage state
export interface StorageState {
  dbStorage: DatabaseStorage | null;
  getOrCreateUser: ((apiKey: string) => Promise<{ id: number; apiKey: string; createdAt: Date; updatedAt: Date }>) | null;
  isInitialized: boolean;
  initializationError: Error | null;
}
