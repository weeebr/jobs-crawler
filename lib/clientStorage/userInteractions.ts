import type { UserInteractions } from "../schemas";
import { USER_INTERACTIONS_KEY, isBrowser } from "./types";
import { loadAnalysisRecord, persistAnalysisRecord } from "./core";

// User Interactions Management
export function loadUserInteractions(id: number): UserInteractions | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(USER_INTERACTIONS_KEY);
    if (!raw) return null;
    const interactions = JSON.parse(raw) as Record<number, UserInteractions>;
    return interactions[id] || null;
  } catch (error) {
    console.warn("[clientStorage] failed to load user interactions", error);
    return null;
  }
}

export function persistUserInteractions(id: number, interactions: UserInteractions) {
  if (!isBrowser()) return;
  try {
    const raw = window.localStorage.getItem(USER_INTERACTIONS_KEY);
    const allInteractions = raw ? (JSON.parse(raw) as Record<number, UserInteractions>) : {};
    allInteractions[id] = interactions;
    window.localStorage.setItem(USER_INTERACTIONS_KEY, JSON.stringify(allInteractions));
  } catch (error) {
    console.warn("[clientStorage] failed to persist user interactions", error);
  }
}

export function updateUserInteractions(id: number, updates: Partial<UserInteractions>) {
  if (!isBrowser()) return;
  try {
    const current = loadUserInteractions(id) || {
      interactionCount: 0,
    };
    const updated = {
      ...current,
      ...updates,
      lastViewedAt: Date.now(),
      interactionCount: current.interactionCount + 1,
    };
    persistUserInteractions(id, updated);
  } catch (error) {
    console.warn("[clientStorage] failed to update user interactions", error);
  }
}

export function updateAnalysisEnrichment(
  id: number, 
  updates: Partial<Pick<UserInteractions, 'status' | 'notes'>>
): boolean {
  if (!isBrowser()) return false;
  try {
    // Update user interactions separately
    updateUserInteractions(id, updates);
    
    // Also update the main record if it exists
    const record = loadAnalysisRecord(id);
    if (record) {
      const updatedRecord = {
        ...record,
        userInteractions: {
          ...record.userInteractions,
          ...updates,
        },
        updatedAt: Date.now(),
      };
      persistAnalysisRecord(updatedRecord);
    }
    
    return true;
  } catch (error) {
    console.warn("[clientStorage] failed to update analysis enrichment", error);
    return false;
  }
}
