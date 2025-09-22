import { describe, expect, it } from "vitest";

import { compareCv } from "../compareCv";
import type { CVProfile, JobAdParsed } from "../schemas";

describe("compareCv", () => {
  const job: JobAdParsed = {
    title: "Senior Full Stack Engineer",
    company: "Stellar Labs",
    stack: ["TypeScript", "React", "Node.js", "PostgreSQL"],
    qualifications: ["Ship weekly with product", "Own AWS infrastructure"],
    roles: ["Partner with design to deliver full-stack features"],
    benefits: ["Work remote-friendly"],
    fetchedAt: Date.now(),
  };

  const cv: CVProfile = {
    roles: [
      {
        title: "Senior Engineer",
        stack: ["TypeScript", "React", "AWS"],
      },
    ],
    skills: ["Node.js", "GraphQL"],
    projects: [
      {
        name: "Platform Upgrade",
        stack: ["PostgreSQL", "AWS"],
      },
    ],
    education: [],
    keywords: ["ship weekly", "mentoring"],
  };

  it("scores overlap and identifies gaps", () => {
    const comparison = compareCv(job, cv);

    expect(comparison.matchScore).toBeGreaterThanOrEqual(70);
    expect(comparison.gaps).not.toContain("TypeScript");
    expect(comparison.gaps).not.toContain("React");
  });

  it("lists missing stack elements as gaps", () => {
    const minimalCv: CVProfile = { ...cv, roles: [], skills: [], projects: [] };
    const comparison = compareCv(job, minimalCv);

    expect(comparison.gaps).toEqual(job.stack);
    expect(comparison.matchScore).toBeLessThan(40);
  });
});
