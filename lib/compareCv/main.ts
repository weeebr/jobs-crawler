import type { CVProfile, JobAdParsed, ComparisonResult } from "../schemas";
import { comparisonResultSchema } from "../schemas";
import { roundMatchScore } from "../matchScore";
import { calculateCoverageScore } from "./scoring";
import { calculateKeywordScore } from "./scoring";
import { calculateExperienceScore } from "./scoring";
import { calculateEnvironmentScore } from "./scoring";
import { generateReasoning } from "./scoring";
import { intersectionSize } from "./utils";
import { normalizeTechName } from "./utils";

const EXPERIENCE_WEIGHT = 15;
const STACK_WEIGHT = 50;
const KEYWORD_WEIGHT = 15;
const ENVIRONMENT_WEIGHT = 20;

export function compareCv(job: JobAdParsed, cv: CVProfile): ComparisonResult {
  const jobStackSet = new Set<string>(
    job.stack.map((tech: string) => normalizeTechName(tech)).filter(Boolean),
  );

  const cvStackSet = new Set<string>();
  for (const role of cv.roles) {
    for (const tech of role.stack) {
      cvStackSet.add(normalizeTechName(tech));
    }
  }
  for (const project of cv.projects) {
    for (const tech of project.stack) {
      cvStackSet.add(normalizeTechName(tech));
    }
  }
  for (const skill of cv.skills) {
    cvStackSet.add(normalizeTechName(skill));
  }

  const intersection = intersectionSize(jobStackSet, cvStackSet);
  const coverageScore = calculateCoverageScore(
    intersection,
    jobStackSet.size,
  );

  const keywordScore = calculateKeywordScore(job, cv.keywords);
  const experienceScore = calculateExperienceScore(cv);
  const environmentScore = calculateEnvironmentScore(job);

  const rawScore = coverageScore + keywordScore + experienceScore + environmentScore;
  const matchScore = roundMatchScore(rawScore);

  const gaps = job.stack.filter(
    (tech: string) => !cvStackSet.has(normalizeTechName(tech)),
  );

  const reasoning = generateReasoning({
    stackCoverage: intersection / Math.max(jobStackSet.size, 1),
    environmentScore,
    gaps,
    job,
    cv,
  });

  console.info(
    `[compareCv] calculated score=${matchScore} overlap=${intersection}/${jobStackSet.size}`,
  );

  const result = {
    matchScore,
    gaps,
    reasoning,
  };

  // Validate the result with Zod schema
  return comparisonResultSchema.parse(result);
}
