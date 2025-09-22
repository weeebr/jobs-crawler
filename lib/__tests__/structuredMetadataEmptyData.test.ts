import { describe, expect, it } from "vitest";
import { load } from "cheerio";

import { extractEnhancedMetadata } from "../jobAd/metadata/structuredExtractor";

describe("Structured Metadata Empty Data Prevention", () => {
  it("should filter out comma-only values from all structured fields", () => {
    const htmlWithCommaData = `
      <ul class="job-meta">
        <li data-cy="info-workload">
          <span>Workload:</span>
          <span>,</span>
        </li>
        <li data-cy="info-contract">
          <span>Contract type:</span>
          <span>,</span>
        </li>
        <li data-cy="info-language">
          <span>Language:</span>
          <span>,</span>
        </li>
        <li data-cy="info-location-link">
          <span>,</span>
        </li>
      </ul>
    `;

    const $ = load(htmlWithCommaData);
    const metadata = extractEnhancedMetadata($, htmlWithCommaData, $.text());

    expect(metadata.workload).toBeUndefined();
    expect(metadata.duration).toBeUndefined();
    expect(metadata.language).toBeUndefined();
    expect(metadata.location).toBeUndefined();
  });

  it("should filter out empty strings and whitespace", () => {
    const htmlWithEmptyData = `
      <ul class="job-meta">
        <li data-cy="info-workload">
          <span>Workload:</span>
          <span></span>
        </li>
        <li data-cy="info-contract">
          <span>Contract type:</span>
          <span>   </span>
        </li>
        <li data-cy="info-language">
          <span>Language:</span>
          <span>\t\n</span>
        </li>
      </ul>
    `;

    const $ = load(htmlWithEmptyData);
    const metadata = extractEnhancedMetadata($, htmlWithEmptyData, $.text());

    expect(metadata.workload).toBeUndefined();
    expect(metadata.duration).toBeUndefined();
    expect(metadata.language).toBeUndefined();
  });

  it("should preserve valid data while filtering empty values", () => {
    const htmlWithMixedData = `
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

    const $ = load(htmlWithMixedData);
    const metadata = extractEnhancedMetadata($, htmlWithMixedData, $.text());

    expect(metadata.workload).toBe("80%");
    expect(metadata.language).toBe("English");
    expect(metadata.location).toBe("Zurich, Switzerland");
    expect(metadata.duration).toBeUndefined();
  });

  it("should handle multiple consecutive commas", () => {
    const htmlWithMultipleCommas = `
      <ul class="job-meta">
        <li data-cy="info-workload">
          <span>Workload:</span>
          <span>,,,</span>
        </li>
        <li data-cy="info-contract">
          <span>Contract type:</span>
          <span>,,</span>
        </li>
      </ul>
    `;

    const $ = load(htmlWithMultipleCommas);
    const metadata = extractEnhancedMetadata($, htmlWithMultipleCommas, $.text());

    expect(metadata.workload).toBeUndefined();
    expect(metadata.duration).toBeUndefined();
  });
});
