import { z } from "zod";

// CV Comparison result schema
export const comparisonResultSchema = z.object({
  matchScore: z.number().min(0).max(100),
  gaps: z.array(z.string()).default([]),
  reasoning: z.array(z.string()).default([]),
});

export type ComparisonResult = z.infer<typeof comparisonResultSchema>;

// Match ranking schema for LLM results
export const matchRankingSchema = z.object({
  matchScore: z.number().min(0).max(100),
  reasoning: z.string().min(1, "Reasoning required"),
  source: z.enum(["llm", "heuristic"]),
});

export type MatchRanking = z.infer<typeof matchRankingSchema>;

const motivationLetterSchema = z.object({
  content: z.string().min(1, "Letter content required"),
  generatedAt: z.number().int().min(0),
});

// LLM Analysis - AI-generated insights and recommendations
export const llmAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  reasoning: z.array(z.string()).min(1, "Reasoning required"), // Bullet points
  letters: z
    .record(z.enum(["en", "de"]), motivationLetterSchema)
    .default({}),
  // Analysis metadata
  analyzedAt: z.number().int().min(0),
  analysisVersion: z.string().default("1.0"),
});

// User Interactions - User-specific data and preferences
export const userInteractionsSchema = z.object({
  status: z.enum(["interested", "applied"]).optional(),
  notes: z.string().optional(),
  // User interaction metadata
  lastViewedAt: z.number().int().min(0).optional(),
  interactionCount: z.number().int().min(0).default(0),
});

export type MotivationLetter = z.infer<typeof motivationLetterSchema>;
export type LLMAnalysis = z.infer<typeof llmAnalysisSchema>;
export type UserInteractions = z.infer<typeof userInteractionsSchema>;
