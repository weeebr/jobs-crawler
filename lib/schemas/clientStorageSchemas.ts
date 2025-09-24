import { z } from "zod";
import { baseJobDataSchema } from "./core";
import { idFieldSchema, metadataFieldsSchema } from "./commonSchemas";

// Client storage schemas
export const recentAnalysisSummarySchema = baseJobDataSchema.merge(idFieldSchema).merge(metadataFieldsSchema).extend({
  // Enriched data
  matchScore: z.number().min(0).max(100),
  status: z.enum(['interested', 'applied']).optional(),
  // Track if this job was fetched in the current session
  isNewThisRun: z.boolean().default(false),
});

export type RecentAnalysisSummary = z.infer<typeof recentAnalysisSummarySchema>;

export const analysisStatusSchema = z.enum(['interested', 'applied']);
export type AnalysisStatus = z.infer<typeof analysisStatusSchema>;

export const filterStateSchema = z.object({
  size: z.string().default('all'),
  score: z.string().default('all'),
  location: z.string().default('all'),
  tech: z.string().default('all'),
  status: z.union([z.literal('all'), analysisStatusSchema]).default('all'),
  sort: z.enum(['posting-newest', 'posting-oldest', 'score-high', 'score-low']).default('posting-newest'),
  search: z.string().default(''),
});

export type FilterState = z.infer<typeof filterStateSchema>;
