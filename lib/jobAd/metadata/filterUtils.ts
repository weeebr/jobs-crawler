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
  if (/^(location|workload|language|duration|contract|team|salary|published)[:\s]*$/i.test(trimmed)) {
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
  
  return trimmed;
}
