import { describe, expect, it } from "vitest";
import { load } from "cheerio";

import { extractWorkload, extractDuration } from "../jobAd/metadata/workload";
import { extractLanguage } from "../jobAd/metadata/language";
import { extractLocation } from "../jobAd/metadata/location";
import { extractEnhancedMetadata } from "../jobAd/metadata/structuredExtractor";

describe("Metadata Extraction - Essential Tests", () => {
  it("should filter out empty data and preserve valid data", () => {
    const html = `
      <ul class="job-meta">
        <li data-cy="info-workload">
          <span>Workload:</span>
          <span>80%</span>
        </li>
        <li data-cy="info-contract">
          <span>Contract type:</span>
          <span>,</span>
        </li>
        <li data-cy="info-language">
          <span>Language:</span>
          <span>English</span>
        </li>
        <li data-cy="info-location-link">
          <span>Zurich, Switzerland</span>
        </li>
      </ul>
    `;

    const $ = load(html);
    const metadata = extractEnhancedMetadata($, html, $.text());

    // Should preserve valid data
    expect(metadata.workload).toBe("80%");
    expect(metadata.language).toBe("English");
    expect(metadata.location).toBe("Zurich");
    
    // Should filter out empty data
    expect(metadata.duration).toBeUndefined();
  });

  it("should handle individual extractors with empty data", () => {
    const $ = load(`<div data-field="workload">,</div>`);
    
    // Test empty data filtering
    expect(extractWorkload($, "Workload: ,")).toBeUndefined();
    expect(extractDuration($, "Contract type: ,")).toBeUndefined();
    expect(extractLanguage($, "Language: ,")).toBeUndefined();
    expect(extractLocation($, "Location: ,")).toBeUndefined();
    
    // Test valid data preservation
    expect(extractWorkload($, "Workload: 80%")).toBe("80%");
    expect(extractDuration($, "Contract type: Permanent")).toBe("Permanent");
    expect(extractLanguage($, "Language: English")).toBe("English");
    expect(extractLocation($, "Location: Zurich, Switzerland")).toBe("Zurich");
  });
});
