export function roundMatchScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  const bounded = Math.max(0, Math.min(score, 100));
  if (bounded === 0) {
    return 0;
  }

  const rounded = Math.ceil(bounded / 5) * 5;
  return Math.min(100, rounded);
}
