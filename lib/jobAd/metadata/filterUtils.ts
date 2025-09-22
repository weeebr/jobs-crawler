/**
 * Filter out empty values and comma-only values
 * This utility ensures that values like ",", " , ", ",,," etc. are filtered out
 */
export function filterEmptyValue(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  
  const trimmed = value.trim();
  
  // Check for empty string after trimming
  if (trimmed.length === 0) {
    return undefined;
  }
  
  // Check for comma-only values (single comma, multiple commas, commas with whitespace)
  if (/^[,]+$/.test(trimmed)) {
    return undefined;
  }
  
  // Check for values that are just commas with whitespace
  if (/^[\s,]+$/.test(trimmed)) {
    return undefined;
  }
  
  // Check for values that are just labels without content (e.g., "Location:", "Workload:", etc.)
  // Only match labels that end with colon or are followed by whitespace, not standalone words
  const labelOnlyPattern = /^(location|workload|language|duration|team|salary|published)[:\s]+$/i;
  if (labelOnlyPattern.test(trimmed)) {
    return undefined;
  }
  
  // Check for values that end with just a colon or colon with whitespace
  if (/^[^:]*:\s*$/.test(trimmed)) {
    return undefined;
  }
  
  // Check for values that end with a colon followed by a comma or just whitespace
  if (/^[^:]*:\s*[,]*\s*$/.test(trimmed)) {
    return undefined;
  }
  
  // Check for values that are just punctuation or special characters
  if (/^[^\w\s]+$/.test(trimmed)) {
    return undefined;
  }
  
  // Check for values that are just numbers with commas (like "1,2,3" without context)
  // But allow single numbers and simple percentages
  if (/^[\d,]+$/.test(trimmed) && trimmed.length <= 10 && trimmed.includes(',')) {
    return undefined;
  }
  
  // Check for values that start with comma or end with comma (likely parsing artifacts)
  if (/^[,]|[,]$/.test(trimmed)) {
    return undefined;
  }
  
  return trimmed;
}

/**
 * Enhanced filter for dashboard display values
 * This ensures that only meaningful metadata values are shown on dashboard cards
 */
export function filterDisplayValue(value: string | undefined): string | undefined {
  const filtered = filterEmptyValue(value);
  
  if (!filtered) {
    return undefined;
  }
  
  // Additional checks for display-specific issues
  
  // Check for values that are too short to be meaningful (but allow single characters for percentages and numbers)
  if (filtered.length < 2 && !/^\d+%?$/.test(filtered)) {
    return undefined;
  }
  
  // Check for values that are just common parsing artifacts
  const artifacts = [
    'n/a', 'na', 'tbd', 'tba', 'null', 'undefined', 'none', 
    'not specified', 'not available', 'not provided', 'n/a',
    'unknown', 'unclear', 'not mentioned', 'not stated'
  ];
  
  if (artifacts.includes(filtered.toLowerCase())) {
    return undefined;
  }
  
  return filtered;
}
