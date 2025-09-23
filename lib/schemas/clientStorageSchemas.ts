import { z } from "zod";
import { baseJobDataSchema } from "./jobSchemas";
import { idFieldSchema, metadataFieldsSchema, matchScoreFieldSchema } from "./commonSchemas";

// Client storage schemas
export const recentAnalysisSummarySchema = baseJobDataSchema.merge(idFieldSchema).merge(metadataFieldsSchema).extend({
  // Enriched data
  matchScore: z.number().min(0).max(100),
  status: z.enum(['interested', 'applied']).optional(),
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
  sort: z.enum(['newest', 'oldest', 'score-high', 'score-low']).default('newest'),
});

export type FilterState = z.infer<typeof filterStateSchema>;
