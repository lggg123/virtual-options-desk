# 🚂 Railway Deployment Guide - Pattern Detection API

## 🔴 IMPORTANT: Multi-Service Railway Setup

This repository supports **TWO separate Railway services** from the same GitHub repo:

| Service | Dockerfile | Source Directory | Service Name |
|---------|-----------|------------------|--------------|
| **Pattern Detection API** (this guide) | `Dockerfile.pattern` | `python/` | `pattern-detection-api` |
| **CrewAI Service** (see CREWAI_DEPLOYMENT.md) | `Dockerfile.crewai` | `crewai-service/` | `crewai-market-analysis` |

**How it works**:
- Both services connect to the **same GitHub repository**
- Each service uses a **different Dockerfile** (specified in `railway-*.json`)
- Each Dockerfile copies only its relevant directory (`python/` or `crewai-service/`)
- Railway builds and deploys them **independently** as separate services
- You can deploy them in the **same Railway project** or separate projects

## Overview

Deploy the Pattern Detection API with WebSocket support to Railway for integration with the Svelte Chart App.

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- GitHub repository connected
- Railway CLI (optional, for local testing)

## Deployment Steps

### Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/new)
2. Click **"New Project"** (or use existing project)
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `lggg123/virtual-options-desk`
5. Click **"Add Service"** if adding to existing project
6. Click **"Deploy"**

**Note**: If you're also deploying the CrewAI service, you'll create **two separate services** in Railway from the same GitHub repo. Each service uses a different Dockerfile.

### 2. Configure Service Settings

#### Service Name
- Set to: **`pattern-detection-api`**

#### Root Directory
- Keep as: `/` (root of repository)

#### Build & Deploy Configuration

**IMPORTANT**: Railway detects the monorepo and tries to install Bun. We use a custom Dockerfile to avoid this.

**Option A: Use Railway Config File (Recommended)**

1. Go to **Settings** → **Build & Deploy**
2. Set **Railway Config File**: `railway-pattern-detection.json`
3. This uses `Dockerfile.pattern` for Docker build

**Option B: Manual Dockerfile Configuration**

1. Go to **Settings** → **Build & Deploy**
2. Set **Builder**: `Dockerfile`
3. Set **Dockerfile Path**: `Dockerfile.pattern`
4. Leave **Start Command** empty (defined in Dockerfile)

**Option C: Manual Configuration (Not Recommended)**

If not using Docker:

1. **Root Directory**: `/` (leave as is)
2. **Build Command**: `pip install -r python/requirements-ml.txt`
3. **Start Command**: `uvicorn python.pattern_detection_api:app --host 0.0.0.0 --port $PORT`
4. **Watch Paths**: `python/**`

**Note**: Nixpacks is deprecated on Railway. The Dockerfile approach is now preferred.

#### Environment Variables

Add these in **Variables** tab:

```
PYTHON_VERSION=3.12
PORT=${{PORT}}
```

**Optional** (if using paid APIs):
```
ALPHA_VANTAGE_API_KEY=your_key_here
FINNHUB_API_KEY=your_key_here
```

### 3. Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Click **"Generate Domain"**
3. Railway will provide: `pattern-detection-api.up.railway.app`
4. Or add your own custom domain

### 4. Verify Deployment

Once deployed, test the endpoints:

#### Health Check
```bash
curl https://pattern-detection-api.up.railway.app/health
```

Expected response:
```json
{"status": "healthy"}
```

#### Test REST API
```bash
# Top stock picks
curl https://pattern-detection-api.up.railway.app/api/picks/top/5

# Stock details
curl https://pattern-detection-api.up.railway.app/api/stock/AAPL

# Pattern history
curl https://pattern-detection-api.up.railway.app/api/patterns/AAPL?timeframe=1d&days=7
```

#### Test WebSocket (Browser Console)
```javascript
const ws = new WebSocket('wss://pattern-detection-api.up.railway.app/ws/live/AAPL?timeframe=1d');

ws.onopen = () => console.log('✅ Connected to Railway!');
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  console.log('📊', data.type, data);
};
```

## Svelte Chart App Configuration

### Update Environment Variables on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Svelte Chart App** project
3. Go to **Settings** → **Environment Variables**
4. Update/Add:

```env
VITE_API_URL=https://pattern-detection-api.up.railway.app
VITE_WS_URL=wss://pattern-detection-api.up.railway.app
```

5. Click **"Save"**
6. Redeploy the project

## Railway vs Render Comparison

| Feature | Railway | Render |
|---------|---------|--------|
| Free Tier | $5 credit/month (no time limit) | 750 hours/month |
| Cold Starts | Minimal (~5s) | Can be 30-60s |
| WebSocket Support | ✅ Native | ✅ Native |
| Custom Domains | ✅ Free | ✅ Free |
| Build Time | Fast | Moderate |
| Ease of Use | Very Easy | Easy |
| GitHub Integration | ✅ Excellent | ✅ Excellent |

## Monitoring & Logs

### View Logs

1. Go to your Railway project
2. Click on **`pattern-detection-api`** service
3. Click **"Deployments"**
4. Click on latest deployment
5. View real-time logs

### Check Metrics

1. In service view, click **"Metrics"**
2. Monitor:
   - CPU usage
   - Memory usage
   - Network traffic
   - Response times

## Troubleshooting

### Deployment Failed

**Check Build Logs**:
1. Go to **Deployments**
2. Click failed deployment
3. Check build output for errors

**Common Issues**:
- Missing dependencies: Check `requirements-ml.txt`
- Port binding: Ensure `--port $PORT` is set
- Python version: Verify `PYTHON_VERSION=3.12` is set

### WebSocket Connection Fails

**CORS Issue**:
Update `pattern_detection_api.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://svelte-chart-app.vercel.app",
        "http://localhost:5173"  # For local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**SSL/TLS Issue**:
- Ensure using `wss://` (not `ws://`) for production
- Railway automatically provides SSL certificates

### Service Crashes

**Memory Issues**:
- Free tier has 512MB RAM limit
- Upgrade to Hobby plan ($5/month) for 8GB RAM

**Check Restart Policy**:
- Set in Railway config: `"restartPolicyType": "ON_FAILURE"`
- Set max retries: `"restartPolicyMaxRetries": 10`

## Scaling & Performance

### Free Tier Limits

- **RAM**: 512MB (shared)
- **CPU**: Shared vCPU
- **Bandwidth**: 100GB/month
- **Execution Time**: No limit (until $5 credit depletes)

### Upgrade Options

**Hobby Plan** ($5/month per project):
- 8GB RAM
- Dedicated resources
- Priority support
- Better performance

### Optimization Tips

1. **Cache market data**:
   ```python
   from functools import lru_cache
   
   @lru_cache(maxsize=100)
   def get_cached_stock_data(symbol: str, date: str):
       # Your fetch logic
       pass
   ```

2. **Limit WebSocket connections**:
   ```python
   MAX_CONNECTIONS = 50
   active_connections = []
   ```

3. **Use connection pooling** for database connections

4. **Implement rate limiting** for API endpoints

## Keeping Service Warm

Railway services don't sleep like Render free tier, but if you want to ensure it stays active:

### Option 1: Cron Job (Railway Cron)

Create a scheduled task to ping your service every 5 minutes.

### Option 2: External Monitoring

Use services like:
- **UptimeRobot** (free)
- **Pingdom**
- **Better Uptime**

Set up to ping: `https://pattern-detection-api.up.railway.app/health`

## Cost Estimation

### Free Tier Usage

With $5 credit and typical usage:
- **API-only**: ~1-2 months
- **With WebSocket**: ~2-4 weeks (more bandwidth)

### Paid Plan

Hobby plan at $5/month is usually sufficient for:
- Multiple services
- Moderate traffic
- WebSocket connections
- Better performance

## Local Development

### Test Railway Configuration Locally

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run locally with Railway environment
railway run uvicorn python.pattern_detection_api:app --reload --port 8003
```

## Next Steps

1. ✅ Deploy Pattern Detection API to Railway
2. ✅ Configure environment variables
3. ✅ Test all endpoints
4. ✅ Update Svelte app Vercel config
5. ✅ Verify WebSocket connection
6. 🎉 Chart app is live with real data!

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

---

**Created**: October 6, 2025  
**Status**: Ready for Railway Deployment 🚂
