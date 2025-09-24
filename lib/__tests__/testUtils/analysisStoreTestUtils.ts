import type { AnalysisRecord } from "@/lib/schemas";

export const createMockAnalysis = (id: number): AnalysisRecord => ({
  id,
  job: {
    title: "Test Job",
    company: "Example Corp",
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
    reasoning: ["Strong React experience", "Good TypeScript skills"], // Added second reasoning item to meet min requirement
    letters: {},
    analyzedAt: Date.now(),
    analysisVersion: "1.0"
  },
  userInteractions: {
    interactionCount: 0,
    isNewThisRun: false
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
    reasoning: [], // Invalid: empty reasoning array
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
