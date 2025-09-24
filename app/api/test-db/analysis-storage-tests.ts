import { analysisStorage } from "@/lib/db/storage";
import { TEST_API_KEY_1, TEST_API_KEY_2, createSampleAnalysis } from "./test-data";

interface TestResult {
  testName: string;
  passed: boolean;
  message?: string;
  error?: string;
}

export async function runAnalysisStorageTests(testResults: TestResult[]): Promise<void> {
  try {
    const sampleJob = {
      title: 'Senior React Developer',
      company: 'TechCorp Inc.',
      stack: ['React', 'TypeScript', 'Node.js'],
      roles: ['Senior Developer'],
      qualifications: ['5+ years React experience'],
      benefits: ['Health insurance', 'Remote work'],
      description: 'Looking for an experienced React developer...',
      fetchedAt: Date.now(),
      sourceUrl: 'https://example.com/job/123',
      sourceDomain: 'example.com',
      sourceType: 'single-job' as const,
    };

    const sampleAnalysis = createSampleAnalysis(sampleJob);

    const savedAnalysis1 = await analysisStorage.save(TEST_API_KEY_1, sampleAnalysis);
    const sampleAnalysis2 = {
      ...sampleAnalysis,
      id: Date.now() + 1,
      company: 'Another Corp',
      title: 'Senior Frontend Developer',
    };
    const savedAnalysis2 = await analysisStorage.save(TEST_API_KEY_2, sampleAnalysis2);

    const user1Analyses = await analysisStorage.getAll(TEST_API_KEY_1);
    const user2Analyses = await analysisStorage.getAll(TEST_API_KEY_2);

    // Test cross-user access prevention
    const crossAccess1 = await analysisStorage.getById(TEST_API_KEY_1, savedAnalysis2.id);
    const crossAccess2 = await analysisStorage.getById(TEST_API_KEY_2, savedAnalysis1.id);

    const isolationTestPassed =
      savedAnalysis1.id !== savedAnalysis2.id &&
      user1Analyses.length === 1 &&
      user2Analyses.length === 1 &&
      crossAccess1 === null &&
      crossAccess2 === null;

    testResults.push({
      testName: "Analysis storage isolation",
      passed: isolationTestPassed,
      message: `Analysis 1 ID: ${savedAnalysis1.id}, Analysis 2 ID: ${savedAnalysis2.id}, Cross-access blocked: ${crossAccess1 === null && crossAccess2 === null}`
    });
  } catch (error) {
    testResults.push({
      testName: "Analysis storage isolation",
      passed: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
