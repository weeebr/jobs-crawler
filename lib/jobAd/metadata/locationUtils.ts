const REMOTE_KEYWORDS = ["remote", "hybrid", "anywhere", "distributed"];

export function normalizeLocationLabel(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  const normalized = raw.trim().replace(/\s+/g, " ");
  if (!normalized) return undefined;

  const lower = normalized.toLowerCase();
  if (REMOTE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return normalized;
  }

  const segments = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (segments.length >= 2) {
    for (let index = segments.length - 1; index >= 0; index -= 1) {
      const segment = segments[index];
      if (/\d/.test(segment)) {
        return segment;
      }
    }

    return segments[0];
  }

  return normalized;
}
