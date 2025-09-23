import type { LetterLanguage } from "@/lib/generateMotivationLetter";
import type { ReactNode } from "react";

import type { LetterSource } from "../hooks/useLetterManager";

export function formatDisplayDate(source: string): string {
  const parsed = new Date(source);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString();
  }
  return source;
}

export function formatRelativeDate(source: string): string {
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) {
    return source;
  }

  const now = new Date();
  const diffInMs = now.getTime() - parsed.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "today";
  } else if (diffInDays === 1) {
    return "yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return years === 1 ? "1 year ago" : `${years} years ago`;
  }
}

export function languageLabel(language: LetterLanguage): string {
  return language === "en" ? "English" : "German";
}

export function letterSourceLabel(source: LetterSource): string {
  switch (source) {
    case "template":
      return "Template fallback";
    case "cache":
      return "Restored from history";
    default:
      return "LLM generated";
  }
}

interface DateWithTooltipProps {
  dateString: string;
  children?: ReactNode;
  className?: string;
}

export function DateWithTooltip({ dateString, children, className = "" }: DateWithTooltipProps) {
  const relativeDate = formatRelativeDate(dateString);
  const actualDate = formatDisplayDate(dateString);
  
  // Only show tooltip for relative dates (today, yesterday, X days ago, etc.)
  const shouldShowTooltip = relativeDate !== actualDate && (
    relativeDate === "today" || 
    relativeDate === "yesterday" || 
    relativeDate.includes("days ago") ||
    relativeDate.includes("weeks ago") ||
    relativeDate.includes("months ago") ||
    relativeDate.includes("years ago")
  );

  if (!shouldShowTooltip) {
    return <span className={className}>{children || relativeDate}</span>;
  }

  return (
    <span className={`relative group ${className}`}>
      {children || relativeDate}
      <div className="absolute left-0 top-8 z-20 hidden group-hover:block">
        <div className="bg-black text-white text-sm rounded-lg p-2 shadow-xl whitespace-nowrap">
          {actualDate}
        </div>
      </div>
    </span>
  );
}
