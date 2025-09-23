import { z } from "zod";
import { analysisRecordSchema } from "./recordSchemas";
import { backgroundTaskSchema } from "./taskSchemas";
import { errorObjectSchema } from "./commonSchemas";

// API response schemas
export const analyzeResponseSchema = z.object({
  records: z.array(analysisRecordSchema),
  errors: z.array(errorObjectSchema).optional(),
});

export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;

export const taskResponseSchema = z.object({
  tasks: z.array(backgroundTaskSchema),
});

export type TaskResponse = z.infer<typeof taskResponseSchema>;

// API Error response schema for consistent error handling
export const apiErrorResponseSchema = z.object({
  error: z.string().min(1, "Error message required"),
  details: z.any().optional(),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

// Streaming message schemas
export const streamMessageSchema = z.object({
  type: z.string().min(1),
  data: z.any(),
});

export type StreamMessage = z.infer<typeof streamMessageSchema>;

// Stream message content schema for validation
export const streamMessageContentSchema = z.object({
  type: z.enum(['progress', 'result', 'error', 'complete']),
  data: z.any(),
});

export type StreamMessageContent = z.infer<typeof streamMessageContentSchema>;

export const linkCollectionProgressSchema = z.object({
  total: z.number().int().min(0),
  completed: z.number().int().min(0),
});

export type LinkCollectionProgress = z.infer<typeof linkCollectionProgressSchema>;
