import { describe, expect, it } from "vitest";

import { parseCvMarkdown } from "../parseCvMarkdown";

const SAMPLE_CV = `# Jane Doe

## Work Experience
- Senior Engineer @ Stellar Labs — Led platform team using TypeScript, React, AWS (2021-2024)
- Full Stack Developer @ Acme Corp — Built Node.js services and GraphQL APIs (2018-2021)

## Skills
- TypeScript, React, Node.js, GraphQL, PostgreSQL

## Projects
- Realtime analytics dashboard - Delivered 30% faster insights with Next.js + AWS

## Education
- BSc Computer Science - University of Somewhere

## Keywords
- leadership, delivery, platform`;

describe("parseCvMarkdown", () => {
  it("parses markdown into structured CV profile", () => {
    const profile = parseCvMarkdown(SAMPLE_CV);

    expect(profile.roles).toHaveLength(2);
    expect(profile.roles[0].title).toContain("Senior Engineer");
    expect(profile.roles[0].stack).toContain("TypeScript");

    expect(profile.skills).toContain("TypeScript");
    expect(profile.projects[0].name).toContain("Realtime analytics dashboard");
    expect(profile.projects[0].stack).toContain("Next.js");

    expect(profile.education[0].degree).toContain("BSc Computer Science");

    expect(profile.keywords).toContain("leadership");
  });
});
