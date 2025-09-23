import { describe, test, expect } from "vitest";
import { load } from "cheerio";
import { extractEnhancedMetadata } from "../jobAd/metadata/structuredExtractor";

describe("Structured Metadata Extraction - Essential Tests", () => {
  test("extracts metadata from structured HTML", () => {
    const jobsChHtml = `
      <ul class="job-meta">
        <li data-cy="info-workload">
          <span>Workload:</span>
          <span>60 – 100%</span>
        </li>
        <li data-cy="info-contract">
          <span>Contract type:</span>
          <span>Unlimited employment</span>
        </li>
        <li data-cy="info-language">
          <span>Language:</span>
          <span>German (Fluent), English (Intermediate)</span>
        </li>
        <li data-cy="info-location-link">
          <span>Solothurnerstrasse 235, 4600 Olten</span>
        </li>
      </ul>
    `;

    const $ = load(jobsChHtml);
    const text = $.text();
    const metadata = extractEnhancedMetadata($, jobsChHtml, text);

    expect(metadata.workload).toBe("60 – 100%");
    expect(metadata.duration).toBe("Unlimited");
    expect(metadata.language).toBe("German (Fluent), English (Intermediate)");
    expect(metadata.location).toBe("4600 Olten");
  });

  test("falls back to semantic extraction for non-structured HTML", () => {
    const fallbackHtml = `
      <div>
        <p>Workload: 80%</p>
        <p>Contract type: Permanent</p>
        <p>Language: English (Fluent)</p>
        <p>Location: Zurich, Switzerland</p>
      </div>
    `;
    
    const $ = load(fallbackHtml);
    const text = $.text();
    const metadata = extractEnhancedMetadata($, fallbackHtml, text);

    expect(metadata.workload).toBe("80%");
    expect(metadata.duration).toBe("Permanent");
    expect(metadata.language).toBe("English (Fluent)");
    expect(metadata.location).toBe("Zurich");
  });
});
