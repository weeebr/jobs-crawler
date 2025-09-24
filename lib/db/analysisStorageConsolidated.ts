import { AnalysisStorageCrud } from './analysisStorageCrud';
import { AnalysisStorageSearch } from './analysisStorageSearch';
import { AnalysisStorageStats } from './analysisStorageStats';
import type { AnalysisRecord } from '../types';
import type { NewAnalysisRecord } from "./schema";

// Main consolidated storage class that delegates to specialized classes
export class AnalysisStorage {
  private crud: AnalysisStorageCrud;
  private search: AnalysisStorageSearch;
  private stats: AnalysisStorageStats;

  constructor() {
    this.crud = new AnalysisStorageCrud();
    this.search = new AnalysisStorageSearch();
    this.stats = new AnalysisStorageStats();
  }

  // CRUD Operations
  async save(apiKey: string, record: AnalysisRecord): Promise<AnalysisRecord> {
    return this.crud.save(apiKey, record);
  }

  async getById(apiKey: string, id: number): Promise<AnalysisRecord | null> {
    return this.crud.getById(apiKey, id);
  }

  async getAll(apiKey: string, limit = 50, offset = 0): Promise<AnalysisRecord[]> {
    return this.crud.getAll(apiKey, limit, offset);
  }

  async list(apiKey: string, limit = 50): Promise<AnalysisRecord[]> {
    return this.crud.list(apiKey, limit);
  }

  async update(apiKey: string, id: number, updates: Partial<AnalysisRecord>): Promise<AnalysisRecord | null> {
    return this.crud.update(apiKey, id, updates);
  }

  async delete(apiKey: string, id: number): Promise<boolean> {
    return this.crud.delete(apiKey, id);
  }

  async remove(apiKey: string, id: number): Promise<boolean> {
    return this.crud.remove(apiKey, id);
  }

  async existsByUrl(apiKey: string, sourceUrl: string): Promise<boolean> {
    return this.crud.existsByUrl(apiKey, sourceUrl);
  }

  // Search Operations
  async searchByCompany(apiKey: string, company: string): Promise<AnalysisRecord[]> {
    return this.search.searchByCompany(apiKey, company);
  }

  async getByStatus(apiKey: string, status: 'interested' | 'applied'): Promise<AnalysisRecord[]> {
    return this.search.getByStatus(apiKey, status);
  }

  async getRecent(apiKey: string, count = 10): Promise<AnalysisRecord[]> {
    return this.search.getRecent(apiKey, count);
  }

  // Statistics Operations
  async getStats(apiKey: string) {
    return this.stats.getStats(apiKey);
  }

  async markAsNewThisRun(apiKey: string, ids: number[]): Promise<void> {
    return this.stats.markAsNewThisRun(apiKey, ids);
  }

  async getNewThisRun(apiKey: string): Promise<AnalysisRecord[]> {
    return this.stats.getNewThisRun(apiKey);
  }

  async clear(apiKey: string): Promise<void> {
    return this.crud.clear(apiKey);
  }

  async clearAll(): Promise<void> {
    return this.stats.clearAll();
  }
}

// Create singleton instance
export const analysisStorage = new AnalysisStorage();

// Export for backward compatibility with object-based interface
export const analysisStorageCompat = {
  save: (apiKey: string, record: AnalysisRecord | Omit<NewAnalysisRecord, 'userId'>) => analysisStorage.save(apiKey, record as AnalysisRecord),
  getById: (apiKey: string, id: number) => analysisStorage.getById(apiKey, id),
  getAll: (apiKey: string, limit?: number, offset?: number) => analysisStorage.getAll(apiKey, limit ?? 50, offset ?? 0),
  list: (apiKey: string, limit?: number) => analysisStorage.list(apiKey, limit ?? 50),
  searchByCompany: (apiKey: string, company: string) => analysisStorage.searchByCompany(apiKey, company),
  getByStatus: (apiKey: string, status: 'interested' | 'applied') => analysisStorage.getByStatus(apiKey, status),
  getRecent: (apiKey: string, count?: number) => analysisStorage.getRecent(apiKey, count ?? 10),
  update: (apiKey: string, id: number, updates: Partial<AnalysisRecord> | Partial<Omit<NewAnalysisRecord, 'userId'>>) => analysisStorage.update(apiKey, id, updates as Partial<AnalysisRecord>),
  delete: (apiKey: string, id: number) => analysisStorage.delete(apiKey, id),
  remove: (apiKey: string, id: number) => analysisStorage.remove(apiKey, id),
  existsByUrl: (apiKey: string, sourceUrl: string) => analysisStorage.existsByUrl(apiKey, sourceUrl),
  clear: (apiKey?: string) => apiKey ? analysisStorage.clear(apiKey) : analysisStorage.clearAll(),
  clearAll: () => analysisStorage.clearAll(),
  getStats: (apiKey: string) => analysisStorage.getStats(apiKey),
  markAsNewThisRun: (apiKey: string, ids: number[]) => analysisStorage.markAsNewThisRun(apiKey, ids),
  getNewThisRun: (apiKey: string) => analysisStorage.getNewThisRun(apiKey),
};
