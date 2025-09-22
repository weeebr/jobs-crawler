export const MOTTO_KEYWORDS = ["values", "mission", "culture", "motto", "belief"];

export const SIZE_REGEX = /(\d{2,5})\s+(?:employees|people|staff|team)/i;

export const WORKLOAD_REGEX = /(?:workload|pensum|employment rate)[:\s-]*([0-9]{1,3}\s?(?:[-–]\s?[0-9]{1,3}\s?)?%)/i;

export const PERCENT_REGEX = /([0-9]{1,3}\s?(?:[-–]\s?[0-9]{1,3}\s?)?%)/;

export const CONTRACT_PATTERNS = [
  /(?:contract type|employment type)[:\s-]*([^.\n]+)/i,
  /\b(?:unlimited|permanent|temporary|fixed-term|part-time|full-time)\b/i,
  /(?:employment|contract)[:\s-]*([^.\n]+)/i,
];

type DurationPattern = {
  test: RegExp;
  value: (match: RegExpMatchArray) => string;
};

export const DURATION_PATTERNS: DurationPattern[] = [
  {
    test: /\b(unlimited|permanent)(?:\s+(?:employment|contract))?\b/i,
    value: (match) => match[1].trim(),
  },
  {
    test: /(contract|assignment)\s+for\s+(\d+\s*(?:months?|years?))/i,
    value: (match) => `${match[1]} for ${match[2]}`.trim(),
  },
  {
    test: /(\d+\s*(?:months?|years?))\s+(?:contract|mission)/i,
    value: (match) => match[0].trim(),
  },
  {
    test: /\b(temporary|fixed[- ]term)(?:\s+(?:position|contract))?\b/i,
    value: (match) => match[1].trim(),
  },
  {
    test: /\b(part-time|full-time)(?:\s+(?:employment|position))?\b/i,
    value: (match) => match[1].trim(),
  },
  // Add more specific patterns for common edge cases
  {
    test: /\b(unlimited|permanent|temporary|fixed-term|part-time|full-time)\b/i,
    value: (match) => match[1].trim(),
  },
];

export const KNOWN_METADATA_LABELS = [
  "workload",
  "pensum",
  "employment rate",
  "contract type",
  "contract",
  "employment type",
  "duration",
  "start date",
  "place of work",
  "workplace",
  "location",
  "work location",
  "office",
  "company",
  "department",
  "team",
];

