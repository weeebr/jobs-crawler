#!/usr/bin/env node

/**
 * Test script to verify duplicate URL prevention works
 */

import { analysisStorage } from './lib/db/analysisStorageConsolidated.ts';

async function testDuplicatePrevention() {
  console.log('🧪 Testing duplicate URL prevention...');

  const testApiKey = 'test-user-' + Date.now();
  const testUrl = 'https://example.com/job/test-duplicate';
  const testRecord = {
    title: 'Test Job Title',
    company: 'Test Company',
    stack: ['JavaScript', 'TypeScript'],
    matchScore: 85,
    reasoning: 'Test reasoning',
    sourceUrl: testUrl,
    qualifications: ['Test qualification'],
    roles: ['Test role'],
    benefits: ['Test benefit']
  };

  try {
    console.log('📝 Inserting first record...');
    const firstRecord = await analysisStorage.save(testApiKey, testRecord);
    console.log(`✅ First record inserted with ID: ${firstRecord.id}`);

    console.log('🔄 Attempting to insert duplicate record...');
    await analysisStorage.save(testApiKey, testRecord);
    console.log('❌ ERROR: Duplicate record was inserted - prevention failed!');
    return false;
  } catch (error) {
    if (error.message.includes('already exists for this user')) {
      console.log('✅ SUCCESS: Duplicate prevention working - got expected error:', error.message);
      return true;
    } else {
      console.log('❌ ERROR: Unexpected error:', error.message);
      return false;
    }
  }
}

async function testExistsByUrl() {
  console.log('\n🧪 Testing existsByUrl method...');

  const testApiKey = 'test-user-exists-' + Date.now();
  const testUrl = 'https://example.com/job/test-exists';

  try {
    console.log('🔍 Checking if URL exists (should be false)...');
    const existsBefore = await analysisStorage.existsByUrl(testApiKey, testUrl);
    if (existsBefore) {
      console.log('❌ ERROR: URL exists before insertion');
      return false;
    }
    console.log('✅ URL correctly does not exist before insertion');

    console.log('📝 Inserting record...');
    const testRecord = {
      title: 'Test Job Title',
      company: 'Test Company',
      stack: ['JavaScript'],
      matchScore: 75,
      reasoning: 'Test reasoning',
      sourceUrl: testUrl,
      qualifications: [],
      roles: [],
      benefits: []
    };
    await analysisStorage.save(testApiKey, testRecord);

    console.log('🔍 Checking if URL exists (should be true)...');
    const existsAfter = await analysisStorage.existsByUrl(testApiKey, testUrl);
    if (!existsAfter) {
      console.log('❌ ERROR: URL does not exist after insertion');
      return false;
    }
    console.log('✅ URL correctly exists after insertion');
    return true;
  } catch (error) {
    console.log('❌ ERROR in existsByUrl test:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting duplicate prevention tests...\n');

  const duplicateTestPassed = await testDuplicatePrevention();
  const existsByUrlTestPassed = await testExistsByUrl();

  console.log('\n📊 Test Results:');
  console.log(`Duplicate Prevention: ${duplicateTestPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`ExistsByUrl Method: ${existsByUrlTestPassed ? '✅ PASS' : '❌ FAIL'}`);

  if (duplicateTestPassed && existsByUrlTestPassed) {
    console.log('\n🎉 All tests passed! Duplicate URL prevention is working correctly.');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

main().catch(console.error);
