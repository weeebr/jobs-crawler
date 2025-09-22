import { describe, expect, it } from "vitest";

import { extractTech } from "../extractTech";

describe("extractTech", () => {
  it("detects canonical tech terms and aliases", () => {
    const text = `We use TS, React.js, Node, and PostgreSQL on AWS with CI/CD pipelines.`;

    const stack = extractTech(text);

    expect(stack).toEqual([
      "AWS",
      "CI/CD",
      "Node.js",
      "PostgreSQL",
      "React",
      "TypeScript",
    ]);
  });
});
