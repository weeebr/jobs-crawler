import { z } from "zod";

// Raw fetched job data from external sources
export const jobAdFetchedSchema = z.object({
  title: z.string().min(1, "Job title required"),
  company: z.string().min(1, "Company name required"),
  companyUrl: z.string().url().optional(), // Direct link to the company website
  stack: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  roles: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  sourceUrl: z.string().url().optional(),
  jobUrl: z.string().url().optional(), // Direct link to the job posting
  size: z.enum(["5", "10", "20", "50", "100", "200", "500"]).optional(),
  motto: z.string().optional(),
  mottoOrigin: z.object({
    source: z.enum(['job_ad', 'company_page', 'fallback', 'api_error']),
    sourceUrl: z.string().optional(),
    confidence: z.enum(['high', 'medium', 'low']),
    extractedFrom: z.string().optional(),
  }).optional(),
  publishedAt: z.string().optional(),
  location: z.string().optional(),
  workload: z.string().optional(),
  duration: z.string().optional(),
  language: z.string().optional(),
  teamSize: z.string().optional(),
  // Metadata about the fetch
  fetchedAt: z.number().int().min(0),
  sourceDomain: z.string().optional(),
});

export type JobAdFetched = z.infer<typeof jobAdFetchedSchema>;

// Legacy alias for backwards compatibility during transition
export const jobAdParsedSchema = jobAdFetchedSchema;
export type JobAdParsed = JobAdFetched;

const roleSchema = z.object({
  title: z.string().min(1, "Role title required"),
  stack: z.array(z.string()).default([]),
  years: z.number().min(0).optional(),
});

const projectSchema = z.object({
  name: z.string().min(1, "Project name required"),
  impact: z.string().optional(),
  stack: z.array(z.string()).default([]),
});

const educationSchema = z.object({
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

// Legacy combined schema for backwards compatibility
export const analysisEnrichedSchema = llmAnalysisSchema.merge(userInteractionsSchema);

export type MotivationLetter = z.infer<typeof motivationLetterSchema>;
export type LLMAnalysis = z.infer<typeof llmAnalysisSchema>;
export type UserInteractions = z.infer<typeof userInteractionsSchema>;
export type AnalysisEnriched = z.infer<typeof analysisEnrichedSchema>;

// Legacy alias for backwards compatibility during transition
export const analysisSchema = analysisEnrichedSchema;
export type AnalysisDTO = AnalysisEnriched;
