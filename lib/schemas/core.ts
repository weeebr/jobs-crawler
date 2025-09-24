import { z } from "zod";

// === CV/RESUME SCHEMAS ===

export const roleSchema = z.object({
  title: z.string().min(1, "Role title required"),
  stack: z.array(z.string()).default([]),
  years: z.number().min(0).optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Project name required"),
  impact: z.string().optional(),
  stack: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
  degree: z.string().min(1, "Degree required"),
  institution: z.string().optional(),
});

export const cvProfileSchema = z.object({
  roles: z.array(roleSchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(projectSchema).default([]),
  education: z.array(educationSchema).default([]),
  keywords: z.array(z.string()).default([]),
});

export type CVProfile = z.infer<typeof cvProfileSchema>;

// === JOB SCHEMAS ===

export const baseJobDataSchema = z.object({
  title: z.string(),
  company: z.string(),
  stack: z.array(z.string()).default([]),
  publishedAt: z.string().optional(),
  location: z.string().optional(),
  workload: z.string().optional(),
  duration: z.string().optional(),
  size: z.enum(["5", "10", "20", "50", "100", "200", "500"]).optional(),
  companySize: z.string().optional(),
});

export const jobAdFetchedSchema = baseJobDataSchema.extend({
  companyUrl: z.string().url().optional(),
  qualifications: z.array(z.string()).default([]),
  roles: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  sourceUrl: z.string().url().optional(),
  jobUrl: z.string().url().optional(),
  motto: z.string().optional(),
  mottoOrigin: z.object({
    source: z.enum(['job_ad', 'company_page', 'fallback', 'api_error']),
    sourceUrl: z.string().optional(),
    confidence: z.enum(['high', 'medium', 'low']),
    extractedFrom: z.string().optional(),
  }).optional(),
  language: z.string().optional(),
  fetchedAt: z.number().int().min(0),
  sourceDomain: z.string().optional(),
});

export type JobAdFetched = z.infer<typeof jobAdFetchedSchema>;
export type JobAdParsed = JobAdFetched; // Legacy alias

// === ANALYSIS SCHEMAS ===

export const comparisonResultSchema = z.object({
  matchScore: z.number().min(0).max(100),
  gaps: z.array(z.string()).default([]),
  reasoning: z.array(z.string()).default([]),
});

export const matchRankingSchema = z.object({
  matchScore: z.number().min(0).max(100),
  reasoning: z.string().min(1, "Reasoning required"),
  source: z.enum(["llm", "heuristic"]),
});

export const motivationLetterSchema = z.object({
  content: z.string().min(1, "Letter content required"),
  generatedAt: z.number().int().min(0),
});

export const llmAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  reasoning: z.array(z.string()).min(1, "Reasoning required"),
  letters: z.record(z.enum(["en", "de"]), motivationLetterSchema).default({}),
  analyzedAt: z.number().int().min(0),
  analysisVersion: z.string().default("1.0")
});

export const userInteractionsSchema = z.object({
  status: z.enum(["interested", "applied"]).optional(),
  notes: z.string().optional(),
  lastViewedAt: z.number().int().min(0).optional(),
  interactionCount: z.number().int().min(0).default(0),
  isNewThisRun: z.boolean().default(false),
});

export type ComparisonResult = z.infer<typeof comparisonResultSchema>;
export type MatchRanking = z.infer<typeof matchRankingSchema>;
export type MotivationLetter = z.infer<typeof motivationLetterSchema>;
export type LLMAnalysis = z.infer<typeof llmAnalysisSchema>;
export type UserInteractions = z.infer<typeof userInteractionsSchema>;
