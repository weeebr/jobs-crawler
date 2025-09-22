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

/**
 * Enhanced filter specifically for duration/employment type values
 * This ensures only valid employment types are displayed
 */
export function filterDurationValue(value: string | undefined): string | undefined {
  const filtered = filterEmptyValue(value);
  
  if (!filtered) {
    return undefined;
  }
  
  // Check for valid employment types
  const validEmploymentTypes = [
    'unlimited', 'permanent', 'temporary', 'fixed-term', 'part-time', 'full-time',
    'contract', 'assignment', 'freelance', 'internship', 'consulting'
  ];
  
  const lowerValue = filtered.toLowerCase();
  
  // Check if it's a valid employment type
  const isValidType = validEmploymentTypes.some(type => 
    lowerValue.includes(type) || type.includes(lowerValue)
  );
  
  if (!isValidType) {
    // Check for partial matches that might be acceptable
    const hasValidKeywords = validEmploymentTypes.some(type => 
      lowerValue.includes(type.substring(0, 4)) // Allow partial matches for longer terms
    );
    
    if (!hasValidKeywords) {
      return undefined;
    }
  }
  
  // Check for values that are too long (likely parsing errors)
  if (filtered.length > 50) {
    return undefined;
  }
  
  // Check for values that contain multiple employment types (likely parsing errors)
  const employmentTypeCount = validEmploymentTypes.filter(type => 
    lowerValue.includes(type)
  ).length;
  
  if (employmentTypeCount > 2) {
    return undefined;
  }
  
  return filtered;
}

/**
 * Format team size for display with "+" suffix
 * This is used for visual presentation in dashboard and job detail pages
 */
export function formatTeamSizeForDisplay(teamSize: string | undefined): string | undefined {
  if (!teamSize) return undefined;
  
  // If it's already a numeric value, add "+"
  if (/^\d+$/.test(teamSize)) {
    return `${teamSize}+`;
  }
  
  // If it's already formatted with "+", return as is
  if (teamSize.endsWith('+')) {
    return teamSize;
  }
  
  // For non-numeric values (like "klein", "agil"), return as is
  return teamSize;
}
