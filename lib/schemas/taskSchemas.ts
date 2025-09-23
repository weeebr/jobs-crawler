import { z } from "zod";
import { analysisRecordSchema } from "./recordSchemas";
import { errorObjectSchema } from "./commonSchemas";

// Background task management
export const backgroundTaskSchema = z.object({
  id: z.string().min(1),
  searchUrl: z.string().url(),
  status: z.enum(['running', 'completed', 'failed', 'cancelled']),
  progress: z.object({
    total: z.number().int().min(0),
    completed: z.number().int().min(0),
    current: z.string().optional(),
    message: z.string().optional(),
    url: z.string().url().optional(),
  }),
  results: z.array(analysisRecordSchema).default([]),
  errors: z.array(errorObjectSchema).default([]),
  startedAt: z.number().int().min(0),
  completedAt: z.number().int().min(0).optional(),
});

export type BackgroundTask = z.infer<typeof backgroundTaskSchema>;
