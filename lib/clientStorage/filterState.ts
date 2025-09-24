import type { FilterState } from "./types";
import { filterStateSchema } from "../schemas";
import { FILTER_STATE_KEY, DEFAULT_FILTER_STATE, isBrowser } from "./types";

export { DEFAULT_FILTER_STATE };

export function loadFilterState(): FilterState {
  if (!isBrowser()) return DEFAULT_FILTER_STATE;
  try {
    const raw = window.localStorage.getItem(FILTER_STATE_KEY);
    if (!raw) return DEFAULT_FILTER_STATE;
    const parsed = JSON.parse(raw);
    
    // Validate with Zod schema, fallback to default on error
    try {
      return filterStateSchema.parse(parsed);
    } catch (error) {
      console.warn("[clientStorage] invalid filter state, using defaults:", error);
      return DEFAULT_FILTER_STATE;
    }
  } catch (error) {
    console.warn("[clientStorage] failed to load filter state", error);
    return DEFAULT_FILTER_STATE;
  }
}

export function persistFilterState(state: FilterState) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(FILTER_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("[clientStorage] failed to persist filter state", error);
  }
}
