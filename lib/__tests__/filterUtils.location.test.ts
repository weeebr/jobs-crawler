import { describe, expect, it } from "vitest";

import type { RecentAnalysisSummary } from "@/lib/clientStorage";
import { deriveDynamicOptions, filterAndSortAnalyses, isValidLocationForFilter } from "@/app/components/AnalysesTable/filterUtils";

const BASE_FILTERS = {
  size: "all",
  score: "all",
  location: "all",
  tech: "all",
  status: "all" as const,
  sort: "newest" as const,
  search: "",
};

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

describe("filterAndSortAnalyses", () => {
  it("matches normalized location values", () => {
    const analyses: RecentAnalysisSummary[] = [
      {
        id: 10,
        title: "Platform Engineer",
        company: "Noser Engineering",
        stack: ["AWS"],
        location: "Noser Engineering AG, Platz 4, 6039 Root D4",
        createdAt: 1700000003000,
        updatedAt: 1700000003000,
        matchScore: 88,
      },
    ];

    const filters = { ...BASE_FILTERS, location: "6039 root d4" };
    const result = filterAndSortAnalyses(analyses, filters, {});
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(10);
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
      {
        id: 3,
        title: "Backend Dev",
        company: "Initech",
        stack: ["Go"],
        location: "Av. de Florissant 41, 1008 Prilly",
        createdAt: 1700000002000,
        updatedAt: 1700000002000,
        matchScore: 70,
      },
    ];

    const options = deriveDynamicOptions(analyses);
    expect(options.locations).toEqual([
      { value: "1008 prilly", label: "1008 Prilly" },
      { value: "berlin", label: "Berlin" },
      { value: "remote (us)", label: "Remote (US)" },
    ]);
  });
});
