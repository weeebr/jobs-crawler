/**
 * @fileoverview Legacy 2-stage workflow tests - refactored to use modular structure
 * This file maintains backward compatibility while delegating to the new modular test structure
 */

import { describe } from "vitest";

// Import modular test suites
import "./workflow/workflowIntegration.test";
import "./workflow/errorHandling.test";

describe("2-Stage Fetching Workflow - Legacy Integration", () => {
  // This describe block maintains the original test suite structure
  // while delegating to the modular test files above
  // All tests are now organized in:
  // - workflowIntegration.test.ts: Core workflow functionality
  // - errorHandling.test.ts: Error scenarios and edge cases
});
