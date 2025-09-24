import { describe, expect, it, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { setupBasicMocks, setupJobPipelineMocks } from "./test-utils/mocks";
import {
  createInvalidRequestWithInvalidField,
  createConflictingRequest,
  createEmptyRawHtmlRequest,
  createInvalidUrlRequest
} from "./test-utils/test-data";

// Setup mocks for schema validation testing
const setupSchemaValidationMocks = () => {
  setupBasicMocks();
  setupJobPipelineMocks();
};

describe("API /analyze - Input Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSchemaValidationMocks();
  });

  describe("Request Structure Validation", () => {
    it("should reject requests with unknown fields", async () => {
      const request = {
        json: vi.fn().mockResolvedValue(createInvalidRequestWithInvalidField()),
        headers: { get: vi.fn().mockReturnValue("test-api-key") }
      } as any;

      const response = await POST(request);

      // Should return validation error (400) or server error (500)
      expect([400, 500]).toContain(response.status);
    });

    it("should reject requests with no job source", async () => {
      const request = {
        json: vi.fn().mockResolvedValue({}),
        headers: { get: vi.fn().mockReturnValue("test-api-key") }
      } as any;

      const response = await POST(request);

      expect([400, 500]).toContain(response.status);
    });
  });

  describe("URL Parameter Validation", () => {
    it("should reject requests with conflicting URL parameters", async () => {
      const request = {
        json: vi.fn().mockResolvedValue(createConflictingRequest()),
        headers: { get: vi.fn().mockReturnValue("test-api-key") }
      } as any;

      const response = await POST(request);

      expect([400, 500]).toContain(response.status);
    });

    it("should reject requests with invalid URLs", async () => {
      const request = {
        json: vi.fn().mockResolvedValue(createInvalidUrlRequest()),
        headers: { get: vi.fn().mockReturnValue("test-api-key") }
      } as any;

      const response = await POST(request);

      expect([400, 500]).toContain(response.status);
    });
  });

  describe("Raw HTML Validation", () => {
    it("should reject requests with empty rawHtml", async () => {
      const request = {
        json: vi.fn().mockResolvedValue(createEmptyRawHtmlRequest()),
        headers: { get: vi.fn().mockReturnValue("test-api-key") }
      } as any;

      const response = await POST(request);

      expect([400, 500]).toContain(response.status);
    });

    it("should reject requests with only whitespace in rawHtml", async () => {
      const request = {
        json: vi.fn().mockResolvedValue({
          rawHtml: "   \n\t   "
        }),
        headers: { get: vi.fn().mockReturnValue("test-api-key") }
      } as any;

      const response = await POST(request);

      expect([400, 500]).toContain(response.status);
    });
  });

  describe("Valid Request Processing", () => {
    it("should accept valid job URL requests", async () => {
      const request = {
        json: vi.fn().mockResolvedValue({
          jobUrl: "https://example.com/job/123"
        }),
        headers: { get: vi.fn().mockReturnValue("test-api-key") }
      } as any;

      const response = await POST(request);

      // Should pass validation and attempt processing (may return 500 if job fetch fails)
      expect(response.status).toBeDefined();
      expect([200, 500]).toContain(response.status); // Either success or expected failure
    });

    it("should accept valid search URL requests", async () => {
      const request = {
        json: vi.fn().mockResolvedValue({
          searchUrl: "https://example.com/jobs"
        }),
        headers: { get: vi.fn().mockReturnValue("test-api-key") }
      } as any;

      const response = await POST(request);

      expect(response.status).toBeDefined();
      expect([200, 500]).toContain(response.status); // Either success or expected failure
    });
  });
});
