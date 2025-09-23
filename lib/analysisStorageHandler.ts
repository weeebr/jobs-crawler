import type { AnalysisRecord } from "./types";
import { analysisRecordSchema } from "./schemas";
import {
  saveAnalysis,
  getAnalysis,
  listAnalyses,
  deleteAnalysis,
  clearAllAnalyses,
} from "./analysisStore";
import {
  loadAnalysisRecord,
  persistAnalysisRecord,
  removeAnalysisRecord,
  clearAllData,
} from "./clientStorage/core";
import { REPORT_STORAGE_PREFIX, isBrowser } from "./clientStorage/types";

export type AnalysisStorageScope = "server" | "client" | "both";

function listClientAnalyses(limit?: number): AnalysisRecord[] {
  if (!isBrowser()) {
    return [];
  }

  const records: AnalysisRecord[] = [];
  const storage = window.localStorage;

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith(REPORT_STORAGE_PREFIX)) {
      continue;
    }

    const id = Number.parseInt(key.slice(REPORT_STORAGE_PREFIX.length), 10);
    if (!Number.isFinite(id)) {
      continue;
    }

    const record = loadAnalysisRecord(id);
    if (record) {
      records.push(record);
    }
  }

  records.sort((a, b) => b.createdAt - a.createdAt);
  return typeof limit === "number" ? records.slice(0, limit) : records;
}

export const analysisStorage = {
  save(record: AnalysisRecord, scope: AnalysisStorageScope = "both"): AnalysisRecord {
    const normalized = analysisRecordSchema.parse(record);
    let serverRecord = normalized;

    if ((scope === "server" || scope === "both") && !isBrowser()) {
      serverRecord = saveAnalysis(normalized);
    }

    if ((scope === "client" || scope === "both") && isBrowser()) {
      persistAnalysisRecord(serverRecord);
    }

    return serverRecord;
  },

  get(id: number, scope: AnalysisStorageScope = isBrowser() ? "client" : "server"): AnalysisRecord | undefined {
    if (scope === "server" && !isBrowser()) {
      return getAnalysis(id);
    }

    if (scope === "client" && isBrowser()) {
      return loadAnalysisRecord(id) ?? undefined;
    }

    return undefined;
  },

  list(limit?: number, scope: AnalysisStorageScope = isBrowser() ? "client" : "server"): AnalysisRecord[] {
    if (scope === "server" && !isBrowser()) {
      return listAnalyses(limit);
    }

    if (scope === "client" && isBrowser()) {
      return listClientAnalyses(limit);
    }

    return [];
  },

  remove(id: number, scope: AnalysisStorageScope = "both"): boolean {
    let removed = false;

    if ((scope === "server" || scope === "both") && !isBrowser()) {
      removed = deleteAnalysis(id) || removed;
    }

    if ((scope === "client" || scope === "both") && isBrowser()) {
      removeAnalysisRecord(id);
      removed = true;
    }

    return removed;
  },

  clear(scope: AnalysisStorageScope = "both") {
    if ((scope === "server" || scope === "both") && !isBrowser()) {
      clearAllAnalyses();
    }

    if ((scope === "client" || scope === "both") && isBrowser()) {
      clearAllData();
    }
  },
};
