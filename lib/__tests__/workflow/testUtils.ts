import { vi } from "vitest";
import { fetchJobAd } from "@/lib/fetchJobAd";
import { extractJobLinks } from "@/lib/extractJobLinks";
import { parseJobAd } from "@/lib/parseJobAd";
import { compareCv } from "@/lib/compareCv";
import { rankMatchScore } from "@/lib/rankMatch";
import { saveAnalysis } from "@/lib/analysisStore";
import { collectJobLinks } from "@/lib/streaming/jobLinkCollector";
import type { CVProfile } from "@/lib/schemas";

// Mock all dependencies
vi.mock("@/lib/fetchJobAd");
vi.mock("@/lib/extractJobLinks");
vi.mock("@/lib/parseJobAd");
vi.mock("@/lib/compareCv");
vi.mock("@/lib/rankMatch");
vi.mock("@/lib/analysisStore");
vi.mock("@/lib/streaming/jobLinkCollector");

export const fetchJobAdMock = vi.mocked(fetchJobAd);
export const extractJobLinksMock = vi.mocked(extractJobLinks);
export const parseJobAdMock = vi.mocked(parseJobAd);
export const compareCvMock = vi.mocked(compareCv);
export const rankMatchScoreMock = vi.mocked(rankMatchScore);
export const saveAnalysisMock = vi.mocked(saveAnalysis);
export const collectJobLinksMock = vi.mocked(collectJobLinks);

export const mockCvProfile: CVProfile = {
  roles: [{ title: "Developer", stack: ["React", "TypeScript"] }],
  skills: ["JavaScript", "React"],
  projects: [],
  education: [],
  keywords: []
};

export function createMockJob(title: string, company: string, stack: string[] = ["React", "TypeScript"]) {
  return {
    title,
    company,
    stack,
    qualifications: ["3+ years experience"],
    roles: ["Frontend Developer"],
    benefits: ["Remote work"],
    fetchedAt: Date.now(),
    sourceDomain: "example.com"
  };
}

export function createMockAnalysis(id: number, job: any, cv: CVProfile) {
  return {
    id,
    job,
    cv,
    llmAnalysis: {
      matchScore: 80,
      reasoning: ["Strong technical match with React experience"],
      letters: {},
      analyzedAt: Date.now(),
      analysisVersion: "1.0"
    },
    userInteractions: { interactionCount: 0 },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function setupDefaultMocks() {
  vi.clearAllMocks();
  
  // Mock successful job fetching - this will be overridden in individual tests
  fetchJobAdMock.mockResolvedValue("<html>mock job page</html>");
  
  // Mock successful job parsing - this will be overridden in individual tests
  parseJobAdMock.mockResolvedValue(createMockJob("Test Job", "Test Company"));

  // Mock successful CV comparison
  compareCvMock.mockReturnValue({
    matchScore: 75,
    gaps: ["GraphQL"],
    reasoning: ["Strong React experience", "Missing GraphQL"]
  });

  // Mock successful LLM ranking
  rankMatchScoreMock.mockResolvedValue({
    matchScore: 80,
    reasoning: "Strong technical match with React experience",
    source: "llm"
  });

  // Mock successful analysis saving
  saveAnalysisMock.mockReturnValue(
    createMockAnalysis(123, createMockJob("Test Job", "Test Company"), mockCvProfile)
  );

  // Mock collectJobLinks - this will be overridden in individual tests
  collectJobLinksMock.mockResolvedValue({
    jobLinks: []
  });
}
