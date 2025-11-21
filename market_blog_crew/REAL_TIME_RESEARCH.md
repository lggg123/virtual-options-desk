# Market Blog Crew - Real-Time Research Setup

## Overview

The market_blog_crew now uses **real-time web search and research tools** to gather current market data instead of relying on LLM training data.

## Tools Enabled

### 1. **SerperDevTool** - Google Search API
- Provides real-time search results from Google
- Used for: market news, economic data, stock prices, sentiment
- Free tier: 2,500 searches/month

### 2. **WebsiteSearchTool** - RAG for Financial Websites
- Searches specific financial websites with RAG
- Configured sites:
  - Yahoo Finance
  - MarketWatch
  - CNBC Markets
  - Bloomberg Markets
  - Investing.com

### 3. **ScrapeWebsiteTool** - Web Scraper
- Extracts data directly from web pages
- Used for: structured data extraction, price tables, charts

## Setup Instructions

### 1. Install CrewAI Tools

```bash
cd market_blog_crew
pip install 'crewai[tools]'
```

### 2. Get Serper API Key

1. Go to [https://serper.dev](https://serper.dev)
2. Sign up for free account
3. Get your API key (free tier: 2,500 searches/month)
4. Add to `.env`:

```bash
SERPER_API_KEY=your-serper-api-key-here
```

### 3. Update Environment Variables

Your `.env` should have:

```env
# LLM Configuration
MODEL=gemini-2.5-flash
GEMINI_API_KEY=your_gemini_key

# Web Search (REQUIRED for real-time data)
SERPER_API_KEY=your_serper_key

# Flask API
CREWAI_API_KEY=your_api_key
PORT=8000
FLASK_ENV=production
```

### 4. Test the Updated Crew

```bash
cd market_blog_crew
crewai run
```

## What Changed

### Before (Training Data Only)
- ❌ Used outdated information from LLM training cutoff
- ❌ No access to current market prices
- ❌ Couldn't verify recent news or events
- ❌ Generic analysis not tied to specific dates

### After (Real-Time Research)
- ✅ Searches Google for current market data
- ✅ Scrapes Yahoo Finance, MarketWatch, CNBC
- ✅ Gets live S&P 500, VIX, sector performance
- ✅ Finds breaking news and earnings reports
- ✅ Verifies data across multiple sources
- ✅ Cites sources with timestamps

## Agent Tools Assignment

| Agent | Tools | Purpose |
|-------|-------|---------|
| **Market Researcher** | SerperDevTool, WebsiteSearchTool, ScrapeWebsiteTool | Search web for current market data, news, prices |
| **Technical Analyst** | SerperDevTool, ScrapeWebsiteTool | Find chart patterns, technical indicators, price levels |
| **Options Strategist** | SerperDevTool | Research current IV levels, options flow, volatility |
| **Risk Manager** | - | Pure analysis (no web search needed) |
| **Content Writer** | - | Pure writing (no web search needed) |

## Example Searches Performed

The Market Researcher agent will now automatically perform searches like:

```
"S&P 500 today"
"Nasdaq performance November 21 2025"
"VIX level current"
"market news today"
"sector performance today"
"biggest stock movers today"
"economic calendar this week"
"fear and greed index"
"oil price today"
"gold price today"
```

## Expected Output Quality

### Market Data Section (Example)
```markdown
## Major Market Indices

According to Yahoo Finance at 2:30 PM EST on November 21, 2025:

- **S&P 500**: 5,943.34 (+0.32%, +18.84 points)
- **Nasdaq**: 19,234.56 (+0.89%, +169.23 points)
- **Dow Jones**: 44,296.51 (-0.13%, -58.13 points)
- **Russell 2000**: 2,341.12 (+1.24%, +28.67 points)

*Source: Yahoo Finance, MarketWatch*
```

## Troubleshooting

### Issue: "SerperDevTool not found"
**Solution**: Install tools package
```bash
pip install 'crewai[tools]'
```

### Issue: "SERPER_API_KEY not set"
**Solution**: Add key to `.env` file
```bash
echo "SERPER_API_KEY=your-key-here" >> .env
```

### Issue: "Rate limit exceeded"
**Solution**: Free tier allows 2,500 searches/month. Consider:
- Upgrade Serper plan ($50/month for 10,000 searches)
- Cache results to reduce API calls
- Reduce blog generation frequency

### Issue: "Tool execution timeout"
**Solution**: Increase timeout in api.py:
```python
crew = MarketBlogCrew().crew()
result = crew.kickoff(inputs=inputs, timeout=600)  # 10 minutes
```

## Cost Analysis

### Serper.dev API
- **Free Tier**: 2,500 searches/month ($0)
- **Paid Tier**: 10,000 searches/month ($50)
- **Per blog post**: ~20-30 searches
- **Monthly capacity (free)**: ~80-125 blog posts

### Gemini API
- **Free Tier**: 15 requests/minute, 1500/day
- **Per blog post**: ~50-100 requests
- **Monthly capacity (free)**: ~450-900 blog posts

**Recommendation**: Free tiers sufficient for 1 blog post/day

## Advanced Configuration

### Custom Financial Sites

Add more financial websites in `crew.py`:

```python
self.financial_websites = [
    'https://finance.yahoo.com',
    'https://www.marketwatch.com',
    'https://www.cnbc.com/markets',
    'https://www.bloomberg.com/markets',
    'https://www.investing.com',
    'https://finviz.com',  # Add custom sites
    'https://seekingalpha.com',
]
```

### Firecrawl Integration (Advanced)

For better scraping on complex sites:

```bash
pip install crewai-tools[firecrawl]
```

```python
from crewai_tools import FirecrawlScrapeWebsiteTool

firecrawl_scraper = FirecrawlScrapeWebsiteTool(
    api_key=os.getenv('FIRECRAWL_API_KEY')
)
```

## Verification

Test that tools are working:

```bash
cd market_blog_crew
python -c "from crewai_tools import SerperDevTool; print('✅ Tools installed')"
```

Run a single agent test:

```bash
crewai test --agent market_researcher
```

## Next Steps

1. ✅ Install tools: `pip install 'crewai[tools]'`
2. ✅ Get Serper API key from serper.dev
3. ✅ Add `SERPER_API_KEY` to `.env`
4. ✅ Test with `crewai run`
5. ✅ Deploy updated service to Railway/Render
6. ✅ Generate first real-time blog post!

The blog posts will now contain **up-to-date market information** from today's trading session! 🚀
