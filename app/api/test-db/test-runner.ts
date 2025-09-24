import { initializeDatabase } from "@/lib/db/index";
import {
  runUserCreationTests,
  runApiKeyValidationTests,
  runUserStatisticsTests,
  runUserStatisticsUpdateTests
} from "./user-tests";
import { runAnalysisStorageTests } from "./analysis-storage-tests";

interface TestResult {
  testName: string;
  passed: boolean;
  message?: string;
  error?: string;
}

export async function runDatabaseTests(): Promise<TestResult[]> {
  // Initialize database
  await initializeDatabase();

  const testResults: TestResult[] = [];

  // Test database initialization
  testResults.push({
    testName: "Database initialization",
    passed: true,
    message: "Database initialized successfully"
  });

  // Test user creation and isolation
  await runUserCreationTests(testResults);

  // Test API key validation
  await runApiKeyValidationTests(testResults);

  // Test user statistics
  await runUserStatisticsTests(testResults);

  // Test analysis storage isolation
  await runAnalysisStorageTests(testResults);

  // Test user statistics update
  await runUserStatisticsUpdateTests(testResults);

  return testResults;
}
