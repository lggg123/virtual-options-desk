# 🤖 CrewAI Service Deployment Guide

## 🔴 IMPORTANT: Multi-Service Railway Setup

This repository supports **TWO separate Railway services** from the same GitHub repo:

| Service | Dockerfile | Source Directory | Service Name |
|---------|-----------|------------------|--------------|
| **Pattern Detection API** (see RAILWAY_DEPLOYMENT.md) | `Dockerfile.pattern` | `python/` | `pattern-detection-api` |
| **CrewAI Service** (this guide) | `Dockerfile.crewai` | `crewai-service/` | `crewai-market-analysis` |

**How it works**:
- Both services connect to the **same GitHub repository**
- Each service uses a **different Dockerfile** (specified in `railway-*.json`)
- Each Dockerfile copies only its relevant directory (`python/` or `crewai-service/`)
- Railway builds and deploys them **independently** as separate services
- You can deploy them in the **same Railway project** or separate projects

## Overview

The CrewAI Service provides advanced AI-powered market analysis using multi-agent AI systems. It uses OpenAI's GPT models via the CrewAI framework to analyze market trends, generate insights, and provide trading recommendations.

## What is CrewAI Service?

The CrewAI service includes:
- **AI Market Analyst Agent**: Analyzes market trends and patterns
- **Risk Assessment Agent**: Evaluates trading risks
- **Strategy Recommendation Agent**: Provides trading strategies
- **Advanced NLP Analysis**: Sentiment analysis and news interpretation
- **REST API**: FastAPI endpoints for integration

## Deployment Options

### Option 1: Railway (Recommended)
- ✅ Easy Docker deployment
- ✅ Auto-scaling
- ✅ Good free tier ($5 credit)
- ✅ Fast cold starts

### Option 2: Render
- ✅ Free tier (750 hours/month)
- ⚠️ Slower cold starts
- ✅ Simple configuration

### Option 3: Fly.io
- ✅ Good performance
- ✅ Global distribution
- ⚠️ More complex setup

## Railway Deployment (Recommended)

### Prerequisites

- Railway account: https://railway.app
- GitHub repository connected
- OpenAI API key (required for CrewAI)

### Step 1: Create Railway Service

**Option A: Add to Existing Project** (if you deployed Pattern Detection API)
1. Go to your Railway project dashboard
2. Click **"+ New"** or **"Add Service"**
3. Select **"GitHub Repo"**
4. Choose the same repo: `lggg123/virtual-options-desk`
5. Railway will create a **second service** in the same project

**Option B: Create New Project** (if this is your first service)
1. Go to [Railway Dashboard](https://railway.app/new)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `lggg123/virtual-options-desk`
5. Click **"Deploy"**

**Note**: You can have multiple services in one Railway project, all deploying from the same GitHub repo but using different Dockerfiles.

### Step 2: Configure Service

#### Service Name
Set to: **`crewai-market-analysis`**

#### Build Configuration

**⚠️ CRITICAL STEP - Railway Auto-Detection Will Fail!**

Railway will show error: "Railpack could not determine how to build the app"

**Solution: Use Nixpacks with Custom Config (REQUIRED)**

1. Go to **Settings** → **Build & Deploy**
2. In **"Build"** section, look for **"Nixpacks Config File"** or **"Config File Path"**
3. Enter: `nixpacks-crewai.toml`
4. This tells Nixpacks to:
   - Install Python 3.12
   - Install dependencies from `crewai-service/requirements.txt`
   - Start with: `uvicorn main:app` (in crewai-service directory)
5. Click **"Redeploy"**

**Alternative: Custom Start Command**

If Nixpacks Config doesn't work:
1. Let Railway use **Nixpacks** (default)
2. Go to **Settings** → **Deploy**
3. Set **Custom Start Command**:
   ```bash
   pip install -r crewai-service/requirements.txt && cd crewai-service && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Redeploy

**Why Not Dockerfile?**

Railway's current UI only offers:
- **Nixpacks** (recommended - uses `nixpacks-crewai.toml`)
- **Railpack** (fails with multiple Python files)
- **Custom Build Command** (advanced users)

Direct Dockerfile selection is not available in the current Railway interface.
3. Set **Dockerfile Path**: `Dockerfile.crewai`

### Step 3: Environment Variables

**REQUIRED** - Add these in the **Variables** tab:

```env
# OpenAI API Key (REQUIRED)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Port (Railway sets automatically, but you can override)
PORT=${{PORT}}

# Optional: Model Configuration
OPENAI_MODEL=gpt-4-turbo-preview
CREWAI_VERBOSE=true
```

### Step 4: Get Your API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Copy the key (starts with `sk-`)
4. Paste into Railway environment variables

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~3-5 minutes)
3. Railway will provide a URL: `https://crewai-market-analysis.up.railway.app`

### Step 6: Test Deployment

#### Health Check
```bash
curl https://crewai-market-analysis.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "crewai_available": true,
  "service": "CrewAI Market Analysis",
  "version": "1.0.0"
}
```

#### Test Market Analysis
```bash
curl -X POST https://crewai-market-analysis.up.railway.app/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "timeframe": "1d",
    "analysis_depth": "comprehensive"
  }'
```

## Render Deployment (Alternative)

### Step 1: Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo: `lggg123/virtual-options-desk`

### Step 2: Configure Service

- **Name**: `crewai-market-analysis`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (uses repo root)
- **Environment**: `Docker`
- **Dockerfile Path**: `Dockerfile.crewai`

### Step 3: Environment Variables

Add in Render dashboard:

```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview
CREWAI_VERBOSE=true
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (~5-10 minutes)
3. Render provides URL: `https://crewai-market-analysis.onrender.com`

## API Endpoints

### GET /health
Health check endpoint

```bash
curl https://your-service-url.com/health
```

### GET /
Service information

```bash
curl https://your-service-url.com/
```

Response:
```json
{
  "service": "CrewAI Market Analysis Service",
  "version": "1.0.0",
  "crewai_available": true,
  "endpoints": ["/analyze", "/health"]
}
```

### POST /analyze
Comprehensive market analysis

```bash
curl -X POST https://your-service-url.com/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "TSLA",
    "timeframe": "1d",
    "analysis_depth": "comprehensive",
    "include_sentiment": true,
    "include_technical": true
  }'
```

Request Body:
```typescript
{
  symbol: string;           // Stock symbol (e.g., "AAPL")
  timeframe: string;        // "1m", "5m", "15m", "1h", "4h", "1d", "1w"
  analysis_depth?: string;  // "quick" | "standard" | "comprehensive"
  include_sentiment?: boolean;
  include_technical?: boolean;
  market_context?: object;  // Additional market data
}
```

Response:
```json
{
  "symbol": "TSLA",
  "analysis": {
    "trend": "bullish",
    "confidence": 0.82,
    "summary": "AI-generated market analysis...",
    "key_insights": ["Insight 1", "Insight 2"],
    "risk_level": "medium",
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "agents_used": ["Market Analyst", "Risk Assessor"],
  "generated_at": "2025-10-06T20:00:00Z",
  "processing_time_ms": 3500
}
```

## Integration with Other Services

### Connect to Next.js Frontend

Update your Next.js environment variables:

```env
# .env.local or Vercel Environment Variables
NEXT_PUBLIC_CREWAI_API_URL=https://crewai-market-analysis.up.railway.app
```

### Connect to Pattern Detection API

The Pattern Detection API can call CrewAI for enhanced analysis:

```python
# In pattern_detection_api.py
import os
import requests

CREWAI_URL = os.getenv("CREWAI_API_URL", "http://localhost:8001")

async def get_ai_analysis(symbol: str):
    response = requests.post(
        f"{CREWAI_URL}/analyze",
        json={"symbol": symbol, "analysis_depth": "quick"}
    )
    return response.json()
```

## Cost & Performance

### Railway Costs

**Free Tier**:
- $5 credit per month
- ~150-300 hours of runtime
- Shared resources

**Hobby Plan** ($5/month):
- 8GB RAM
- Better performance
- Dedicated resources

### OpenAI API Costs

The CrewAI service uses OpenAI's API:

**GPT-4 Turbo** (Recommended):
- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens
- Typical analysis: ~2-5K tokens (~$0.05-$0.15 per request)

**GPT-3.5 Turbo** (Budget Option):
- Input: $0.0005 per 1K tokens  
- Output: $0.0015 per 1K tokens
- Typical analysis: ~2-5K tokens (~$0.005-$0.01 per request)

**Cost Management**:
- Set OpenAI usage limits in dashboard
- Use caching for repeated queries
- Implement rate limiting
- Consider GPT-3.5 for less critical analysis

### Performance

- **Average Response Time**: 2-5 seconds
- **Cold Start**: ~10-15 seconds
- **Concurrent Requests**: Depends on plan

## Monitoring & Logs

### Railway Logs

1. Go to your Railway project
2. Click **"crewai-market-analysis"** service
3. Click **"Deployments"**
4. View real-time logs

### Key Metrics to Monitor

- **Response Times**: Should be under 5 seconds
- **Error Rate**: Should be under 1%
- **OpenAI API Usage**: Monitor costs
- **Memory Usage**: Should stay under 512MB (free tier)

## Troubleshooting

### "CrewAI not available" Error

**Cause**: Dependencies not installed or import error

**Solution**:
1. Check Dockerfile build logs
2. Verify `requirements.txt` is correct
3. Ensure Python 3.11+ is used (CrewAI requirement)

### "OpenAI API Key Invalid"

**Cause**: Missing or incorrect API key

**Solution**:
1. Verify key starts with `sk-`
2. Check Railway environment variables
3. Test key at https://platform.openai.com
4. Regenerate key if needed

### Slow Response Times

**Cause**: OpenAI API latency or cold start

**Solutions**:
- Use GPT-3.5 Turbo instead of GPT-4
- Implement response caching
- Keep service warm with periodic pings
- Upgrade to paid Railway plan

### Out of Memory

**Cause**: CrewAI/LangChain memory usage

**Solutions**:
- Upgrade to Railway Hobby plan (8GB RAM)
- Reduce `analysis_depth` to "quick"
- Limit concurrent requests
- Clear conversation history after each request

### Rate Limiting from OpenAI

**Cause**: Too many requests to OpenAI API

**Solutions**:
- Implement request queue
- Add rate limiting middleware
- Increase OpenAI tier limits
- Cache common queries

## Security Best Practices

### Protect Your API Key

```env
# ✅ Good: Use environment variables
OPENAI_API_KEY=sk-...

# ❌ Bad: Never hardcode in code
# api_key = "sk-..."
```

### Add Authentication

Consider adding API key authentication:

```python
# In main.py
from fastapi import Header, HTTPException

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != os.getenv("API_SECRET_KEY"):
        raise HTTPException(status_code=401, detail="Invalid API Key")

@app.post("/analyze", dependencies=[Depends(verify_api_key)])
async def analyze_market(...):
    # Your code
```

### Rate Limiting

Add rate limiting to prevent abuse:

```bash
pip install slowapi
```

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/analyze")
@limiter.limit("10/minute")
async def analyze_market(...):
    # Your code
```

## Development & Testing

### Run Locally

```bash
# Install dependencies
cd crewai-service
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY=sk-your-key-here
export PORT=8001

# Run service
python main.py
```

Access at: `http://localhost:8001`

### Test with Docker

```bash
# Build image
docker build -f Dockerfile.crewai -t crewai-service .

# Run container
docker run -p 8001:8001 \
  -e OPENAI_API_KEY=sk-your-key-here \
  -e PORT=8001 \
  crewai-service
```

### Run Tests

```bash
# Test health endpoint
curl http://localhost:8001/health

# Test analysis
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","timeframe":"1d"}'
```

## Deployment Checklist

- [ ] OpenAI API key obtained
- [ ] Railway/Render account created
- [ ] GitHub repository connected
- [ ] Dockerfile.crewai configured
- [ ] railway-crewai.json configured
- [ ] Environment variables set (OPENAI_API_KEY)
- [ ] Service deployed successfully
- [ ] Health check passing
- [ ] Test analysis endpoint
- [ ] Monitor OpenAI usage/costs
- [ ] Set up usage alerts
- [ ] Document API URL for frontend integration

## Next Steps

1. ✅ Deploy CrewAI service to Railway
2. ✅ Test all endpoints
3. ✅ Integrate with Next.js frontend
4. ✅ Connect to Pattern Detection API
5. ✅ Monitor costs and performance
6. 🎉 AI-powered market analysis is live!

## Support Resources

- **CrewAI Docs**: https://docs.crewai.com
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs

---

**Created**: October 6, 2025  
**Status**: Ready to Deploy 🚀
