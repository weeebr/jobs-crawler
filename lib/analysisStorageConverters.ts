import type { AnalysisRecord } from "./types";

// Type conversion utilities for client ↔ database type mapping
function clientToDbString(value: string | undefined): string | null {
  return value ?? null;
}

function clientToDbArray(value: string[] | undefined): string[] {
  return value ?? [];
}

function dbToClientString(value: string | null): string | undefined {
  return value ?? undefined;
}

function dbToClientArray(value: string[] | null | undefined): string[] {
  return value ?? [];
}

function clientToDbEnum<T extends string>(value: T | undefined): T | null {
  return value ?? null;
}

function dbToClientEnum<T extends string>(value: T | null): T | undefined {
  return value ?? undefined;
}

// Helper function to create description from job data
function createDescriptionFromJobData(job: AnalysisRecord['job']): string | null {
  const sections = [
    ...(job.qualifications ?? []),
    ...(job.roles ?? []),
    ...(job.benefits ?? []),
  ];

  if (sections.length === 0) {
    return null;
  }

  return sections.join('\n\n');
}

export {
  clientToDbString,
  clientToDbArray,
  dbToClientString,
  dbToClientArray,
  clientToDbEnum,
  dbToClientEnum,
  createDescriptionFromJobData,
};
