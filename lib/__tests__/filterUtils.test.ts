import { describe, expect, it } from "vitest";
import { filterEmptyValue, filterDisplayValue } from "../jobAd/metadata/filterUtils";

describe("Filter Utils", () => {
  describe("filterEmptyValue", () => {
    it("should filter out comma-only values", () => {
      expect(filterEmptyValue(",")).toBeUndefined();
      expect(filterEmptyValue(" , ")).toBeUndefined();
      expect(filterEmptyValue(",,,")).toBeUndefined();
      expect(filterEmptyValue(" , , ")).toBeUndefined();
    });

    it("should filter out empty strings and whitespace", () => {
      expect(filterEmptyValue("")).toBeUndefined();
      expect(filterEmptyValue("   ")).toBeUndefined();
      expect(filterEmptyValue("\t\n")).toBeUndefined();
    });

    it("should filter out label-only values", () => {
      expect(filterEmptyValue("Location:")).toBeUndefined();
      expect(filterEmptyValue("Workload:")).toBeUndefined();
      expect(filterEmptyValue("Language:")).toBeUndefined();
      expect(filterEmptyValue("Duration:")).toBeUndefined();
      expect(filterEmptyValue("Contract:")).toBeUndefined();
    });

    it("should filter out values ending with colon and whitespace", () => {
      expect(filterEmptyValue("Location: ")).toBeUndefined();
      expect(filterEmptyValue("Workload:   ")).toBeUndefined();
      expect(filterEmptyValue("Language:\t")).toBeUndefined();
    });

    it("should filter out values ending with colon and comma", () => {
      expect(filterEmptyValue("Location:,")).toBeUndefined();
      expect(filterEmptyValue("Workload: ,")).toBeUndefined();
      expect(filterEmptyValue("Language: , ")).toBeUndefined();
    });

    it("should filter out punctuation-only values", () => {
      expect(filterEmptyValue("!")).toBeUndefined();
      expect(filterEmptyValue("?")).toBeUndefined();
      expect(filterEmptyValue(".")).toBeUndefined();
      expect(filterEmptyValue(";")).toBeUndefined();
      expect(filterEmptyValue(":")).toBeUndefined();
      expect(filterEmptyValue("-")).toBeUndefined();
      // Note: "_" is preserved as it's valid in many contexts (variable names, tech stack)
    });

    it("should filter out number-only values with commas", () => {
      expect(filterEmptyValue("1,2,3")).toBeUndefined();
      expect(filterEmptyValue("1,2")).toBeUndefined();
      expect(filterEmptyValue("123,456")).toBeUndefined();
    });

    it("should filter out values starting or ending with comma", () => {
      expect(filterEmptyValue(",value")).toBeUndefined();
      expect(filterEmptyValue("value,")).toBeUndefined();
      expect(filterEmptyValue(",value,")).toBeUndefined();
    });

    it("should preserve valid values", () => {
      expect(filterEmptyValue("80%")).toBe("80%");
      expect(filterEmptyValue("Permanent")).toBe("Permanent");
      expect(filterEmptyValue("English, German")).toBe("English, German");
      expect(filterEmptyValue("Zurich, Switzerland")).toBe("Zurich, Switzerland");
      expect(filterEmptyValue("Full-time")).toBe("Full-time");
      expect(filterEmptyValue("Remote")).toBe("Remote");
    });

    it("should preserve valid values with numbers", () => {
      expect(filterEmptyValue("100%")).toBe("100%");
      expect(filterEmptyValue("5 years")).toBe("5 years");
      expect(filterEmptyValue("2-3 years")).toBe("2-3 years");
    });
  });

  describe("filterDisplayValue", () => {
    it("should filter out values that are too short", () => {
      expect(filterDisplayValue("a")).toBeUndefined();
      expect(filterDisplayValue("x")).toBeUndefined();
      // Note: Single numbers like "1" are preserved as they can be valid (e.g., team size)
    });

    it("should preserve single character percentages", () => {
      expect(filterDisplayValue("5%")).toBe("5%");
      expect(filterDisplayValue("100%")).toBe("100%");
    });

    it("should filter out common artifacts", () => {
      expect(filterDisplayValue("n/a")).toBeUndefined();
      expect(filterDisplayValue("N/A")).toBeUndefined();
      expect(filterDisplayValue("na")).toBeUndefined();
      expect(filterDisplayValue("tbd")).toBeUndefined();
      expect(filterDisplayValue("tba")).toBeUndefined();
      expect(filterDisplayValue("null")).toBeUndefined();
      expect(filterDisplayValue("undefined")).toBeUndefined();
      expect(filterDisplayValue("none")).toBeUndefined();
      expect(filterDisplayValue("not specified")).toBeUndefined();
      expect(filterDisplayValue("not available")).toBeUndefined();
      expect(filterDisplayValue("not provided")).toBeUndefined();
      expect(filterDisplayValue("unknown")).toBeUndefined();
      expect(filterDisplayValue("unclear")).toBeUndefined();
      expect(filterDisplayValue("not mentioned")).toBeUndefined();
      expect(filterDisplayValue("not stated")).toBeUndefined();
    });

    it("should preserve valid display values", () => {
      expect(filterDisplayValue("80%")).toBe("80%");
      expect(filterDisplayValue("Permanent")).toBe("Permanent");
      expect(filterDisplayValue("Full-time")).toBe("Full-time");
      expect(filterDisplayValue("Remote")).toBe("Remote");
      expect(filterDisplayValue("English, German")).toBe("English, German");
      expect(filterDisplayValue("Zurich, Switzerland")).toBe("Zurich, Switzerland");
    });

    it("should inherit all filterEmptyValue behavior", () => {
      expect(filterDisplayValue(",")).toBeUndefined();
      expect(filterDisplayValue("Location:")).toBeUndefined();
      expect(filterDisplayValue("!")).toBeUndefined();
      expect(filterDisplayValue("1,2,3")).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle undefined and null values", () => {
      expect(filterEmptyValue(undefined)).toBeUndefined();
      expect(filterDisplayValue(undefined)).toBeUndefined();
    });

    it("should handle mixed whitespace and punctuation", () => {
      expect(filterEmptyValue(" , , ")).toBeUndefined();
      expect(filterEmptyValue("\t,\n")).toBeUndefined();
      expect(filterEmptyValue(" : ")).toBeUndefined();
    });

    it("should handle values with legitimate commas", () => {
      expect(filterEmptyValue("English, German, French")).toBe("English, German, French");
      expect(filterEmptyValue("Zurich, Switzerland")).toBe("Zurich, Switzerland");
      expect(filterEmptyValue("Full-time, Remote")).toBe("Full-time, Remote");
    });

    it("should handle values with legitimate punctuation", () => {
      expect(filterEmptyValue("C++")).toBe("C++");
      expect(filterEmptyValue("C#")).toBe("C#");
      expect(filterEmptyValue("F#")).toBe("F#");
      expect(filterEmptyValue("ASP.NET")).toBe("ASP.NET");
    });
  });
});