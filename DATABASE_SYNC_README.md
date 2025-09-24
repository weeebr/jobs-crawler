# Database Schema Sync

Simple schema synchronization between local SQLite and hosted PostgreSQL databases.

## Setup

1. **Environment Variables** (create `.env.local`):
   ```bash
   DATABASE_URL_LOCAL="sqlite:./data/jobs-crawler.db"
   OPENAI_API_KEY="your-api-key"
   # Optional: DATABASE_URL_HOSTED="postgresql://..."
   ```

2. **Initialize Local Database**:
   ```bash
   npm run db:push
   ```

## Usage

### Sync Local Schema to Hosted Database
```bash
npm run db:sync:to-hosted
```

### Sync Hosted Schema to Local Database
```bash
npm run db:sync:from-hosted
```

## Requirements

- Set `DATABASE_URL_HOSTED` environment variable for hosted database sync
- Ensure both databases have proper permissions
- Drizzle migrations will be generated and applied automatically