import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users Table - Track API key hashes for user identification
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),

  // Hashed API key for user identification (SHA-256)
  apiKeyHash: text('api_key_hash').notNull().unique(),

  // User preferences and metadata
  lastActiveAt: integer('last_active_at', { mode: 'timestamp' }).notNull().defaultNow(),
  totalAnalyses: integer('total_analyses').default(0),
  preferredModel: text('preferred_model').default('gpt-4o-mini'),
});

// Analysis Records Table - Main data storage (now user-scoped)
export const analysisRecords = sqliteTable('analysis_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),

  // Job Data 
  title: text('title').notNull(),
  company: text('company').notNull(),
  description: text('description'),
  publishedAt: text('published_at'),
  location: text('location'),
  workload: text('workload'), // 'full-time', 'part-time', 'contract', etc.
  duration: text('duration'), // employment duration if specified
  size: text('size'), // company size: '5', '10', '20', '50', '100', '200', '500'
  companySize: text('company_size'), // additional company size info
  stack: text('stack', { mode: 'json' }).$type<string[]>().notNull(),

  // LLM Analysis Results
  matchScore: real('match_score').notNull(),
  reasoning: text('reasoning').notNull(),

  // User Interactions
  status: text('status', { enum: ['interested', 'applied'] }),
  isNewThisRun: integer('is_new_this_run', { mode: 'boolean' }).default(false).notNull(),

  // Metadata
  sourceUrl: text('source_url'),
  sourceType: text('source_type'), // 'single-job', 'search-results'
});

// Job Search Sessions Table - For tracking search operations (now user-scoped)
export const jobSearches = sqliteTable('job_searches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),

  searchUrl: text('search_url').notNull(),
  totalJobsFound: integer('total_jobs_found'),
  successfullyAnalyzed: integer('successfully_analyzed').default(0),
  failedAnalyses: integer('failed_analyses').default(0),

  // Processing status
  status: text('status', { enum: ['running', 'completed', 'failed'] }).default('running'),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// CV Profiles Table - Store user CV data (now user-scoped)
export const cvProfiles = sqliteTable('cv_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().defaultNow(),

  // Basic info
  name: text('name'),
  email: text('email'),

  // CV Content (JSON for flexibility)
  roles: text('roles', { mode: 'json' }).$type<{ title: string; stack: string[]; years?: number }[]>().notNull(),
  skills: text('skills', { mode: 'json' }).$type<string[]>().notNull(),
  projects: text('projects', { mode: 'json' }).$type<{ name: string; impact?: string; stack: string[] }[]>().notNull(),
  education: text('education', { mode: 'json' }).$type<{ degree: string; institution?: string }[]>().notNull(),
  keywords: text('keywords', { mode: 'json' }).$type<string[]>().notNull(),

  // Metadata
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

// Analysis Gaps and Recommendations - Detailed feedback (now user-scoped)
export const analysisFeedback = sqliteTable('analysis_feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  analysisRecordId: integer('analysis_record_id').references(() => analysisRecords.id).notNull(),

  // Gaps identified
  missingSkills: text('missing_skills', { mode: 'json' }).$type<string[]>(),
  missingExperience: text('missing_experience', { mode: 'json' }).$type<string[]>(),
  missingKeywords: text('missing_keywords', { mode: 'json' }).$type<string[]>(),

  // Recommendations
  skillRecommendations: text('skill_recommendations', { mode: 'json' }).$type<string[]>(),
  experienceRecommendations: text('experience_recommendations', { mode: 'json' }).$type<string[]>(),
  projectRecommendations: text('project_recommendations', { mode: 'json' }).$type<string[]>(),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().defaultNow(),
});

// Export schemas for use in API routes
export const insertAnalysisRecordSchema = createInsertSchema(analysisRecords);
export const selectAnalysisRecordSchema = createSelectSchema(analysisRecords);
export const insertJobSearchSchema = createInsertSchema(jobSearches);
export const selectJobSearchSchema = createSelectSchema(jobSearches);
export const insertCvProfileSchema = createInsertSchema(cvProfiles);
export const selectCvProfileSchema = createSelectSchema(cvProfiles);
export const insertAnalysisFeedbackSchema = createInsertSchema(analysisFeedback);
export const selectAnalysisFeedbackSchema = createSelectSchema(analysisFeedback);

// Export types
export type AnalysisRecord = typeof analysisRecords.$inferSelect;
export type NewAnalysisRecord = typeof analysisRecords.$inferInsert;
export type JobSearch = typeof jobSearches.$inferSelect;
export type NewJobSearch = typeof jobSearches.$inferInsert;
export type CvProfile = typeof cvProfiles.$inferSelect;
export type NewCvProfile = typeof cvProfiles.$inferInsert;
export type AnalysisFeedback = typeof analysisFeedback.$inferSelect;
export type NewAnalysisFeedback = typeof analysisFeedback.$inferInsert;
