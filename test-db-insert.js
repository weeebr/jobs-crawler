import Database from 'better-sqlite3';
import crypto from 'crypto';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Open database
const dbPath = join(__dirname, 'data', 'jobs-crawler.db');
const db = new Database(dbPath);

// Hash API key
const apiKey = 'sk-test-user1-1234567890123456789012345678901234567890';
const apiKeyHash = crypto.createHash('sha256').update(apiKey.trim()).digest('hex');

console.log('API key hash:', apiKeyHash);

// Check if user exists
const existingUser = db.prepare('SELECT * FROM users WHERE api_key_hash = ?').get(apiKeyHash);
console.log('Existing user:', existingUser);

if (!existingUser) {
  // Create new user
  const result = db.prepare(`
    INSERT INTO users (api_key_hash, created_at, last_active_at, total_analyses, preferred_model)
    VALUES (?, unixepoch(), unixepoch(), 0, 'gpt-4o-mini')
  `).run(apiKeyHash);

  console.log('Created user with ID:', result.lastInsertRowid);
}

// Get user ID
const user = db.prepare('SELECT * FROM users WHERE api_key_hash = ?').get(apiKeyHash);
console.log('User:', user);

if (user) {
  // Try to insert analysis record
  const insertResult = db.prepare(`
    INSERT INTO analysis_records (
      user_id, created_at, updated_at, title, company, description,
      stack, match_score, reasoning, is_new_this_run, source_url
    ) VALUES (
      ?, unixepoch(), unixepoch(), ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `).run(
    user.id,
    'Test Job',
    'Test Company',
    'Test description',
    JSON.stringify(['React']),
    85.0,
    JSON.stringify(['Good match']),
    1,
    'https://example.com'
  );

  console.log('Inserted record with ID:', insertResult.lastInsertRowid);
  console.log('Changes:', insertResult.changes);
}

db.close();
