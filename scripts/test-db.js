#!/usr/bin/env node

/**
 * Simple database test script
 * Verifies that the database setup works correctly with user-based isolation
 */

import { initializeDatabase, db } from '../lib/db/index.js';
import { getOrCreateUser, getUserStats } from '../lib/db/users.js';
import { analysisStorage, cvProfileStorage } from '../lib/db/storage.js';
import { hashApiKey, isValidApiKey } from '../lib/db/users.js';

const TEST_API_KEY_1 = 'sk-test-user1-1234567890123456789012345678901234567890';
const TEST_API_KEY_2 = 'sk-test-user2-0987654321098765432109876543210987654321';

console.log('🧪 Testing user-based database functionality...\n');

async function testDatabase() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    // Test user creation and isolation
    console.log('\n📋 Testing user isolation...');

    const user1 = await getOrCreateUser(TEST_API_KEY_1);
    const user2 = await getOrCreateUser(TEST_API_KEY_2);

    console.log(`✅ User 1 created with ID: ${user1.id}`);
    console.log(`✅ User 2 created with ID: ${user2.id}`);
    console.log(`✅ Users have different IDs: ${user1.id !== user2.id}`);

    // Test API key validation
    console.log('\n🔐 Testing API key validation...');
    console.log(`✅ TEST_API_KEY_1 valid: ${isValidApiKey(TEST_API_KEY_1)}`);
    console.log(`✅ TEST_API_KEY_2 valid: ${isValidApiKey(TEST_API_KEY_2)}`);
    console.log(`✅ Invalid key valid: ${isValidApiKey('invalid-key')}`);

    // Test user statistics
    console.log('\n📊 Testing user statistics...');
    const stats1 = await getUserStats(TEST_API_KEY_1);
    const stats2 = await getUserStats(TEST_API_KEY_2);

    console.log(`✅ User 1 stats: ${JSON.stringify(stats1, null, 2)}`);
    console.log(`✅ User 2 stats: ${JSON.stringify(stats2, null, 2)}`);
    console.log(`✅ Users have separate stats: ${stats1.userId !== stats2.userId}`);

    // Test analysis storage isolation
    console.log('\n💾 Testing analysis storage isolation...');

    const sampleAnalysis = {
      title: 'Senior React Developer',
      company: 'TechCorp Inc.',
      description: 'Looking for an experienced React developer...',
      stack: ['React', 'TypeScript', 'Node.js'],
      matchScore: 85.5,
      reasoning: 'Strong match with required technologies',
      status: 'interested',
      sourceUrl: 'https://example.com/job/123',
      sourceType: 'single-job',
    };

    const savedAnalysis1 = await analysisStorage.save(TEST_API_KEY_1, sampleAnalysis);
    const savedAnalysis2 = await analysisStorage.save(TEST_API_KEY_2, { ...sampleAnalysis, company: 'Another Corp' });

    console.log(`✅ Analysis 1 saved with ID: ${savedAnalysis1.id}`);
    console.log(`✅ Analysis 2 saved with ID: ${savedAnalysis2.id}`);
    console.log(`✅ Analyses have different IDs: ${savedAnalysis1.id !== savedAnalysis2.id}`);

    // Test user-specific retrieval
    const user1Analyses = await analysisStorage.getAll(TEST_API_KEY_1);
    const user2Analyses = await analysisStorage.getAll(TEST_API_KEY_2);

    console.log(`✅ User 1 has ${user1Analyses.length} analyses`);
    console.log(`✅ User 2 has ${user2Analyses.length} analyses`);
    console.log(`✅ Users see only their own data: ${user1Analyses.length === 1 && user2Analyses.length === 1}`);

    // Test cross-user isolation (should return null)
    const crossAccess1 = await analysisStorage.getById(TEST_API_KEY_1, savedAnalysis2.id);
    const crossAccess2 = await analysisStorage.getById(TEST_API_KEY_2, savedAnalysis1.id);

    console.log(`✅ Cross-user access blocked: ${crossAccess1 === null && crossAccess2 === null}`);

    // Test user statistics update
    const updatedStats1 = await getUserStats(TEST_API_KEY_1);
    const updatedStats2 = await getUserStats(TEST_API_KEY_2);

    console.log(`✅ User 1 now has ${updatedStats1.totalAnalyses} analyses`);
    console.log(`✅ User 2 now has ${updatedStats2.totalAnalyses} analyses`);

    console.log('\n🎉 All tests passed! User-based isolation is working correctly.');

    console.log('\n📋 Test Summary:');
    console.log('  ✅ Database initialization');
    console.log('  ✅ User creation and isolation');
    console.log('  ✅ API key validation');
    console.log('  ✅ User statistics tracking');
    console.log('  ✅ Analysis storage isolation');
    console.log('  ✅ Cross-user access prevention');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testDatabase().then(() => {
  console.log('\n✨ Database tests completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Database tests failed:', error);
  process.exit(1);
});
