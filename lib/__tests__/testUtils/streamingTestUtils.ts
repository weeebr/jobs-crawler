import type { CVProfile } from "@/lib/schemas";
import type { AnalysisRecord } from "@/lib/types";

export const createMockCvProfile = (): CVProfile => ({
  roles: [{ title: "Developer", stack: ["React", "TypeScript"] }],
  skills: ["JavaScript", "React"],
  projects: [],
  education: [],
  keywords: []
});

export const createMockAnalysisRecord = (): AnalysisRecord => ({
  id: 123,
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
  cv: createMockCvProfile(),
  llmAnalysis: {
    matchScore: 80,
    reasoning: ["Strong technical match"],
    letters: {},
    analyzedAt: Date.now(),
    analysisVersion: "1.0"
  },
  userInteractions: { interactionCount: 0 },
  createdAt: Date.now(),
  updatedAt: Date.now()
});

export const createMockJobLinks = () => [
  "https://jobs.ch/vacancies/detail/job1",
  "https://jobs.ch/vacancies/detail/job2",
  "https://jobs.ch/vacancies/detail/job3",
  "https://jobs.ch/vacancies/detail/job4",
  "https://jobs.ch/vacancies/detail/job5"
];

export const createMockMessageCollector = () => {
  const messages: Array<{ type: string; data: any }> = [];
  const sendMessage = (type: string, data: any) => {
    messages.push({ type, data });
  };
  return { messages, sendMessage };
};

export const createMockIsClosed = (closeAfter: number = 0) => {
  let callCount = 0;
  return () => {
    callCount++;
    return callCount > closeAfter;
  };
};
