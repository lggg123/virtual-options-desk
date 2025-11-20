# AI Blog Generation System

## Overview

This system automatically generates daily market analysis blog posts using a 5-agent CrewAI crew. The blog posts are SEO-optimized, comprehensive, and published to the public `/blog` route.

## Architecture

```
┌─────────────────────┐
│  Vercel Cron Job    │
│  (Daily at 8am UTC) │
└──────────┬──────────┘
           │
           v
┌─────────────────────────────────────┐
│  Next.js API Route                   │
│  /api/cron/generate-daily-blog      │
└──────────┬──────────────────────────┘
           │
           v
┌─────────────────────────────────────┐
│  CrewAI Service (Flask)              │
│  market_blog_crew/api.py            │
│  Port 8000                          │
└──────────┬──────────────────────────┘
           │
           v
┌─────────────────────────────────────┐
│  5 AI Agents (CrewAI)                │
│  - Market Researcher                │
│  - Technical Analyst                │
│  - Options Strategist               │
│  - Risk Manager                     │
│  - Content Writer                   │
└──────────┬──────────────────────────┘
           │
           v
┌─────────────────────────────────────┐
│  Supabase Database                   │
│  blog_posts table                   │
└─────────────────────────────────────┘
           │
           v
┌─────────────────────────────────────┐
│  Public Blog (/blog)                 │
│  No authentication required         │
└─────────────────────────────────────┘
```

## Environment Variables

### Frontend (Next.js)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# CrewAI Service
CREWAI_SERVICE_URL=https://your-crewai-service.com
CREWAI_API_KEY=your-secret-api-key-here

# Cron Security
CRON_SECRET=your-cron-secret-here
```

### CrewAI Service (Flask)
```env
# API Security
CREWAI_API_KEY=your-secret-api-key-here

# LLM Configuration
GEMINI_API_KEY=your_gemini_api_key

# Server
PORT=8000
FLASK_ENV=production
```

## Manual Blog Generation

### Using Node.js Script (Recommended)
```bash
# From frontend directory
cd frontend
node scripts/generate-blog.js

# Or with custom API URL
API_URL=https://yoursite.com node scripts/generate-blog.js
```

### Using Bash Script
```bash
# From frontend directory
cd frontend
chmod +x scripts/generate-blog.sh
./scripts/generate-blog.sh
```

### Using curl
```bash
curl -X POST https://yoursite.com/api/cron/generate-daily-blog \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

## Automated Scheduling

### Vercel Cron (Recommended for Production)

The `vercel.json` file includes a cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-daily-blog",
      "schedule": "0 8 * * *"
    }
  ]
}
```

This runs daily at 8:00 AM UTC. Vercel automatically sets the `CRON_SECRET` environment variable.

### Alternative: External Cron Services

You can use services like:
- **Cron-job.org** - Free, reliable
- **EasyCron** - Feature-rich
- **GitHub Actions** - Integrated with your repo

Example GitHub Actions workflow (`.github/workflows/daily-blog.yml`):

```yaml
name: Generate Daily Blog Post

on:
  schedule:
    - cron: '0 8 * * *'  # 8 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Blog Generation
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/cron/generate-daily-blog \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

## CrewAI Service Deployment

### Deploy to Railway (Recommended)

1. **Create Railway Project**
   ```bash
   cd market_blog_crew
   railway init
   ```

2. **Set Environment Variables**
   ```bash
   railway variables set CREWAI_API_KEY=your-key-here
   railway variables set GEMINI_API_KEY=your-gemini-key
   railway variables set PORT=8000
   railway variables set FLASK_ENV=production
   ```

3. **Deploy**
   ```bash
   railway up
   ```

4. **Get Service URL**
   ```bash
   railway domain
   ```

5. **Update Frontend Environment**
   Set `CREWAI_SERVICE_URL` in your Vercel/frontend environment to the Railway URL.

### Deploy to Render

1. Create new Web Service
2. Connect GitHub repo
3. Set:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python api.py`
   - Environment Variables (same as above)

### Local Development

```bash
# Terminal 1: Start CrewAI service
cd market_blog_crew
python -m venv .venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
pip install -r requirements.txt
python api.py

# Terminal 2: Start Next.js
cd frontend
npm run dev

# Terminal 3: Test blog generation
cd frontend
node scripts/generate-blog.js
```

## Blog Post Structure

Generated blog posts include:

- **Title**: SEO-optimized headline
- **Meta Description**: 155-character summary
- **Content**: 1800-2200 words of markdown-formatted content
- **Tags**: Categorization tags (e.g., "options-trading", "market-analysis")
- **Target Keywords**: SEO keywords
- **Market Data**:
  - Date
  - S&P 500 level
  - VIX level
  - Top performing sector
  - Key stocks
  - Market sentiment

## Database Schema

```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT DEFAULT 'AI Market Analyst',
  reading_time INTEGER NOT NULL,
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  meta_description TEXT,
  meta_keywords TEXT[],
  market_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC function for incrementing views
CREATE OR REPLACE FUNCTION increment_blog_view_count(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE slug = post_slug;
END;
$$ LANGUAGE plpgsql;
```

## SEO Features

- ✅ Public routes (no authentication required)
- ✅ Clean URLs with slugs
- ✅ Meta descriptions and keywords
- ✅ OpenGraph tags for social sharing
- ✅ Structured data (JSON-LD)
- ✅ View count tracking
- ✅ Responsive design
- ✅ Fast page loads

## Monitoring

Check blog generation logs:

```bash
# Vercel logs
vercel logs

# CrewAI service logs (Railway)
railway logs

# Check latest blog posts
curl https://yoursite.com/api/blog/latest
```

## Troubleshooting

### Blog not generating

1. Check CrewAI service is running:
   ```bash
   curl https://your-crewai-service.com/health
   ```

2. Check environment variables are set correctly

3. Check Gemini API quota (free tier: 15 requests/minute)

4. Review logs for errors

### Cron not triggering

1. Verify `CRON_SECRET` is set in Vercel
2. Check Vercel Cron logs in dashboard
3. Ensure vercel.json cron config is deployed
4. Test manually with the script

### Content quality issues

1. Review agent configurations in `market_blog_crew/src/market_blog_crew/config/agents.yaml`
2. Adjust task descriptions in `tasks.yaml`
3. Consider upgrading to Gemini Pro for better output

## Next Steps

- [ ] Add RSS feed generation
- [ ] Implement blog post scheduling (draft → published)
- [ ] Add email newsletter integration
- [ ] Create admin interface for editing posts
- [ ] Add comment system
- [ ] Implement related posts suggestions
- [ ] Add social media auto-posting
