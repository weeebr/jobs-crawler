import { analysisRecordSchema, backgroundTaskSchema, taskResponseSchema, type AnalysisRecord, type BackgroundTask, type TaskResponse } from "./schemas";

function formatIssues(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return String(error);
  }
  if ("format" in (error as Record<string, unknown>)) {
    return String(error);
  }
  if ("issues" in (error as Record<string, unknown>)) {
    const issues = (error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues;
    if (Array.isArray(issues)) {
      return issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
    }
  }
  return String(error);
}

export function safeParseAnalysisRecord(data: unknown, context: string): AnalysisRecord | null {
  const parsed = analysisRecordSchema.safeParse(data);
  if (!parsed.success) {
    console.warn(`[contractValidation] AnalysisRecord mismatch from ${context}: ${formatIssues(parsed.error)}`);
    return null;
  }
  return parsed.data;
}

export function requireAnalysisRecords(data: unknown, context: string): AnalysisRecord[] {
  const parsed = analysisRecordSchema.array().safeParse(data);
  if (!parsed.success) {
    const details = formatIssues(parsed.error);
    throw new Error(`Invalid AnalysisRecord[] from ${context}: ${details}`);
  }
  return parsed.data;
}

export function safeParseBackgroundTask(data: unknown, context: string): BackgroundTask | null {
  const parsed = backgroundTaskSchema.safeParse(data);
  if (!parsed.success) {
    console.warn(`[contractValidation] BackgroundTask mismatch from ${context}: ${formatIssues(parsed.error)}`);
    return null;
  }
  return parsed.data;
}

export function requireTaskResponse(data: unknown, context: string): TaskResponse {
  const parsed = taskResponseSchema.safeParse(data);
  if (!parsed.success) {
    const details = formatIssues(parsed.error);
    throw new Error(`Invalid TaskResponse from ${context}: ${details}`);
  }
  return parsed.data;
}

export function requireBackgroundTask(data: unknown, context: string): BackgroundTask {
  const parsed = backgroundTaskSchema.safeParse(data);
  if (!parsed.success) {
    const details = formatIssues(parsed.error);
    throw new Error(`Invalid BackgroundTask from ${context}: ${details}`);
  }
  return parsed.data;
}
