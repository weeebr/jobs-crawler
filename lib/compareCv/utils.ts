export function intersectionSize(setA: Set<string>, setB: Set<string>) {
  let count = 0;
  for (const value of setA) {
    if (setB.has(value)) {
      count += 1;
    }
  }
  return count;
}

export function normalizeTechName(value: string) {
  return value.trim().toLowerCase();
}
