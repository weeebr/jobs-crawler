import type { CVProfile } from "@/lib/schemas";

export const createMockCvProfile = (): CVProfile => ({
  roles: [{ title: "Developer", stack: ["React", "TypeScript"] }],
  skills: ["JavaScript", "React"],
  projects: [],
  education: [],
  keywords: []
});

// Create a testable version of the 2-stage workflow with error handling
export async function testTwoStageWorkflowWithErrors(
  searchUrl: string,
  cvProfile: CVProfile,
  clearJobAdData: boolean | undefined,
  fetchJobAdMock: any,
  extractJobLinksMock: any,
  parseJobAdMock: any,
  compareCvMock: any,
  rankMatchScoreMock: any,
  collectJobLinksMock?: any
) {
  const fetchOptions = {
    timeoutMs: 6000,
    retryCount: 1,
    clearJobAdData
  };

  // Stage 1: Collect job links
  const result = collectJobLinksMock 
    ? await collectJobLinksMock(searchUrl, fetchOptions)
    : await collectJobLinks(searchUrl, fetchOptions);
  
  if (!result || !result.jobLinks || result.jobLinks.length === 0) {
    throw new Error("No job detail links found on search page");
  }
  
  const { jobLinks } = result;

  const records = [];
  const errors = [];

  // Stage 2: Analyze each job
  for (const link of jobLinks) {
    try {
      const html = await fetchJobAdMock(link, fetchOptions);
      const job = await parseJobAdMock(html, { sourceUrl: link });
      const comparison = compareCvMock(job, cvProfile);
      const ranking = await rankMatchScoreMock({
        job,
        cv: cvProfile,
        heuristics: comparison
      });
      
      records.push({
        id: Math.floor(Math.random() * 1000),
        job,
        cv: cvProfile,
        llmAnalysis: {
          matchScore: ranking.matchScore,
          reasoning: comparison.reasoning,
          letters: {},
          analyzedAt: Date.now(),
          analysisVersion: "1.0"
        },
        userInteractions: { interactionCount: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown analysis failure";
      errors.push({ url: link, message });
    }
  }

  // Don't throw error - return the results even if no records were successful
  return { records, errors };
}

// Mock job data for testing
export const createMockJobData = () => ({
  title: "Test Job",
  company: "Test Company",
  stack: ["React", "TypeScript"],
  qualifications: ["3+ years experience"],
  roles: ["Frontend Developer"],
  benefits: ["Remote work"],
  fetchedAt: Date.now(),
  sourceDomain: "example.com"
});

export const createMockComparisonResult = () => ({
  matchScore: 75,
  gaps: ["GraphQL"],
  reasoning: ["Strong React experience"]
});

export const createMockRankingResult = () => ({
  matchScore: 80,
  reasoning: "Good match",
  source: "llm" as const
});

// Import the collectJobLinks function
import { collectJobLinks } from "@/lib/streaming/jobLinkCollector";
