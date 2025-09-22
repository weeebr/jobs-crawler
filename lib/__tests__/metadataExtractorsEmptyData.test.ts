import { describe, expect, it } from "vitest";
import { load } from "cheerio";

import { extractWorkload, extractDuration } from "../jobAd/metadata/workload";
import { extractLanguage } from "../jobAd/metadata/language";
import { extractLocation } from "../jobAd/metadata/location";

describe("Metadata Extractors Empty Data Prevention", () => {
  describe("extractWorkload", () => {
    it("should filter out comma-only values", () => {
      const $ = load(`<div data-field="workload">,</div>`);
      expect(extractWorkload($, "Workload: ,")).toBeUndefined();
    });

    it("should filter out empty strings and whitespace", () => {
      const $ = load(`<div data-field="workload"></div>`);
      expect(extractWorkload($, "Workload: ")).toBeUndefined();
      expect(extractWorkload($, "Workload:   ")).toBeUndefined();
    });

    it("should preserve valid workload data", () => {
      const $ = load(`<div data-field="workload">80%</div>`);
      expect(extractWorkload($, "Workload: 80%")).toBe("80%");
    });
  });

  describe("extractDuration", () => {
    it("should filter out comma-only values", () => {
      const $ = load(`<div data-field="duration">,</div>`);
      expect(extractDuration($, "Contract type: ,")).toBeUndefined();
    });

    it("should filter out empty strings and whitespace", () => {
      const $ = load(`<div data-field="duration"></div>`);
      expect(extractDuration($, "Contract type: ")).toBeUndefined();
    });

    it("should preserve valid duration data", () => {
      const $ = load(`<div data-field="duration">Permanent</div>`);
      expect(extractDuration($, "Contract type: Permanent")).toBe("Permanent");
    });
  });

  describe("extractLanguage", () => {
    it("should filter out comma-only values", () => {
      const $ = load(`<div data-field="language">,</div>`);
      expect(extractLanguage($, "Language: ,")).toBeUndefined();
    });

    it("should filter out empty strings and whitespace", () => {
      const $ = load(`<div data-field="language"></div>`);
      expect(extractLanguage($, "Language: ")).toBeUndefined();
    });

    it("should preserve valid language data", () => {
      const $ = load(`<div data-field="language">English</div>`);
      expect(extractLanguage($, "Language: English")).toBe("English");
    });

    it("should handle multiple languages with commas", () => {
      const $ = load(`<div data-field="language">English, German</div>`);
      expect(extractLanguage($, "Language: English, German")).toBe("English, German");
    });
  });

  describe("extractLocation", () => {
    it("should filter out comma-only values", () => {
      const $ = load(`<div data-field="location">,</div>`);
      expect(extractLocation($, "Location: ,")).toBeUndefined();
    });

    it("should filter out empty strings and whitespace", () => {
      const $ = load(`<div data-field="location"></div>`);
      expect(extractLocation($, "Location: ")).toBeUndefined();
    });

    it("should preserve valid location data", () => {
      const $ = load(`<div data-field="location">Zurich, Switzerland</div>`);
      expect(extractLocation($, "Location: Zurich, Switzerland")).toBe("Zurich, Switzerland");
    });
  });
});
