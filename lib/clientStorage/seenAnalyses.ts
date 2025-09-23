import { isBrowser, SEEN_ANALYSES_KEY } from "./types";

function normalizeId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function loadSeenAnalysisIds(): Set<number> {
  if (!isBrowser()) return new Set<number>();
  try {
    const raw = window.localStorage.getItem(SEEN_ANALYSES_KEY);
    if (!raw) {
      return new Set<number>();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set<number>();
    }

    const normalizedIds = parsed
      .map(normalizeId)
      .filter((id): id is number => id !== null);
    return new Set<number>(normalizedIds);
  } catch (error) {
    console.warn("[clientStorage] failed to load seen analyses", error);
    return new Set<number>();
  }
}

export function persistSeenAnalysisIds(ids: Iterable<number>) {
  if (!isBrowser()) return;
  try {
    const uniqueIds = Array.from(new Set(Array.from(ids).map(normalizeId).filter((id): id is number => id !== null)));
    window.localStorage.setItem(SEEN_ANALYSES_KEY, JSON.stringify(uniqueIds));
  } catch (error) {
    console.warn("[clientStorage] failed to persist seen analyses", error);
  }
}
