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

## Completed Features

- [x] Add RSS feed generation
- [x] Add email newsletter integration (Resend)
- [x] Create admin interface for editing posts
- [x] Add comment system (with moderation)
- [x] Implement related posts suggestions
- [x] Add social media auto-posting (Twitter, LinkedIn, Facebook, Reddit)

## Pending Features

- [ ] Implement blog post scheduling (draft → published with scheduled time)

---

## RSS Feed

The blog includes an RSS feed at `/api/blog/rss`:

- ✅ RSS 2.0 standard format
- ✅ Automatic discovery via HTML `<link>` tag
- ✅ Up to 50 most recent published posts
- ✅ Full post metadata
- ✅ 1-hour caching

**Feed URL:** `https://yourdomain.com/api/blog/rss`

---

## Email Newsletter

Powered by **Resend**, the newsletter system includes:

- ✅ Double opt-in subscription (confirmation email)
- ✅ Beautiful HTML email templates
- ✅ Auto-send when new blog posts are published
- ✅ Unsubscribe functionality
- ✅ Signup form on blog page
- ✅ Batch sending with rate limiting

### Required Environment Variables

```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=insights@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### API Endpoints

- `POST /api/newsletter/subscribe` - Subscribe new email
- `GET /api/newsletter/confirm?token=xxx` - Confirm subscription
- `GET /api/newsletter/unsubscribe?email=xxx` - Unsubscribe

---

## Comment System

Anonymous comments with moderation:

- ✅ Anonymous submission (name + email required, email not shown)
- ✅ Pending moderation by default
- ✅ Admin approval/rejection/spam marking
- ✅ Rate limiting (3 comments/minute per IP)
- ✅ Displayed on blog post pages

### API Endpoints

- `GET /api/blog/comments?slug=xxx` - Get approved comments
- `POST /api/blog/comments` - Submit new comment

---

## Related Posts

Tag-based recommendations:

- ✅ Finds posts with similar tags
- ✅ Relevance scoring algorithm
- ✅ Falls back to recent posts if no matches
- ✅ Shows 3 related posts on each blog page

### API Endpoint

- `GET /api/blog/related?slug=xxx&limit=3` - Get related posts

---

## Admin Dashboard

Access at `/admin/blog` (requires authentication):

- ✅ Blog post management (list, publish, archive, delete)
- ✅ Comment moderation (approve, reject, spam, delete)
- ✅ Stats overview (total posts, views, pending comments)
- ✅ Social media posting controls

---

## Social Media Auto-Posting

Supports Twitter/X, LinkedIn, Facebook, and Reddit:

### Required Environment Variables

```env
# Twitter/X
TWITTER_API_KEY=xxx
TWITTER_API_SECRET=xxx
TWITTER_ACCESS_TOKEN=xxx
TWITTER_ACCESS_SECRET=xxx

# LinkedIn
LINKEDIN_ACCESS_TOKEN=xxx
LINKEDIN_ORG_ID=xxx  # or LINKEDIN_PERSON_ID for personal profiles

# Facebook
FACEBOOK_ACCESS_TOKEN=xxx
FACEBOOK_PAGE_ID=xxx

# Reddit
REDDIT_CLIENT_ID=xxx
REDDIT_CLIENT_SECRET=xxx
REDDIT_USERNAME=xxx
REDDIT_PASSWORD=xxx
REDDIT_SUBREDDIT=options  # target subreddit
```

### API Endpoints

- `GET /api/admin/social-post?postId=xxx` - Get posting status
- `POST /api/admin/social-post` - Trigger social media posts

### Features

- ✅ Auto-generates hashtags from tags
- ✅ Platform-specific formatting
- ✅ Tracks posting status in database
- ✅ Manual trigger from admin dashboard

---

## Database Schema (New Tables)

Run the migration at `frontend/supabase/migrations/002_newsletter_and_comments.sql`:

```sql
-- Newsletter Subscribers
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  confirmation_token TEXT UNIQUE,
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Blog Comments
CREATE TABLE blog_comments (
  id UUID PRIMARY KEY,
  blog_post_id UUID REFERENCES blog_posts(id),
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  ip_address TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Social Media Posts
CREATE TABLE social_media_posts (
  id UUID PRIMARY KEY,
  blog_post_id UUID REFERENCES blog_posts(id),
  platform TEXT CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'reddit')),
  post_id TEXT,
  post_url TEXT,
  status TEXT CHECK (status IN ('pending', 'posted', 'failed')),
  error_message TEXT,
  posted_at TIMESTAMPTZ,
  UNIQUE(blog_post_id, platform)
);
```
