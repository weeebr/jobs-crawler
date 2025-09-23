import { z } from "zod";
import { jobAdFetchedSchema } from "./jobSchemas";
import { cvProfileSchema } from "./cvSchemas";
import { llmAnalysisSchema, userInteractionsSchema } from "./analysisSchemas";
import { idFieldSchema, metadataFieldsSchema } from "./commonSchemas";

// Complete analysis record with clear separation
export const analysisRecordSchema = idFieldSchema.merge(metadataFieldsSchema).extend({
  // Fetched data from external sources (immutable)
  job: jobAdFetchedSchema,
  cv: cvProfileSchema,
  // LLM-generated analysis (immutable after generation)
  llmAnalysis: llmAnalysisSchema,
  // User interactions and preferences (mutable)
  userInteractions: userInteractionsSchema,
});

export type AnalysisRecord = z.infer<typeof analysisRecordSchema>;


