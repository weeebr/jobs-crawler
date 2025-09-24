import type { AnalysisRecord } from "../types";
import { analysisClient } from "./analysisClient";

/**
 * Client-side analysis storage that uses API routes
 * This is safe to import on the client side as it doesn't use Node.js modules
 */

export const clientAnalysisStorage = {
  async save(record: AnalysisRecord): Promise<AnalysisRecord> {
    return analysisClient.save(record);
  },

  async get(id: number): Promise<AnalysisRecord | null> {
    return analysisClient.get(id);
  },

  async list(limit?: number): Promise<AnalysisRecord[]> {
    return analysisClient.list(limit);
  },

  async remove(id: number): Promise<boolean> {
    return analysisClient.remove(id);
  },

  async clear(): Promise<void> {
    return analysisClient.clear();
  },

  async getStats() {
    return analysisClient.getStats();
  },

  async getNewThisRun(): Promise<AnalysisRecord[]> {
    return analysisClient.getNewThisRun();
  },

  async markAsNewThisRun(ids: number[]): Promise<void> {
    return analysisClient.markAsNewThisRun(ids);
  },

  async searchByCompany(company: string): Promise<AnalysisRecord[]> {
    return analysisClient.searchByCompany(company);
  },

  async getByStatus(status: 'interested' | 'applied'): Promise<AnalysisRecord[]> {
    return analysisClient.getByStatus(status);
  },

  async update(id: number, updates: Partial<AnalysisRecord>): Promise<AnalysisRecord | null> {
    return analysisClient.update(id, updates);
  },
};
