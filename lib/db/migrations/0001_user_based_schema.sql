-- Migration: Add user-based architecture with API key hashing
-- This migration adds user tracking and makes all data user-scoped

-- Users Table - Track API key hashes for user identification
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Hashed API key for user identification (SHA-256)
    api_key_hash TEXT NOT NULL UNIQUE,

    -- User preferences and metadata
    last_active_at DATETIME NOT NULL,
    total_analyses INTEGER DEFAULT 0,
    preferred_model TEXT DEFAULT 'gpt-4o-mini'
);

-- Analysis Records Table - Now user-scoped with model tracking
CREATE TABLE analysis_records_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Job Data
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT,
    published_at TEXT,
    location TEXT,
    workload TEXT,
    duration TEXT,
    size TEXT,
    company_size TEXT,
    stack TEXT NOT NULL, -- JSON array of technologies

    -- LLM Analysis Results
    match_score REAL NOT NULL,
    reasoning TEXT NOT NULL,

    -- User Interactions
    status TEXT CHECK (status IN ('interested', 'applied')),
    is_new_this_run BOOLEAN NOT NULL DEFAULT FALSE,

    -- Metadata
    source_url TEXT,
    source_type TEXT,
    model_used TEXT -- Track which model was used for analysis
);

-- Copy existing data if any (assigning to a default user)
INSERT INTO analysis_records_new (
    id, user_id, created_at, updated_at, title, company, description,
    published_at, location, workload, duration, size, company_size, stack,
    match_score, reasoning, status, is_new_this_run, source_url, source_type
)
SELECT
    id, 1 as user_id, created_at, updated_at, title, company, description,
    published_at, location, workload, duration, size, company_size, stack,
    match_score, reasoning, status, is_new_this_run, source_url, source_type
FROM analysis_records;

-- Job Search Sessions Table - Now user-scoped
CREATE TABLE job_searches_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    search_url TEXT NOT NULL,
    total_jobs_found INTEGER,
    successfully_analyzed INTEGER DEFAULT 0,
    failed_analyses INTEGER DEFAULT 0,

    -- Processing status
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    completed_at DATETIME
);

-- Copy existing data if any (assigning to a default user)
INSERT INTO job_searches_new (
    id, user_id, created_at, search_url, total_jobs_found,
    successfully_analyzed, failed_analyses, status, completed_at
)
SELECT
    id, 1 as user_id, created_at, search_url, total_jobs_found,
    successfully_analyzed, failed_analyses, status, completed_at
FROM job_searches;

-- CV Profiles Table - Now user-scoped
CREATE TABLE cv_profiles_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Basic info
    name TEXT,
    email TEXT,

    -- CV Content (JSON for flexibility)
    roles TEXT NOT NULL, -- JSON array
    skills TEXT NOT NULL, -- JSON array
    projects TEXT NOT NULL, -- JSON array
    education TEXT NOT NULL, -- JSON array
    keywords TEXT NOT NULL, -- JSON array

    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Copy existing data if any (assigning to a default user)
INSERT INTO cv_profiles_new (
    id, user_id, created_at, updated_at, name, email, roles, skills,
    projects, education, keywords, is_active
)
SELECT
    id, 1 as user_id, created_at, updated_at, name, email, roles, skills,
    projects, education, keywords, is_active
FROM cv_profiles;

-- Analysis Gaps and Recommendations - Now user-scoped
CREATE TABLE analysis_feedback_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_record_id INTEGER NOT NULL REFERENCES analysis_records_new(id) ON DELETE CASCADE,

    -- Gaps identified
    missing_skills TEXT, -- JSON array
    missing_experience TEXT, -- JSON array
    missing_keywords TEXT, -- JSON array

    -- Recommendations
    skill_recommendations TEXT, -- JSON array
    experience_recommendations TEXT, -- JSON array
    project_recommendations TEXT, -- JSON array

    -- Metadata
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing data if any (assigning to a default user)
INSERT INTO analysis_feedback_new (
    id, user_id, analysis_record_id, missing_skills, missing_experience,
    missing_keywords, skill_recommendations, experience_recommendations,
    project_recommendations, created_at
)
SELECT
    id, 1 as user_id, analysis_record_id, missing_skills, missing_experience,
    missing_keywords, skill_recommendations, experience_recommendations,
    project_recommendations, created_at
FROM analysis_feedback;

-- Drop old tables and rename new ones
DROP TABLE analysis_feedback;
DROP TABLE cv_profiles;
DROP TABLE job_searches;
DROP TABLE analysis_records;

ALTER TABLE analysis_records_new RENAME TO analysis_records;
ALTER TABLE job_searches_new RENAME TO job_searches;
ALTER TABLE cv_profiles_new RENAME TO cv_profiles;
ALTER TABLE analysis_feedback_new RENAME TO analysis_feedback;

-- Indexes for better performance
CREATE INDEX idx_analysis_records_user_id ON analysis_records(user_id, created_at DESC);
CREATE INDEX idx_analysis_records_user_status ON analysis_records(user_id, status);
CREATE INDEX idx_analysis_records_user_score ON analysis_records(user_id, match_score DESC);
CREATE INDEX idx_job_searches_user_status ON job_searches(user_id, status);
CREATE INDEX idx_cv_profiles_user_active ON cv_profiles(user_id, is_active, updated_at DESC);
CREATE INDEX idx_users_api_key_hash ON users(api_key_hash);
CREATE INDEX idx_users_last_active ON users(last_active_at DESC);
