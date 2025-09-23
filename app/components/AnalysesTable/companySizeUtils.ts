import type { RecentAnalysisSummary } from "@/lib/clientStorage";

const COMPANY_SIZE_BUCKETS = [5, 10, 20, 50, 100, 200, 500] as const;

export function parseCompanySizeValue(raw: string | undefined): number | undefined {
  if (!raw) return undefined;

  const sanitized = raw.replace(/[,.'\u00A0]/g, "");
  const parts = sanitized.split(/[^0-9]+/).filter(Boolean);
  if (parts.length === 0) {
    return undefined;
  }

  const numbers = parts
    .map((part) => Number.parseInt(part, 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (numbers.length === 0) {
    return undefined;
  }

  return Math.max(...numbers);
}

export function findCompanySizeBucket(value: number): number | undefined {
  for (const bucket of COMPANY_SIZE_BUCKETS) {
    if (value <= bucket) {
      return bucket;
    }
  }
  return undefined;
}

export function determineCompanySizeOptions(analyses: RecentAnalysisSummary[]): string[] {
  let maxBucketIndex = -1;

  for (const item of analyses) {
    const numeric = parseCompanySizeValue(item.size);
    if (numeric === undefined) {
      continue;
    }

    const bucket = findCompanySizeBucket(numeric);
    if (bucket === undefined) {
      maxBucketIndex = Math.max(maxBucketIndex, COMPANY_SIZE_BUCKETS.length - 1);
      continue;
    }

    const bucketIndex = COMPANY_SIZE_BUCKETS.indexOf(bucket as any);
    if (bucketIndex > maxBucketIndex) {
      maxBucketIndex = bucketIndex;
    }
  }

  const defaults = COMPANY_SIZE_BUCKETS.map((size) => size.toString());
  if (maxBucketIndex >= 0) {
    return defaults.slice(0, maxBucketIndex + 1);
  }
  return defaults;
}

export function matchesCompanySizeFilter(
  companySize: string | undefined,
  filterValue: string,
): boolean {
  const threshold = Number.parseInt(filterValue, 10);
  if (Number.isNaN(threshold)) {
    return false;
  }

  const numericCompanySize = parseCompanySizeValue(companySize);
  if (numericCompanySize === undefined) {
    // If no company size data, exclude the job from filtering
    return false;
  }

  return numericCompanySize <= threshold;
}
