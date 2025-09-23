import { describe, expect, it, beforeEach } from "vitest";
import { 
  setupDefaultMocks, 
  mockCvProfile, 
  createMockJob, 
  createMockAnalysis,
  fetchJobAdMock,
  parseJobAdMock,
  compareCvMock,
  rankMatchScoreMock,
  saveAnalysisMock,
  collectJobLinksMock
} from "./testUtils";

// Create a testable version of the 2-stage workflow
async function testTwoStageWorkflow(
  searchUrl: string,
  cvProfile: typeof mockCvProfile,
  clearJobAdData?: boolean
) {
  const fetchOptions = {
    timeoutMs: 6000,
    retryCount: 1,
    clearJobAdData
  };

  // Stage 1: Collect job links
  const { jobLinks } = await collectJobLinksMock(searchUrl, fetchOptions);
  
  if (jobLinks.length === 0) {
    throw new Error("No job detail links found on search page");
  }

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
      
      const record = saveAnalysisMock({
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
      
      records.push(record);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown analysis failure";
      errors.push({ url: link, message });
    }
  }

  if (records.length === 0) {
    throw new Error("Failed to analyze any job ads from the search page");
  }

  return { records, errors };
}

describe("2-Stage Workflow Integration", () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  it("should complete full 2-stage workflow: search URL → job URLs → individual analysis", async () => {
    // Stage 1: Mock job URL collection
    collectJobLinksMock.mockResolvedValue({
      jobLinks: [
        "https://jobs.ch/vacancies/detail/job1",
        "https://jobs.ch/vacancies/detail/job2"
      ],
      fetchedPages: 1
    });

    fetchJobAdMock
      .mockResolvedValueOnce("<html>job page 1</html>")
      .mockResolvedValueOnce("<html>job page 2</html>");

    // Stage 2: Mock individual job analysis
    parseJobAdMock
      .mockResolvedValueOnce(createMockJob("Frontend Developer", "TechCorp"))
      .mockResolvedValueOnce(createMockJob("React Developer", "StartupXYZ", ["React", "JavaScript"]));

    // Mock the other functions for each job
    compareCvMock
      .mockReturnValueOnce({
        matchScore: 75,
        gaps: ["GraphQL"],
        reasoning: ["Strong React experience", "Missing GraphQL"]
      })
      .mockReturnValueOnce({
        matchScore: 70,
        gaps: ["TypeScript"],
        reasoning: ["Good React experience", "Missing TypeScript"]
      });

    rankMatchScoreMock
      .mockResolvedValueOnce({
        matchScore: 80,
        reasoning: "Strong technical match with React experience",
        source: "llm"
      })
      .mockResolvedValueOnce({
        matchScore: 75,
        reasoning: "Good technical match with React experience",
        source: "llm"
      });

    saveAnalysisMock
      .mockReturnValueOnce(createMockAnalysis(1, createMockJob("Frontend Developer", "TechCorp"), mockCvProfile))
      .mockReturnValueOnce(createMockAnalysis(2, createMockJob("React Developer", "StartupXYZ", ["React", "JavaScript"]), mockCvProfile));

    const result = await testTwoStageWorkflow(
      "https://jobs.ch/en/vacancies/?term=frontend%20developer",
      mockCvProfile,
      false
    );

    // Verify Stage 1: Job URL collection
    expect(collectJobLinksMock).toHaveBeenCalledTimes(1);
    expect(fetchJobAdMock).toHaveBeenCalledTimes(2); // 2 job pages

    // Verify Stage 2: Individual job analysis
    expect(parseJobAdMock).toHaveBeenCalledTimes(2); // 2 job pages
    expect(compareCvMock).toHaveBeenCalledTimes(2); // 2 jobs
    expect(rankMatchScoreMock).toHaveBeenCalledTimes(2); // 2 jobs
    expect(saveAnalysisMock).toHaveBeenCalledTimes(2); // 2 jobs

    // Verify final result
    expect(result.records).toHaveLength(2);
    expect(result.records[0].job.title).toBe("Frontend Developer");
    expect(result.records[1].job.title).toBe("React Developer");
  });
});
