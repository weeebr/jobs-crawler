import { NextRequest, NextResponse } from "next/server";
import { runDatabaseTests } from "./test-runner";

interface TestResult {
  testName: string;
  passed: boolean;
  message?: string;
  error?: string;
}

interface DatabaseTestResponse {
  tests: TestResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    duration: number;
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const testResults = await runDatabaseTests();

    const endTime = Date.now();
    const duration = endTime - startTime;

    const passedTests = testResults.filter(t => t.passed).length;
    const failedTests = testResults.length - passedTests;

    const response: DatabaseTestResponse = {
      tests: testResults,
      summary: {
        totalTests: testResults.length,
        passedTests,
        failedTests,
        duration
      }
    };

    const statusCode = failedTests > 0 ? 200 : 200; // Still return 200 even with failures, but could return 207 for partial success

    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    const errorResponse: DatabaseTestResponse = {
      tests: [{
        testName: "Database test execution",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }],
      summary: {
        totalTests: 1,
        passedTests: 0,
        failedTests: 1,
        duration
      }
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}