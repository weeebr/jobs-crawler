import { getOrCreateUser, getUserStats, isValidApiKey } from "@/lib/db/users";
import { TEST_API_KEY_1, TEST_API_KEY_2 } from "./test-data";

interface TestResult {
  testName: string;
  passed: boolean;
  message?: string;
  error?: string;
}

export async function runUserCreationTests(testResults: TestResult[]): Promise<void> {
  try {
    const user1 = await getOrCreateUser(TEST_API_KEY_1);
    const user2 = await getOrCreateUser(TEST_API_KEY_2);

    testResults.push({
      testName: "User creation and isolation",
      passed: user1.id !== user2.id,
      message: `User 1 ID: ${user1.id}, User 2 ID: ${user2.id}`
    });
  } catch (error) {
    testResults.push({
      testName: "User creation and isolation",
      passed: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export async function runApiKeyValidationTests(testResults: TestResult[]): Promise<void> {
  try {
    const test1Valid = isValidApiKey(TEST_API_KEY_1);
    const test2Valid = isValidApiKey(TEST_API_KEY_2);
    const invalidValid = isValidApiKey('invalid-key');

    testResults.push({
      testName: "API key validation",
      passed: test1Valid && test2Valid && !invalidValid,
      message: `TEST_API_KEY_1: ${test1Valid}, TEST_API_KEY_2: ${test2Valid}, Invalid: ${invalidValid}`
    });
  } catch (error) {
    testResults.push({
      testName: "API key validation",
      passed: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export async function runUserStatisticsTests(testResults: TestResult[]): Promise<void> {
  try {
    const stats1 = await getUserStats(TEST_API_KEY_1);
    const stats2 = await getUserStats(TEST_API_KEY_2);

    testResults.push({
      testName: "User statistics tracking",
      passed: stats1 !== null && stats2 !== null && stats1.userId !== stats2.userId,
      message: `User 1 stats: ${JSON.stringify(stats1 ?? {})}, User 2 stats: ${JSON.stringify(stats2 ?? {})}`
    });
  } catch (error) {
    testResults.push({
      testName: "User statistics tracking",
      passed: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export async function runUserStatisticsUpdateTests(testResults: TestResult[]): Promise<void> {
  try {
    const updatedStats1 = await getUserStats(TEST_API_KEY_1);
    const updatedStats2 = await getUserStats(TEST_API_KEY_2);

    testResults.push({
      testName: "User statistics update",
      passed: updatedStats1 !== null && updatedStats2 !== null && (updatedStats1.totalAnalyses || 0) >= 1 && (updatedStats2.totalAnalyses || 0) >= 1,
      message: `User 1 now has ${updatedStats1?.totalAnalyses || 0} analyses, User 2 now has ${updatedStats2?.totalAnalyses || 0} analyses`
    });
  } catch (error) {
    testResults.push({
      testName: "User statistics update",
      passed: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
