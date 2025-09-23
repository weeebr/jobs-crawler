import type { AnalysisRecord } from "@/lib/schemas";

export const createMockAnalysis = (id: number): AnalysisRecord => ({
  id,
  job: {
    title: "Test Job",
    company: "Test Company",
    stack: ["React", "TypeScript"],
    qualifications: ["3+ years experience"],
    roles: ["Frontend Developer"],
    benefits: ["Remote work"],
    fetchedAt: Date.now(),
    sourceDomain: "example.com"
  },
  cv: {
    roles: [{ title: "Developer", stack: ["React"] }],
    skills: ["JavaScript"],
    projects: [],
    education: [],
    keywords: []
  },
  llmAnalysis: {
    matchScore: 80,
    reasoning: ["Strong React experience"],
    letters: {},
    analyzedAt: Date.now(),
    analysisVersion: "1.0"
  },
  userInteractions: {
    interactionCount: 0
  },
  createdAt: Date.now(),
  updatedAt: Date.now()
});


export const createInvalidAnalysisRecord = () => ({
  id: 999,
  job: {
    title: "", // Invalid: empty title
    company: "Test Company",
    stack: [],
    qualifications: [],
    roles: [],
    benefits: [],
    fetchedAt: Date.now()
  },
  cv: {
    roles: [],
    skills: [],
    projects: [],
    education: [],
    keywords: []
  },
  llmAnalysis: {
    matchScore: 80,
    reasoning: [],
    letters: {},
    analyzedAt: Date.now(),
    analysisVersion: "1.0"
  },
  userInteractions: {
    interactionCount: 0
  },
  createdAt: Date.now(),
  updatedAt: Date.now()
});
