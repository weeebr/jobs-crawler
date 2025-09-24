import { jobAdFetchedSchema, llmAnalysisSchema, cvProfileSchema } from "@/lib/schemas";

export const TEST_API_KEY_1 = 'sk-test-user1-1234567890123456789012345678901234567890';
export const TEST_API_KEY_2 = 'sk-test-user2-0987654321098765432109876543210987654321';

export function createSampleJob() {
  return jobAdFetchedSchema.parse({
    title: 'Senior React Developer',
    company: 'TechCorp Inc.',
    stack: ['React', 'TypeScript', 'Node.js'],
    roles: ['Senior Developer'],
    qualifications: ['5+ years React experience'],
    benefits: ['Health insurance', 'Remote work'],
    description: 'Looking for an experienced React developer...',
    fetchedAt: Date.now(),
    sourceUrl: 'https://example.com/job/123',
    sourceDomain: 'example.com',
    sourceType: 'single-job',
  });
}

export function createSampleCV() {
  return cvProfileSchema.parse({
    roles: [{ title: 'Senior React Developer', stack: ['React', 'TypeScript', 'Node.js'] }],
    skills: ['React', 'TypeScript', 'Node.js', 'JavaScript'],
    projects: [{ name: 'E-commerce Platform', stack: ['React', 'Node.js', 'PostgreSQL'] }],
    education: [{ degree: 'BS Computer Science' }],
    keywords: ['React', 'TypeScript', 'Node.js'],
  });
}

export function createSampleLlmAnalysis() {
  return llmAnalysisSchema.parse({
    matchScore: 85.5,
    reasoning: ['Strong match with required technologies'],
    letters: {},
    analyzedAt: Date.now(),
    analysisVersion: '1.0',
  });
}

export function createSampleAnalysis(sampleJob: {
  title: string;
  company: string;
  stack: string[];
  sourceUrl: string;
}) {
  return {
    id: Date.now(),
    job: {
      title: sampleJob.title,
      company: sampleJob.company,
      stack: sampleJob.stack,
      qualifications: ['5+ years experience'],
      roles: ['Senior Developer'],
      benefits: ['Health insurance', 'Remote work'],
      fetchedAt: Date.now(),
      sourceUrl: sampleJob.sourceUrl,
      sourceDomain: 'example.com',
      sourceType: 'single-job' as const,
    },
    cv: {
      roles: [{ title: 'Senior React Developer', stack: ['React', 'TypeScript', 'Node.js'] }],
      skills: ['React', 'TypeScript', 'Node.js', 'JavaScript'],
      projects: [{ name: 'E-commerce Platform', stack: ['React', 'Node.js', 'PostgreSQL'] }],
      education: [{ degree: 'BS Computer Science' }],
      keywords: ['React', 'TypeScript', 'Node.js'],
    },
    llmAnalysis: {
      matchScore: 85.5,
      reasoning: ['Strong match with required technologies'],
      letters: {},
      analyzedAt: Date.now(),
      analysisVersion: '1.0',
    },
    userInteractions: {
      interactionCount: 0,
      isNewThisRun: false,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
