# Job Application Analyzer

A Next.js application that analyzes job postings against your CV to provide match scores and improvement recommendations.

## Features

- **Job Ad Parsing**: Extracts job requirements, tech stack, and company details
- **CV Analysis**: Parses your CV from Markdown or JSON format
- **Match Scoring**: Uses LLM-powered analysis for accurate match scores
- **Gap Analysis**: Identifies missing skills and experience
- **Recommendations**: Provides actionable CV improvement suggestions

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your OpenAI API key:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: Without an OpenAI API key, the system will use heuristic-based scoring as a fallback.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## LLM Integration

The application uses OpenAI's API for intelligent match scoring. When configured properly, it provides:

- **Accurate Match Scores**: LLM analyzes job requirements against your CV
- **Detailed Reasoning**: Explains why the score was given
- **Context-Aware Analysis**: Considers experience, skills, and project relevance

### Configuration Options

- `OPENAI_API_KEY`: Your OpenAI API key (required for LLM scoring)
- `OPENAI_BASE_URL`: API endpoint (default: https://api.openai.com/v1)
- `OPENAI_MATCH_MODEL`: Model to use (default: gpt-4o-mini)
- `OPENAI_TIMEOUT_MS`: Request timeout (default: 30000ms)

## Testing

Run the test suite:

```bash
npm test
```

This includes tests for:
- Job ad parsing
- CV parsing
- Match scoring (both LLM and heuristic)
- Tech stack extraction

## Quick Verification Loop

Use the bundled verifier for fast confidence checks:

```bash
npm run verify            # lint + endpoint smoke, skips tests
npm run verify -- --with-tests  # include Vitest run
```

Set `POST_VERIFY_WITH_TESTS=1` to include tests by default.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Fly.io

Deploy your application to Fly.io for production with persistent data storage and database support.

### Prerequisites

1. **Install Fly.io CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Authenticate with Fly.io**:
   ```bash
   fly auth login
   ```

### Quick Setup

Run the automated setup script:

```bash
npm run setup:all
```

This will:
1. ✅ Verify local code quality
2. ✅ Build the application
3. ✅ Set up Fly.io application
4. ✅ Create PostgreSQL database
5. ✅ Prepare deployment configuration

### Deploy to Production

```bash
npm run deploy:fly
```

### Database Management

```bash
npm run db:connect    # Connect to PostgreSQL database
npm run db:migrate    # Run database migrations (TODO: implement)
```

### Manual Setup

If you prefer manual setup:

```bash
# 1. Create Fly.io app
fly launch

# 2. Set up database
fly postgres create --name jobs-crawler-db

# 3. Deploy
fly deploy
```

### Available Commands

- `npm run setup:all` - Complete automated setup
- `npm run setup:deploy` - Setup and deploy in one command
- `npm run db:setup` - Create PostgreSQL database
- `npm run db:connect` - Connect to database
- `npm run deploy:fly` - Deploy to production

### Environment Variables

The following environment variables are configured in `fly.toml`:

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL` (auto-generated after database setup)

### Monitoring & Logs

```bash
fly logs          # View application logs
fly status        # Check app status
fly dashboard     # Open web dashboard
```
