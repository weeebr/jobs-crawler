import { describe, expect, it } from "vitest";
import { filterDisplayValue } from "../jobAd/metadata/filterUtils";

describe("Dashboard Card Filtering", () => {
  describe("metadata filtering for dashboard display", () => {
    it("should filter out comma-only values from workload", () => {
      expect(filterDisplayValue(",")).toBeUndefined();
      expect(filterDisplayValue(" , ")).toBeUndefined();
      expect(filterDisplayValue(",,,")).toBeUndefined();
    });

    it("should filter out comma-only values from duration", () => {
      expect(filterDisplayValue(",")).toBeUndefined();
      expect(filterDisplayValue(" , ")).toBeUndefined();
      expect(filterDisplayValue(",,,")).toBeUndefined();
    });

    it("should filter out comma-only values from size", () => {
      expect(filterDisplayValue(",")).toBeUndefined();
      expect(filterDisplayValue(" , ")).toBeUndefined();
      expect(filterDisplayValue(",,,")).toBeUndefined();
    });

    it("should preserve valid workload values", () => {
      expect(filterDisplayValue("80%")).toBe("80%");
      expect(filterDisplayValue("100%")).toBe("100%");
      expect(filterDisplayValue("Full-time")).toBe("Full-time");
      expect(filterDisplayValue("Part-time")).toBe("Part-time");
    });

    it("should preserve valid duration values", () => {
      expect(filterDisplayValue("Permanent")).toBe("Permanent");
      expect(filterDisplayValue("Contract")).toBe("Contract");
      expect(filterDisplayValue("Temporary")).toBe("Temporary");
      expect(filterDisplayValue("6 months")).toBe("6 months");
    });

    it("should preserve valid size values", () => {
      expect(filterDisplayValue("5")).toBe("5");
      expect(filterDisplayValue("10")).toBe("10");
      expect(filterDisplayValue("50")).toBe("50");
      expect(filterDisplayValue("100")).toBe("100");
      expect(filterDisplayValue("500")).toBe("500");
    });

    it("should filter out parsing artifacts", () => {
      expect(filterDisplayValue("n/a")).toBeUndefined();
      expect(filterDisplayValue("not specified")).toBeUndefined();
      expect(filterDisplayValue("unknown")).toBeUndefined();
      expect(filterDisplayValue("tbd")).toBeUndefined();
    });

    it("should filter out label-only values", () => {
      expect(filterDisplayValue("Workload:")).toBeUndefined();
      expect(filterDisplayValue("Duration:")).toBeUndefined();
      expect(filterDisplayValue("Size:")).toBeUndefined();
    });

    it("should filter out values that are too short", () => {
      expect(filterDisplayValue("a")).toBeUndefined();
      expect(filterDisplayValue("x")).toBeUndefined();
      // Note: Single numbers like "1" are preserved as they can be valid (e.g., team size)
    });

    it("should preserve single character percentages", () => {
      expect(filterDisplayValue("5%")).toBe("5%");
      expect(filterDisplayValue("100%")).toBe("100%");
    });
  });

  describe("dashboard card metadata items array filtering", () => {
    it("should create empty array when all values are invalid", () => {
      const metadataItems = [
        { value: filterDisplayValue(",") },
        { value: filterDisplayValue(" , ") },
        { value: filterDisplayValue("n/a") },
      ].filter(item => item.value);
      
      expect(metadataItems).toEqual([]);
    });

    it("should create array with only valid values", () => {
      const metadataItems = [
        { value: filterDisplayValue("80%") },
        { value: filterDisplayValue(",") },
        { value: filterDisplayValue("Permanent") },
        { value: filterDisplayValue("n/a") },
        { value: filterDisplayValue("100") },
      ].filter(item => item.value);
      
      expect(metadataItems).toEqual([
        { value: "80%" },
        { value: "Permanent" },
        { value: "100" },
      ]);
    });

    it("should handle mixed valid and invalid values", () => {
      const metadataItems = [
        { value: filterDisplayValue("80%") },
        { value: filterDisplayValue(undefined) },
        { value: filterDisplayValue("Permanent") },
        { value: filterDisplayValue("") },
        { value: filterDisplayValue("100") },
      ].filter(item => item.value);
      
      expect(metadataItems).toEqual([
        { value: "80%" },
        { value: "Permanent" },
        { value: "100" },
      ]);
    });
  });

  describe("real-world scenarios", () => {
    it("should handle job posting with comma artifacts", () => {
      const workload = filterDisplayValue(",");
      const duration = filterDisplayValue("Permanent");
      const size = filterDisplayValue("100");
      
      expect(workload).toBeUndefined();
      expect(duration).toBe("Permanent");
      expect(size).toBe("100");
    });

    it("should handle job posting with label artifacts", () => {
      const workload = filterDisplayValue("Workload:");
      const duration = filterDisplayValue("Duration:");
      const size = filterDisplayValue("Size:");
      
      expect(workload).toBeUndefined();
      expect(duration).toBeUndefined();
      expect(size).toBeUndefined();
    });

    it("should handle job posting with valid data", () => {
      const workload = filterDisplayValue("80%");
      const duration = filterDisplayValue("Permanent");
      const size = filterDisplayValue("50");
      
      expect(workload).toBe("80%");
      expect(duration).toBe("Permanent");
      expect(size).toBe("50");
    });

    it("should handle job posting with mixed data quality", () => {
      const workload = filterDisplayValue("80%");
      const duration = filterDisplayValue(",");
      const size = filterDisplayValue("n/a");
      
      expect(workload).toBe("80%");
      expect(duration).toBeUndefined();
      expect(size).toBeUndefined();
    });
  });
});
