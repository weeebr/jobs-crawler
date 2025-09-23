import { z } from "zod";

// Common error object schema
export const errorObjectSchema = z.object({
  url: z.string().url(),
  message: z.string(),
});

export type ErrorObject = z.infer<typeof errorObjectSchema>;

// Common metadata fields
export const metadataFieldsSchema = z.object({
  createdAt: z.number().int().min(0),
  updatedAt: z.number().int().min(0),
});

export type MetadataFields = z.infer<typeof metadataFieldsSchema>;

// Common ID field
export const idFieldSchema = z.object({
  id: z.number().int().min(0),
});

export type IdField = z.infer<typeof idFieldSchema>;

// Common match score field
export const matchScoreFieldSchema = z.object({
  matchScore: z.number().min(0).max(100),
});

export type MatchScoreField = z.infer<typeof matchScoreFieldSchema>;
