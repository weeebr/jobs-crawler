import { vi } from "vitest";

export const setupStage1Failure = (fetchJobAdMock: any, collectJobLinksMock?: any) => {
  fetchJobAdMock.mockRejectedValue(new Error("Search page fetch failed"));
  if (collectJobLinksMock) {
    collectJobLinksMock.mockRejectedValue(new Error("Search page fetch failed"));
  }
};

export const setupStage1UrlExtractionFailure = (fetchJobAdMock: any, extractJobLinksMock: any, collectJobLinksMock?: any) => {
  fetchJobAdMock.mockResolvedValue("<html>search page</html>");
  extractJobLinksMock.mockReturnValue([]); // No job links found
  if (collectJobLinksMock) {
    collectJobLinksMock.mockResolvedValue({ jobLinks: [] }); // No job links found
  }
};

export const setupStage2JobFetchFailure = (fetchJobAdMock: any, extractJobLinksMock: any, collectJobLinksMock: any) => {
  collectJobLinksMock.mockResolvedValueOnce({ jobLinks: ["https://jobs.ch/vacancies/detail/job1"] });
  fetchJobAdMock.mockImplementation((url: string) => {
    if (url.includes("search")) {
      return Promise.resolve("<html>search page</html>");
    } else {
      return Promise.reject(new Error("Job page fetch failed"));
    }
  });
  extractJobLinksMock.mockReturnValueOnce(["https://jobs.ch/vacancies/detail/job1"]);
};

export const setupStage2JobParsingFailure = (fetchJobAdMock: any, extractJobLinksMock: any, parseJobAdMock: any, collectJobLinksMock: any) => {
  collectJobLinksMock.mockResolvedValueOnce({ jobLinks: ["https://jobs.ch/vacancies/detail/job1"] });
  fetchJobAdMock.mockImplementation((url: string) => {
    if (url.includes("search")) {
      return Promise.resolve("<html>search page</html>");
    } else {
      return Promise.resolve("<html>job page</html>");
    }
  });
  extractJobLinksMock.mockReturnValueOnce(["https://jobs.ch/vacancies/detail/job1"]);
  parseJobAdMock.mockRejectedValue(new Error("Failed to parse job ad"));
};

export const setupStage2CvComparisonFailure = (fetchJobAdMock: any, extractJobLinksMock: any, parseJobAdMock: any, compareCvMock: any, createMockJobData: () => any, collectJobLinksMock: any) => {
  collectJobLinksMock.mockResolvedValueOnce({ jobLinks: ["https://jobs.ch/vacancies/detail/job1"] });
  fetchJobAdMock.mockImplementation((url: string) => {
    if (url.includes("search")) {
      return Promise.resolve("<html>search page</html>");
    } else {
      return Promise.resolve("<html>job page</html>");
    }
  });
  extractJobLinksMock.mockReturnValueOnce(["https://jobs.ch/vacancies/detail/job1"]);
  parseJobAdMock.mockResolvedValue(createMockJobData());
  compareCvMock.mockImplementation(() => {
    throw new Error("CV comparison failed");
  });
};

export const setupStage2LlmRankingFailure = (fetchJobAdMock: any, extractJobLinksMock: any, parseJobAdMock: any, compareCvMock: any, rankMatchScoreMock: any, createMockJobData: () => any, createMockComparisonResult: () => any, collectJobLinksMock: any) => {
  collectJobLinksMock.mockResolvedValueOnce({ jobLinks: ["https://jobs.ch/vacancies/detail/job1"] });
  fetchJobAdMock.mockImplementation((url: string) => {
    if (url.includes("search")) {
      return Promise.resolve("<html>search page</html>");
    } else {
      return Promise.resolve("<html>job page</html>");
    }
  });
  extractJobLinksMock.mockReturnValueOnce(["https://jobs.ch/vacancies/detail/job1"]);
  parseJobAdMock.mockResolvedValue(createMockJobData());
  compareCvMock.mockReturnValue(createMockComparisonResult());
  rankMatchScoreMock.mockRejectedValue(new Error("LLM ranking failed"));
};

export const setupMixedSuccessFailure = (fetchJobAdMock: any, extractJobLinksMock: any, parseJobAdMock: any, compareCvMock: any, rankMatchScoreMock: any, createMockComparisonResult: () => any, createMockRankingResult: () => any, collectJobLinksMock: any) => {
  collectJobLinksMock.mockResolvedValueOnce({ 
    jobLinks: [
      "https://jobs.ch/vacancies/detail/job1",
      "https://jobs.ch/vacancies/detail/job2",
      "https://jobs.ch/vacancies/detail/job3"
    ]
  });
  
  fetchJobAdMock.mockImplementation((url: string) => {
    if (url.includes("search")) {
      return Promise.resolve("<html>search page</html>");
    } else if (url.includes("job1")) {
      return Promise.resolve("<html>job page 1</html>");
    } else if (url.includes("job2")) {
      return Promise.resolve("<html>job page 2</html>");
    } else if (url.includes("job3")) {
      return Promise.resolve("<html>job page 3</html>");
    }
    return Promise.resolve("<html>default page</html>");
  });

  extractJobLinksMock.mockReturnValueOnce([
    "https://jobs.ch/vacancies/detail/job1",
    "https://jobs.ch/vacancies/detail/job2",
    "https://jobs.ch/vacancies/detail/job3"
  ]);

  parseJobAdMock
    .mockResolvedValueOnce({
      title: "Job 1",
      company: "Company 1",
      stack: ["React"],
      qualifications: ["3+ years"],
      roles: ["Developer"],
      benefits: ["Remote"],
      fetchedAt: Date.now(),
      sourceDomain: "example.com"
    })
    .mockRejectedValueOnce(new Error("Job 2 parsing failed"))
    .mockResolvedValueOnce({
      title: "Job 3",
      company: "Company 3",
      stack: ["TypeScript"],
      qualifications: ["2+ years"],
      roles: ["Developer"],
      benefits: ["Flexible"],
      fetchedAt: Date.now(),
      sourceDomain: "example.com"
    });

  compareCvMock.mockReturnValue(createMockComparisonResult());
  rankMatchScoreMock.mockResolvedValue(createMockRankingResult());
};

export const setupCompleteStage2Failure = (fetchJobAdMock: any, extractJobLinksMock: any, parseJobAdMock: any, collectJobLinksMock: any) => {
  collectJobLinksMock.mockResolvedValueOnce({ jobLinks: ["https://jobs.ch/vacancies/detail/job1"] });
  fetchJobAdMock.mockImplementation((url: string) => {
    if (url.includes("search")) {
      return Promise.resolve("<html>search page</html>");
    } else {
      return Promise.resolve("<html>job page</html>");
    }
  });
  extractJobLinksMock.mockReturnValueOnce(["https://jobs.ch/vacancies/detail/job1"]);
  parseJobAdMock.mockRejectedValue(new Error("All jobs failed"));
};
