#!/usr/bin/env node

/**
 * Simple Database Schema Sync
 *
 * Syncs database schema between local SQLite and hosted PostgreSQL
 */

import { execSync } from "child_process";

const direction = process.argv[2];

console.log('🔄 Database Schema Sync');
console.log('=======================');

if (!direction) {
  console.log('Usage:');
  console.log('  npm run db:sync:to-hosted    - Sync local schema to hosted database');
  console.log('  npm run db:sync:from-hosted  - Sync hosted schema to local database');
  process.exit(1);
}

try {
  switch (direction) {
    case 'to-hosted':
      console.log('📤 Syncing local schema to hosted database...');
      console.log('   1. Generating migrations from local schema...');
      execSync('drizzle-kit generate', { stdio: 'inherit' });

      console.log('   2. Applying migrations to hosted database...');
      execSync('drizzle-kit migrate', { stdio: 'inherit' });

      console.log('✅ Schema synced to hosted database');
      break;

    case 'from-hosted':
      console.log('📥 Syncing hosted schema to local database...');
      console.log('   1. Generating migrations from hosted schema...');
      execSync('drizzle-kit generate', { stdio: 'inherit' });

      console.log('   2. Applying migrations to local database...');
      execSync('drizzle-kit migrate', { stdio: 'inherit' });

      console.log('✅ Schema synced from hosted database');
      break;

    default:
      console.log('❌ Invalid direction. Use "to-hosted" or "from-hosted"');
      process.exit(1);
  }
} catch (error) {
  console.error('❌ Schema sync failed:', error.message);
  process.exit(1);
}
