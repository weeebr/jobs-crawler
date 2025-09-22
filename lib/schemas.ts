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

// Complete analysis record with clear separation
export const analysisRecordSchema = z.object({
  id: z.number().int().min(0),
  // Fetched data from external sources (immutable)
  job: jobAdFetchedSchema,
  cv: cvProfileSchema,
  // LLM-generated analysis (immutable after generation)
  llmAnalysis: llmAnalysisSchema,
  // User interactions and preferences (mutable)
  userInteractions: userInteractionsSchema,
  // Record metadata
  createdAt: z.number().int().min(0),
  updatedAt: z.number().int().min(0),
});

export type AnalysisRecord = z.infer<typeof analysisRecordSchema>;

// Legacy combined record for backwards compatibility
export const legacyAnalysisRecordSchema = z.object({
  id: z.number().int().min(0),
  job: jobAdFetchedSchema,
  cv: cvProfileSchema,
  analysis: analysisEnrichedSchema, // Combined LLM + User data
  createdAt: z.number().int().min(0),
  updatedAt: z.number().int().min(0),
});

export type LegacyAnalysisRecord = z.infer<typeof legacyAnalysisRecordSchema>;

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
  errors: z.array(z.object({
    url: z.string().url(),
    message: z.string(),
  })).default([]),
  startedAt: z.number().int().min(0),
  completedAt: z.number().int().min(0).optional(),
});

export type BackgroundTask = z.infer<typeof backgroundTaskSchema>;

// Client storage schemas
export const recentAnalysisSummarySchema = z.object({
  id: z.number().int().min(0),
  // Fetched data
  title: z.string().min(1),
  company: z.string().min(1),
  publishedAt: z.string().optional(),
  location: z.string().optional(),
  workload: z.string().optional(),
  duration: z.string().optional(),
  size: z.string().optional(),
  stack: z.array(z.string()).default([]),
  // Enriched data
  matchScore: z.number().min(0).max(100),
  status: z.enum(['interested', 'applied']).optional(),
  // Metadata
  createdAt: z.number().int().min(0),
  updatedAt: z.number().int().min(0),
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

// API response schemas
export const analyzeResponseSchema = z.object({
  records: z.array(analysisRecordSchema),
  errors: z.array(z.object({
    url: z.string().url(),
    message: z.string(),
  })).optional(),
});

export type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;

export const taskResponseSchema = z.object({
  tasks: z.array(backgroundTaskSchema),
});

export type TaskResponse = z.infer<typeof taskResponseSchema>;

// Streaming message schemas
export const streamMessageSchema = z.object({
  type: z.string().min(1),
  data: z.any(),
});

export type StreamMessage = z.infer<typeof streamMessageSchema>;

export const linkCollectionProgressSchema = z.object({
  total: z.number().int().min(0),
  completed: z.number().int().min(0),
});

export type LinkCollectionProgress = z.infer<typeof linkCollectionProgressSchema>;
