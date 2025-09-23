import { describe, expect, it } from "vitest";

import { normalizeLocationLabel } from "@/lib/jobAd/metadata/locationUtils";

describe("normalizeLocationLabel", () => {
  it("strips street while keeping postal code and city", () => {
    expect(normalizeLocationLabel("Solothurnerstrasse 235, 4600 Olten")).toBe("4600 Olten");
  });

  it("falls back to city when postal code missing", () => {
    expect(normalizeLocationLabel("Zurich, Switzerland")).toBe("Zurich");
  });

  it("preserves remote descriptors", () => {
    expect(normalizeLocationLabel("Remote (US)")).toBe("Remote (US)");
  });

  it("picks postal segment when company and street precede it", () => {
    expect(normalizeLocationLabel("Noser Engineering AG, Platz 4, 6039 Root D4"))
      .toBe("6039 Root D4");
  });
});
