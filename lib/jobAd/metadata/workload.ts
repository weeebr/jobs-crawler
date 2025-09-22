import { load } from "cheerio";

import {
  CONTRACT_PATTERNS,
  DURATION_PATTERNS,
  KNOWN_METADATA_LABELS,
  PERCENT_REGEX,
  WORKLOAD_REGEX,
} from "./constants";
import { extractEnhancedMetadata } from "./structuredExtractor";
import { filterEmptyValue } from "./filterUtils";

export function extractWorkload(
  $: ReturnType<typeof load>,
  text: string,
): string | undefined {
  // Try structured extraction first
  const structured = extractEnhancedMetadata($, $.html(), text);
  if (structured.workload) {
    return structured.workload;
  }

  // Fallback to original logic
  const labelledElement =
    $("[data-field='workload'], [data-testid='workload'], .job-workload")
      .first()
      .text()
      .trim();
  if (labelledElement) {
    const trimmed = trimAtKnownLabel(labelledElement);
    const filtered = filterEmptyValue(trimmed);
    if (filtered) {
      return filtered;
    }
  }

  const labelled = extractLineByLabel(text, ["workload", "pensum", "employment rate"]);
  const filteredLabelled = filterEmptyValue(labelled || undefined);
  if (filteredLabelled) return filteredLabelled;

  const match = text.match(WORKLOAD_REGEX);
  if (match && match[1]) {
    const trimmed = trimAtKnownLabel(match[1]);
    const filtered = filterEmptyValue(trimmed);
    if (filtered) {
      return filtered;
    }
  }

  const percentMatch = text.match(PERCENT_REGEX);
  if (percentMatch && percentMatch[1]) {
    const context = text.slice(
      Math.max(0, text.indexOf(percentMatch[1]) - 50),
      text.indexOf(percentMatch[1]) + 50,
    );
    if (/workload|pensum|employment/i.test(context)) {
      const trimmed = percentMatch[1].trim();
      const filtered = filterEmptyValue(trimmed);
      if (filtered) {
        return filtered;
      }
    }
  }

  return undefined;
}

export function extractDuration(
  $: ReturnType<typeof load>,
  text: string,
): string | undefined {
  // Try structured extraction first
  const structured = extractEnhancedMetadata($, $.html(), text);
  if (structured.duration) {
    return structured.duration;
  }

  // Fallback to original logic
  for (const pattern of CONTRACT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = trimAtKnownLabel(match[1]);
      const filtered = filterEmptyValue(value);
      if (filtered) {
        return filtered;
      }
    }
  }

  for (const pattern of DURATION_PATTERNS) {
    const match = text.match(pattern.test);
    if (match) {
      const value = trimAtKnownLabel(pattern.value(match));
      const filtered = filterEmptyValue(value);
      if (filtered) {
        return filtered;
      }
    }
  }

  const line = extractLineByLabel(text, ["duration", "contract type", "employment type"]);
  const filteredLine = filterEmptyValue(line || undefined);
  if (filteredLine) {
    return filteredLine;
  }
  return undefined;
}

function extractLineByLabel(text: string, labels: string[]): string | null {
  if (labels.length === 0) {
    return null;
  }

  const sortedLabels = Array.from(new Set(labels)).sort(
    (a, b) => b.length - a.length,
  );

  for (const label of sortedLabels) {
    const labelPattern = new RegExp(
      `\\b${escapeRegExp(label)}\\b\\s*[:\\-–—]?\\s*`,
      "i",
    );
    const match = labelPattern.exec(text);
    if (!match) continue;

    const afterLabel = text.slice(match.index + match[0].length);
    let endIndex = afterLabel.length;

    const punctuationCandidates = [
      afterLabel.indexOf("\n"),
      afterLabel.indexOf("\r"),
      afterLabel.indexOf(";"),
      afterLabel.indexOf("."),
    ].filter((index) => index !== -1);

    if (punctuationCandidates.length > 0) {
      endIndex = Math.min(endIndex, Math.min(...punctuationCandidates));
    }

    const lowerAfterLabel = afterLabel.toLowerCase();
    for (const stopLabel of KNOWN_METADATA_LABELS) {
      if (stopLabel.toLowerCase() === label.toLowerCase()) continue;
      const stopIndex = lowerAfterLabel.indexOf(stopLabel.toLowerCase());
      if (stopIndex > 0) {
        endIndex = Math.min(endIndex, stopIndex);
      }
    }

    const rawValue = afterLabel.slice(0, endIndex);
    const normalized = rawValue.replace(/\s+/g, " ").trim();

    const cleaned = normalized
      .replace(/^(?:type|kind)\s*[:\-–—]?\s*/i, "")
      .replace(/^[:\-–—]+/, "")
      .trim();

    const trimmed = trimAtKnownLabel(cleaned);
    const filtered = filterEmptyValue(trimmed);
    if (filtered) {
      return filtered;
    }
  }

  return null;
}

function trimAtKnownLabel(value: string): string {
  if (!value) return "";

  let endIndex = value.length;
  const lowerValue = value.toLowerCase();

  for (const label of KNOWN_METADATA_LABELS) {
    const idx = lowerValue.indexOf(label);
    if (idx > 0) {
      endIndex = Math.min(endIndex, idx);
    }
  }

  const punctuationCandidates = [
    value.indexOf("\n"),
    value.indexOf("\r"),
    value.indexOf(";"),
    value.indexOf("."),
  ].filter((index) => index !== -1);

  if (punctuationCandidates.length > 0) {
    endIndex = Math.min(endIndex, Math.min(...punctuationCandidates));
  }

  const trimmed = value.slice(0, endIndex).replace(/\s+/g, " ").trim();
  
  // Transform "Unlimited employment" to "Unlimited"
  const result = trimmed.replace(/^unlimited\s+employment$/i, "Unlimited");
  
  // Use centralized filtering instead of custom logic
  const filtered = filterEmptyValue(result);
  return filtered || "";
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
