import type { AnalysisRecord } from "./types";
import type { AnalysisRecord as DbAnalysisRecord } from "./db/schema";

// Define database table types
export type AnalysisRecordsTable = typeof import('./db/schema').analysisRecords;
export type UsersTable = typeof import('./db/schema').users;

// Define types for the database storage interface
export interface DatabaseStorage {
  save: (apiKey: string, record: Omit<AnalysisRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<AnalysisRecord>;
  getById: (apiKey: string, id: number) => Promise<AnalysisRecord | null>;
  getAll: (apiKey: string, limit?: number) => Promise<AnalysisRecord[]>;
  delete: (apiKey: string, id: number) => Promise<boolean>;
  getStats: (apiKey: string) => Promise<{ total: number; interested: number; applied: number; averageScore: number; userId: number; memberSince: number }>;
  getNewThisRun: (apiKey: string) => Promise<AnalysisRecord[]>;
  update: (apiKey: string, id: number, updates: Partial<AnalysisRecord>) => Promise<AnalysisRecord | null>;
  searchByCompany: (apiKey: string, company: string) => Promise<AnalysisRecord[]>;
  getByStatus: (apiKey: string, status: "interested" | "applied") => Promise<AnalysisRecord[]>;
}

// Storage state
export interface StorageState {
  dbStorage: DatabaseStorage | null;
  getOrCreateUser: ((apiKey: string) => Promise<{ id: number; createdAt: Date; apiKeyHash: string; lastActiveAt: Date; totalAnalyses: number | null; preferredModel: string | null; }>) | null;
  isInitialized: boolean;
  initializationError: Error | null;
}
