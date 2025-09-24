# Database Layer Documentation

## Overview

This directory contains the SQLite-based database layer for the jobs-crawler application. The database is designed to be user-scoped, meaning each user's data is isolated based on their OpenAI API key hash.

## Architecture

### Core Components

- **`index.ts`** - Database connection and initialization
- **`schema.ts`** - Database schema definitions using Drizzle ORM
- **`storage.ts`** - High-level storage operations (user-aware)
- **`users.ts`** - User management and API key handling
- **`api-key-middleware.ts`** - API key extraction and validation middleware
- **`migrations/`** - Database migration files

### User-Based Isolation

Every database operation is scoped to a specific user identified by:
1. **API Key Hash** - SHA-256 hash of the user's OpenAI API key
2. **User ID** - Auto-generated integer ID linked to the API key hash
3. **Foreign Keys** - All records reference the user ID

### Database Schema

```sql
-- Users are identified by hashed API keys
users:
  - id (PRIMARY KEY)
  - api_key_hash (UNIQUE)
  - created_at, last_active_at
  - total_analyses, preferred_model

-- All data is user-scoped
analysis_records:
  - id (PRIMARY KEY)
  - user_id (FOREIGN KEY → users.id)
  - job data, LLM results, status, etc.

cv_profiles:
  - id (PRIMARY KEY)
  - user_id (FOREIGN KEY → users.id)
  - CV data (JSON), is_active flag

job_searches:
  - id (PRIMARY KEY)
  - user_id (FOREIGN KEY → users.id)
  - search metadata, status

analysis_feedback:
  - id (PRIMARY KEY)
  - user_id (FOREIGN KEY → users.id)
  - analysis_record_id (FOREIGN KEY → analysis_records.id)
  - recommendations and gaps
```

## API Reference

### User Management

```typescript
// Get or create user from API key
const user = await getOrCreateUser(apiKey);

// Hash API key (SHA-256)
const hash = hashApiKey(apiKey);

// Validate API key format
const isValid = isValidApiKey(apiKey);
```

### Storage Operations

All storage operations require an API key for user identification:

```typescript
// Save analysis (creates user if needed)
const record = await analysisStorage.save(apiKey, analysisData);

// Get user's analyses
const analyses = await analysisStorage.getAll(apiKey);

// User-scoped operations
const userStats = await analysisStorage.getStats(apiKey);
```

### API Key Middleware

For API routes, use the middleware to extract user context:

```typescript
import { withUserContext } from '@/lib/db/api-key-middleware';

export async function POST(request: NextRequest) {
  const userContext = await withUserContext(request, async (ctx) => {
    // ctx contains: user, apiKeyHash, userId, logContext
    const record = await analysisStorage.save(ctx.apiKeyHash, analysisData);
    return { success: true, record };
  });

  return NextResponse.json(userContext);
}
```

## Development Commands

```bash
# Generate migrations from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema changes directly (dev only)
npm run db:push

# Open Drizzle Studio for database inspection
npm run db:studio

# Seed database with test data
npm run db:seed

# Test database functionality
node scripts/test-db.js
```

## Migration Strategy

### Schema Changes
1. **Modify `schema.ts`** - Update table definitions
2. **Generate migration** - `npm run db:generate`
3. **Review migration** - Check the generated SQL
4. **Apply migration** - `npm run db:migrate`

### For LLM Agents
- **Drizzle is TypeScript-first** - Changes are reflected in types immediately
- **Migration files are SQL** - Easy to understand and modify
- **Foreign keys ensure consistency** - Prevents orphaned records
- **Indexes optimize queries** - User-scoped indexes for performance

## Security Considerations

- **API Key Hashing** - SHA-256, irreversible, stored securely
- **User Isolation** - Complete data separation between users
- **Input Validation** - Zod schemas for all data operations
- **SQL Injection Protection** - Drizzle ORM parameterized queries

## Performance Optimizations

- **Indexes on foreign keys** - Fast user-scoped queries
- **Compound indexes** - Optimized for common query patterns
- **SQLite optimizations** - WAL mode, foreign keys enabled
- **Connection pooling** - Single connection for simplicity

## File Structure

```
lib/db/
├── index.ts              # Database connection & initialization
├── schema.ts             # Database schema definitions
├── storage.ts            # High-level storage operations
├── users.ts              # User management utilities
├── api-key-middleware.ts # API key handling middleware
├── README.md             # This documentation
└── migrations/
    └── 0000_initial_schema.sql # Initial migration with user scoping
```

## Zero-Cost Benefits

- **SQLite file** - No hosting costs, runs on existing infrastructure
- **Single file** - Easy backup, migration, and deployment
- **ACID compliance** - Data integrity guaranteed
- **Full-text search** - Built-in FTS capabilities if needed
- **Concurrent access** - Handles multiple users efficiently

This database design provides robust user isolation while maintaining simplicity and zero additional hosting costs.
