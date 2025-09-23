import { expect } from "vitest";

export const expectStage2JobFetchError = (result: any) => {
  expect(result.records).toHaveLength(0);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job1");
  expect(result.errors[0].message).toBe("Job page fetch failed");
};

export const expectStage2JobParsingError = (result: any) => {
  expect(result.records).toHaveLength(0);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job1");
  expect(result.errors[0].message).toBe("Failed to parse job ad");
};

export const expectStage2CvComparisonError = (result: any) => {
  expect(result.records).toHaveLength(0);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job1");
  expect(result.errors[0].message).toBe("CV comparison failed");
};

export const expectStage2LlmRankingError = (result: any) => {
  expect(result.records).toHaveLength(0);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job1");
  expect(result.errors[0].message).toBe("LLM ranking failed");
};

export const expectMixedSuccessFailure = (result: any) => {
  expect(result.records).toHaveLength(2);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0].url).toBe("https://jobs.ch/vacancies/detail/job2");
  expect(result.errors[0].message).toBe("Job 2 parsing failed");
};
