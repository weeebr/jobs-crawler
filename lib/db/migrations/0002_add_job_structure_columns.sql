-- Migration: Add structured job content columns to analysis_records table
-- This migration adds the missing qualifications, roles, and benefits columns

-- Add new columns for structured job content
ALTER TABLE analysis_records ADD COLUMN qualifications TEXT DEFAULT '[]';
ALTER TABLE analysis_records ADD COLUMN roles TEXT DEFAULT '[]';
ALTER TABLE analysis_records ADD COLUMN benefits TEXT DEFAULT '[]';
