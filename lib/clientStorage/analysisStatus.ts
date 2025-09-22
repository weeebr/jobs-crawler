import type { AnalysisStatus } from "./types";
import { ANALYSIS_STAGE_KEY, isBrowser } from "./types";

export function loadAnalysisStatuses(): Record<number, AnalysisStatus> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(ANALYSIS_STAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<number, AnalysisStatus> | null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.warn("[clientStorage] failed to load statuses", error);
    return {};
  }
}

export function persistAnalysisStatuses(statuses: Record<number, AnalysisStatus>) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(ANALYSIS_STAGE_KEY, JSON.stringify(statuses));
  } catch (error) {
    console.warn("[clientStorage] failed to persist statuses", error);
  }
}

export function clearAnalysisStatus(id: number) {
  if (!isBrowser()) return;
  try {
    const statuses = loadAnalysisStatuses();
    if (statuses[id]) {
      delete statuses[id];
      persistAnalysisStatuses(statuses);
    }
  } catch (error) {
    console.warn("[clientStorage] failed to clear status", error);
  }
}

export function setAnalysisStatus(id: number, status: AnalysisStatus | null) {
  if (!isBrowser()) return;
  try {
    const statuses = loadAnalysisStatuses();
    if (!status) {
      if (statuses[id]) {
        delete statuses[id];
        persistAnalysisStatuses(statuses);
      }
      return;
    }
    statuses[id] = status;
    persistAnalysisStatuses(statuses);
  } catch (error) {
    console.warn("[clientStorage] failed to set status", error);
  }
}
