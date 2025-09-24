import { z } from "zod";
import { jobAdFetchedSchema, cvProfileSchema, llmAnalysisSchema, userInteractionsSchema } from "./core";
import { idFieldSchema, metadataFieldsSchema, errorObjectSchema } from "./commonSchemas";

// === RECORD SCHEMAS ===

export const analysisRecordSchema = idFieldSchema.merge(metadataFieldsSchema).extend({
  job: jobAdFetchedSchema,
  cv: cvProfileSchema,
  llmAnalysis: llmAnalysisSchema,
  userInteractions: userInteractionsSchema,
});

export type AnalysisRecord = z.infer<typeof analysisRecordSchema>;

// === API SCHEMAS ===

export const analyzeResponseSchema = z.object({
  records: z.array(analysisRecordSchema),
  errors: z.array(errorObjectSchema).optional(),
});

export const taskResponseSchema = z.object({
  tasks: z.array(z.lazy(() => backgroundTaskSchema)),
});

export const apiErrorResponseSchema = z.object({
  error: z.string().min(1, "Error message required"),
  details: z.any().optional(),
});


export const linkCollectionProgressSchema = z.object({
  total: z.number().int().min(0),
  completed: z.number().int().min(0),
});

export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;
export type TaskResponse = z.infer<typeof taskResponseSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
export type LinkCollectionProgress = z.infer<typeof linkCollectionProgressSchema>;

// === TASK SCHEMAS ===

const progressSchema = z.object({
  total: z.number().int().min(0),
  completed: z.number().int().min(0),
  current: z.string().optional(),
  message: z.string().optional(),
  url: z.string().url().optional(),
  phase: z.enum(['link-collection', 'job-analysis']).optional(),
});

export const backgroundTaskSchema = z.object({
  id: z.string().min(1),
  searchUrl: z.string().url(),
  status: z.enum(['running', 'completed', 'failed', 'cancelled']),
  progress: progressSchema,
  results: z.array(z.lazy(() => analysisRecordSchema)).default([]),
  errors: z.array(errorObjectSchema).default([]),
  startedAt: z.number().int().min(0),
  completedAt: z.number().int().min(0).optional(),
});

export type BackgroundTask = z.infer<typeof backgroundTaskSchema>;
