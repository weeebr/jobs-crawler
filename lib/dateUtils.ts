/**
 * Formats a date string to a human-readable relative time format
 * @param dateString - ISO date string or date string
 * @returns Formatted string like "today", "yesterday", "3 days ago", "2 weeks ago"
 */
export function formatPostedDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return "Unknown";
  }

  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);

  // Handle same day
  if (diffInDays === 0) {
    return "today";
  }

  // Handle yesterday
  if (diffInDays === 1) {
    return "yesterday";
  }

  // Handle days (2-6 days)
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  // Handle weeks (1-3 weeks)
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
  }

  // Handle months (fallback to weeks for simplicity)
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
  }

  // Handle years
  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
}
