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

  it("handles compact postal formats", () => {
    expect(normalizeLocationLabel("CH-8005 Zürich"))
      .toBe("8005 Zürich");
  });
});
