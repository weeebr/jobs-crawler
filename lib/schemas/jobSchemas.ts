import { z } from "zod";

// Base job data schema - shared between full job data and summaries
export const baseJobDataSchema = z.object({
  title: z.string().min(1, "Job title required"),
  company: z.string().min(1, "Company name required"),
  stack: z.array(z.string()).default([]),
  publishedAt: z.string().optional(),
  location: z.string().optional(),
  workload: z.string().optional(),
  duration: z.string().optional(),
  size: z.enum(["5", "10", "20", "50", "100", "200", "500"]).optional(),
  teamSize: z.string().optional(),
});

// Raw fetched job data from external sources
export const jobAdFetchedSchema = baseJobDataSchema.extend({
  companyUrl: z.string().url().optional(), // Direct link to the company website
  qualifications: z.array(z.string()).default([]),
  roles: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  sourceUrl: z.string().url().optional(),
  jobUrl: z.string().url().optional(), // Direct link to the job posting
  motto: z.string().optional(),
  mottoOrigin: z.object({
    source: z.enum(['job_ad', 'company_page', 'fallback', 'api_error']),
    sourceUrl: z.string().optional(),
    confidence: z.enum(['high', 'medium', 'low']),
    extractedFrom: z.string().optional(),
  }).optional(),
  language: z.string().optional(),
  // Metadata about the fetch
  fetchedAt: z.number().int().min(0),
  sourceDomain: z.string().optional(),
});

export type JobAdFetched = z.infer<typeof jobAdFetchedSchema>;

// Legacy alias for backwards compatibility during transition
export const jobAdParsedSchema = jobAdFetchedSchema;
export type JobAdParsed = JobAdFetched;

