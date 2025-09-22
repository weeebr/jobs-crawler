import { describe, expect, it } from "vitest";

import { filterEmptyValue } from "../jobAd/metadata/filterUtils";

describe("filterEmptyValue", () => {
  it("should filter out undefined and null values", () => {
    expect(filterEmptyValue(undefined)).toBeUndefined();
    expect(filterEmptyValue(null as any)).toBeUndefined();
  });

  it("should filter out empty strings and whitespace", () => {
    expect(filterEmptyValue("")).toBeUndefined();
    expect(filterEmptyValue("   ")).toBeUndefined();
    expect(filterEmptyValue("\t\n")).toBeUndefined();
    expect(filterEmptyValue("\r\n")).toBeUndefined();
  });

  it("should filter out comma-only values", () => {
    expect(filterEmptyValue(",")).toBeUndefined();
    expect(filterEmptyValue(",,,")).toBeUndefined();
    expect(filterEmptyValue(" , ")).toBeUndefined();
    expect(filterEmptyValue("  ,  ")).toBeUndefined();
  });

  it("should filter out values that are just commas with whitespace", () => {
    expect(filterEmptyValue(" , ")).toBeUndefined();
    expect(filterEmptyValue("  ,  ")).toBeUndefined();
    expect(filterEmptyValue("\t, \n")).toBeUndefined();
  });

  it("should filter out label-only values", () => {
    expect(filterEmptyValue("Location:")).toBeUndefined();
    expect(filterEmptyValue("Workload:")).toBeUndefined();
    expect(filterEmptyValue("Language:")).toBeUndefined();
    expect(filterEmptyValue("Duration:")).toBeUndefined();
    expect(filterEmptyValue("Contract:")).toBeUndefined();
    expect(filterEmptyValue("Team:")).toBeUndefined();
    expect(filterEmptyValue("Salary:")).toBeUndefined();
    expect(filterEmptyValue("Published:")).toBeUndefined();
  });

  it("should filter out values that end with just a colon", () => {
    expect(filterEmptyValue("Some text:")).toBeUndefined();
    expect(filterEmptyValue("Another label: ")).toBeUndefined();
  });

  it("should preserve valid data", () => {
    expect(filterEmptyValue("Zurich, Switzerland")).toBe("Zurich, Switzerland");
    expect(filterEmptyValue("80%")).toBe("80%");
    expect(filterEmptyValue("English, German")).toBe("English, German");
    expect(filterEmptyValue("Permanent")).toBe("Permanent");
    expect(filterEmptyValue("Software Engineer")).toBe("Software Engineer");
  });

  it("should preserve valid data with labels", () => {
    expect(filterEmptyValue("Location: Zurich, Switzerland")).toBe("Location: Zurich, Switzerland");
    expect(filterEmptyValue("Workload: 80%")).toBe("Workload: 80%");
    expect(filterEmptyValue("Language: English, German")).toBe("Language: English, German");
  });

  it("should handle edge cases", () => {
    expect(filterEmptyValue("A")).toBe("A");
    expect(filterEmptyValue("123")).toBe("123");
    expect(filterEmptyValue("Valid data with commas, and more")).toBe("Valid data with commas, and more");
  });
});
