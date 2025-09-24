import type { CVProfile, JobAdParsed } from "../schemas";
import { intersectionSize } from "./utils";

const EXPERIENCE_WEIGHT = 15;
const STACK_WEIGHT = 50;
const KEYWORD_WEIGHT = 15;
const ENVIRONMENT_WEIGHT = 20;

export function calculateCoverageScore(
  intersection: number,
  jobStackSize: number,
): number {
  if (jobStackSize === 0) {
    return STACK_WEIGHT * 0.5;
  }
  return (intersection / jobStackSize) * STACK_WEIGHT;
}

export function calculateKeywordScore(job: JobAdParsed, keywords: string[]): number {
  const signals = [
    ...job.qualifications,
    ...job.roles,
    ...job.benefits,
  ];

  if (signals.length === 0 || keywords.length === 0) return 0;

  const normalizedSignals = signals.map((text) =>
    text.toLowerCase().replace(/[^a-z0-9 ]/g, " "),
  );
  const normalizedKeywords = keywords.map((keyword) =>
    keyword.toLowerCase().replace(/[^a-z0-9 ]/g, " "),
  );

  let matches = 0;
  for (const keyword of normalizedKeywords) {
    if (normalizedSignals.some((signal) => signal.includes(keyword))) {
      matches += 1;
    }
  }

  const coverage = matches / normalizedKeywords.length;
  return Math.min(KEYWORD_WEIGHT, coverage * KEYWORD_WEIGHT);
}

export function calculateExperienceScore(cv: CVProfile): number {
  const totalYears = cv.roles.reduce((sum: number, role: { years?: number }) => sum + (role.years || 0), 0);
  const avgYears = cv.roles.length > 0 ? totalYears / cv.roles.length : 0;

  // Score based on years of experience
  if (avgYears >= 5) return EXPERIENCE_WEIGHT;
  if (avgYears >= 3) return EXPERIENCE_WEIGHT * 0.8;
  if (avgYears >= 1) return EXPERIENCE_WEIGHT * 0.6;
  return EXPERIENCE_WEIGHT * 0.3;
}

export function calculateEnvironmentScore(job: JobAdParsed): number {
  let score = 0;

  // Check for company size preference (small companies, startups)
  if (job.size && ['5+', '10+', '20+'].includes(job.size)) {
    score += ENVIRONMENT_WEIGHT * 0.3; // Prefer smaller companies
  }

  // Check for hybrid/remote work
  if (job.workload?.toLowerCase().includes('hybrid') ||
      job.workload?.toLowerCase().includes('remote')) {
    score += ENVIRONMENT_WEIGHT * 0.2;
  }

  // Check for design/AI tasks in job description
  const jobText = `${job.qualifications.join(' ')} ${job.roles.join(' ')} ${job.benefits.join(' ')}`.toLowerCase();
  if (jobText.includes('design') || jobText.includes('ui/ux') || jobText.includes('figma')) {
    score += ENVIRONMENT_WEIGHT * 0.2;
  }
  if (jobText.includes('ai') || jobText.includes('machine learning') || jobText.includes('ml')) {
    score += ENVIRONMENT_WEIGHT * 0.2;
  }

  // Check for startup/innovation culture
  if (job.motto?.toLowerCase().includes('innovation') ||
      job.motto?.toLowerCase().includes('startup') ||
      job.motto?.toLowerCase().includes('growth')) {
    score += ENVIRONMENT_WEIGHT * 0.1;
  }

  return Math.min(ENVIRONMENT_WEIGHT, score);
}

export function generateReasoning({
  stackCoverage,
  environmentScore,
  gaps,
  job,
  cv,
}: {
  stackCoverage: number;
  environmentScore: number;
  gaps: string[];
  job: JobAdParsed;
  cv: CVProfile;
}): string[] {
  const reasoning: string[] = [];

  // Stack coverage
  if (stackCoverage >= 0.8) {
    reasoning.push(`✓ Strong tech stack match (${Math.round(stackCoverage * 100)}%)`);
  } else if (stackCoverage >= 0.5) {
    reasoning.push(`⚠ Partial tech stack match (${Math.round(stackCoverage * 100)}%)`);
  } else {
    reasoning.push(`✗ Limited tech stack overlap (${Math.round(stackCoverage * 100)}%)`);
  }

  // Experience level
  const totalYears = cv.roles.reduce((sum: number, role: { years?: number }) => sum + (role.years || 0), 0);
  if (totalYears >= 5) {
    reasoning.push(`✓ ${totalYears}+ years experience`);
  } else if (totalYears >= 2) {
    reasoning.push(`⚠ ${totalYears} years experience`);
  } else {
    reasoning.push(`✗ Limited experience (${totalYears} years)`);
  }

  // Environment fit
  if (environmentScore >= ENVIRONMENT_WEIGHT * 0.7) {
    reasoning.push(`✓ Great environment fit (hybrid/remote, design/AI tasks)`);
  } else if (environmentScore >= ENVIRONMENT_WEIGHT * 0.4) {
    reasoning.push(`⚠ Moderate environment fit`);
  } else {
    reasoning.push(`✗ Limited environment alignment`);
  }

  // Company size
  if (job.size && ['5+', '10+', '20+'].includes(job.size)) {
    reasoning.push(`✓ Small team (${job.size}) - good for impact`);
  } else if (job.size && ['50+', '100+'].includes(job.size)) {
    reasoning.push(`⚠ Medium company (${job.size})`);
  } else if (job.size) {
    reasoning.push(`✗ Large company (${job.size}) - may be less hands-on`);
  }

  // Key gaps
  if (gaps.length > 0) {
    reasoning.push(`✗ Missing: ${gaps.slice(0, 3).join(', ')}${gaps.length > 3 ? '...' : ''}`);
  }

  return reasoning;
}
