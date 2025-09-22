import { describe, expect, it, beforeEach } from "vitest";
import { 
  setupDefaultMocks, 
  mockCvProfile, 
  createMockJob,
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

describe("2-Stage Workflow Error Handling", () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  it("should handle partial failures in 2-stage workflow", async () => {
    // Stage 1: Mock successful job URL collection
    collectJobLinksMock.mockResolvedValue({
      jobLinks: [
        "https://jobs.ch/vacancies/detail/job1",
        "https://jobs.ch/vacancies/detail/job2"
      ]
    });

    fetchJobAdMock
      .mockResolvedValueOnce("<html>job page 1</html>")
      .mockResolvedValueOnce("<html>job page 2</html>");

    // Stage 2: Mock one success, one failure
    parseJobAdMock
      .mockResolvedValueOnce(createMockJob("Frontend Developer", "TechCorp"))
      .mockRejectedValueOnce(new Error("Failed to parse job ad"));

    const result = await testTwoStageWorkflow(
      "https://jobs.ch/en/vacancies/?term=frontend%20developer",
      mockCvProfile,
      false
    );

    // Verify partial success
    expect(result.records).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job2");
    expect(result.errors[0].message).toBe("Failed to parse job ad");
  });

  it("should handle empty search results gracefully", async () => {
    // Stage 1: Mock empty search results
    collectJobLinksMock.mockResolvedValue({
      jobLinks: []
    });

    await expect(
      testTwoStageWorkflow(
        "https://jobs.ch/en/vacancies/?term=nonexistent",
        mockCvProfile,
        false
      )
    ).rejects.toThrow("No job detail links found on search page");
  });

  it("should handle all job analysis failures", async () => {
    // Stage 1: Mock successful job URL collection
    collectJobLinksMock.mockResolvedValue({
      jobLinks: ["https://jobs.ch/vacancies/detail/job1"]
    });

    fetchJobAdMock.mockResolvedValueOnce("<html>job page 1</html>");

    // Stage 2: Mock all failures
    parseJobAdMock.mockRejectedValue(new Error("All jobs failed"));

    await expect(
      testTwoStageWorkflow(
        "https://jobs.ch/en/vacancies/?term=frontend%20developer",
        mockCvProfile,
        false
      )
    ).rejects.toThrow("Failed to analyze any job ads from the search page");
  });
});
