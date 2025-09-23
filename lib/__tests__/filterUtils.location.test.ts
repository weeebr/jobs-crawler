import { describe, expect, it } from "vitest";

import type { RecentAnalysisSummary } from "@/lib/clientStorage";
import { deriveDynamicOptions, isValidLocationForFilter } from "@/app/components/AnalysesTable/filterUtils";

describe("isValidLocationForFilter", () => {
  it("accepts common remote formats with parentheses", () => {
    expect(isValidLocationForFilter("Remote (US)"))
      .toBe(true);
  });

  it("rejects technical keys and URLs", () => {
    expect(isValidLocationForFilter("https://example.com"))
      .toBe(false);
    expect(isValidLocationForFilter("LOCATIONIQ_MAPS_KEY=abc123"))
      .toBe(false);
  });
});

describe("deriveDynamicOptions", () => {
  it("collects normalized locations for filter dropdowns", () => {
    const analyses: RecentAnalysisSummary[] = [
      {
        id: 1,
        title: "Senior Engineer",
        company: "Acme",
        stack: ["TypeScript"],
        location: "Remote (US)",
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
        matchScore: 85,
      },
      {
        id: 2,
        title: "Frontend Dev",
        company: "Globex",
        stack: ["React"],
        location: "Berlin, Germany",
        createdAt: 1700000001000,
        updatedAt: 1700000001000,
        matchScore: 72,
      },
    ];

    const options = deriveDynamicOptions(analyses);
    expect(options.locations).toEqual([
      { value: "berlin, germany", label: "Berlin, Germany" },
      { value: "remote (us)", label: "Remote (US)" },
    ]);
  });
});
