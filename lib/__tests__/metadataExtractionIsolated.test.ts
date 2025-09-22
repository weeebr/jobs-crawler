import { describe, expect, it } from "vitest";
import { load } from "cheerio";

import { extractWorkload, extractDuration } from "../jobAd/metadata/workload";
import { extractLanguage } from "../jobAd/metadata/language";
import { extractLocation } from "../jobAd/metadata/location";
import { extractEnhancedMetadata } from "../jobAd/metadata/structuredExtractor";

describe("Metadata Extraction Isolated Tests", () => {
  describe("extractWorkload with empty data", () => {
    it("should return undefined for comma-only values", () => {
      const $ = load(`<div data-field="workload">,</div>`);
      expect(extractWorkload($, "Workload: ,")).toBeUndefined();
    });

    it("should return undefined for empty strings", () => {
      const $ = load(`<div data-field="workload"></div>`);
      expect(extractWorkload($, "Workload: ")).toBeUndefined();
    });

    it("should return undefined for whitespace-only values", () => {
      const $ = load(`<div data-field="workload">   </div>`);
      expect(extractWorkload($, "Workload:   ")).toBeUndefined();
    });

    it("should return undefined for multiple commas", () => {
      const $ = load(`<div data-field="workload">,,,</div>`);
      expect(extractWorkload($, "Workload: ,,,")).toBeUndefined();
    });

    it("should preserve valid workload data", () => {
      const $ = load(`<div data-field="workload">80%</div>`);
      expect(extractWorkload($, "Workload: 80%")).toBe("80%");
    });
  });

  describe("extractDuration with empty data", () => {
    it("should return undefined for comma-only values", () => {
      const $ = load(`<div data-field="duration">,</div>`);
      expect(extractDuration($, "Contract type: ,")).toBeUndefined();
    });

    it("should return undefined for empty strings", () => {
      const $ = load(`<div data-field="duration"></div>`);
      expect(extractDuration($, "Contract type: ")).toBeUndefined();
    });

    it("should preserve valid duration data", () => {
      const $ = load(`<div data-field="duration">Permanent</div>`);
      expect(extractDuration($, "Contract type: Permanent")).toBe("Permanent");
    });
  });

  describe("extractLanguage with empty data", () => {
    it("should return undefined for comma-only values", () => {
      const $ = load(`<div data-field="language">,</div>`);
      expect(extractLanguage($, "Language: ,")).toBeUndefined();
    });

    it("should return undefined for empty strings", () => {
      const $ = load(`<div data-field="language"></div>`);
      expect(extractLanguage($, "Language: ")).toBeUndefined();
    });

    it("should preserve valid language data", () => {
      const $ = load(`<div data-field="language">English</div>`);
      expect(extractLanguage($, "Language: English")).toBe("English");
    });
  });

  describe("extractLocation with empty data", () => {
    it("should return undefined for comma-only values", () => {
      const $ = load(`<div data-field="location">,</div>`);
      expect(extractLocation($, "Location: ,")).toBeUndefined();
    });

    it("should return undefined for empty strings", () => {
      const $ = load(`<div data-field="location"></div>`);
      expect(extractLocation($, "Location: ")).toBeUndefined();
    });

    it("should preserve valid location data", () => {
      const $ = load(`<div data-field="location">Zurich, Switzerland</div>`);
      expect(extractLocation($, "Location: Zurich, Switzerland")).toBe("Zurich, Switzerland");
    });
  });

  describe("extractEnhancedMetadata with empty data", () => {
    it("should return undefined for comma-only values in structured HTML", () => {
      const html = `
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

      const $ = load(html);
      const metadata = extractEnhancedMetadata($, html, $.text());

      expect(metadata.workload).toBeUndefined();
      expect(metadata.duration).toBeUndefined();
      expect(metadata.language).toBeUndefined();
      expect(metadata.location).toBeUndefined();
    });

    it("should preserve valid data while filtering empty values", () => {
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

      expect(metadata.workload).toBe("80%");
      expect(metadata.language).toBe("English");
      expect(metadata.location).toBe("Zurich, Switzerland");
      expect(metadata.duration).toBeUndefined();
    });
  });
});
