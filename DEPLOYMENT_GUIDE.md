# 🚀 Complete Deployment Guide - All Services

## Services Overview

Your Virtual Options Desk application consists of multiple services:

| Service | Purpose | Recommended Platform | Status |
|---------|---------|---------------------|--------|
| **Next.js Frontend** | Web UI | Vercel | See VERCEL_DEPLOYMENT.md |
| **Pattern Detection API** | Real-time candlestick patterns + WebSocket | Railway | See RAILWAY_DEPLOYMENT.md |
| **ML Stock Screening API** | ML predictions & screening | Render (already deployed) | ✅ Live |
| **CrewAI Service** | AI-powered market analysis | Railway or Render | See below |
| **Svelte Chart App** | Real-time charts | Vercel (separate repo) | See docs/SVELTE_INTEGRATION.md |

---

## 1️⃣ Next.js Frontend (Vercel)

**Location**: `/frontend`

**Deployment**: See `VERCEL_DEPLOYMENT.md`

**Quick Steps**:
1. Set Root Directory to `frontend` in Vercel settings
2. Add environment variables (Supabase, API keys)
3. Deploy

**URL**: `https://virtual-options-desk.vercel.app`

---

## 2️⃣ Pattern Detection API (Railway)

**Location**: `/python/pattern_detection_api.py`

**Deployment**: See `RAILWAY_DEPLOYMENT.md`

**Quick Steps**:
1. Create new Railway service
2. Use config: `railway-pattern-detection.json`
3. Uses: `Dockerfile.pattern`
4. Deploy

**Features**:
- WebSocket endpoint: `/ws/live/{symbol}`
- REST endpoints: `/api/picks/top/{count}`, `/api/stock/{symbol}`, `/api/patterns/{symbol}`
- Real-time pattern detection
- Yahoo Finance integration

**URL**: `https://pattern-detection-api.up.railway.app`

---

## 3️⃣ ML Stock Screening API (Render)

**Location**: `/python/ml_api.py`

**Platform**: Render (Already Deployed) ✅

**Endpoints**:
- `GET /health` - Health check
- `POST /train` - Train ML models
- `POST /predict` - Get predictions
- `POST /screen` - Screen stocks
- `GET /status` - Training status

**Configuration**:
- Uses: `render.yaml` (ml-stock-screening service)
- Requirements: `python/requirements-ml.txt`
- Python: 3.12

**URL**: Check your Render dashboard

**No action needed** - Already deployed and working!

---

## 4️⃣ CrewAI Service

**Location**: `/crewai-service/main.py`

**Purpose**: AI-powered market analysis using CrewAI agents

### Option A: Deploy to Railway (Recommended)

#### Configuration Files
- ✅ `Dockerfile.crewai` - Docker build config
- ✅ `railway-crewai.json` - Railway config

#### Deployment Steps

1. **Create New Railway Service**:
   ```
   - Go to Railway Dashboard
   - Click "New" → "GitHub Repo"
   - Select: virtual-options-desk
   ```

2. **Configure Service**:
   ```
   - Service Name: crewai-service
   - Settings → Build & Deploy
   - Railway Config File: railway-crewai.json
   ```

3. **Set Environment Variables**:
   ```
   OPENAI_API_KEY=your_openai_key
   PORT=${{PORT}}
   ```

4. **Deploy** and Railway will build!

#### Railway URL
`https://crewai-service.up.railway.app`

### Option B: Deploy to Render

1. **Add to render.yaml**:

   Edit your `render.yaml` and add:

   ```yaml
   - type: web
     name: crewai-service
     runtime: python
     plan: free
     buildCommand: pip install -r crewai-service/requirements.txt
     startCommand: uvicorn crewai-service.main:app --host 0.0.0.0 --port $PORT
     envVars:
       - key: PYTHON_VERSION
         value: 3.12.0
       - key: OPENAI_API_KEY
         sync: false
   ```

2. **Push to GitHub** and Render will auto-deploy

#### Render URL
Check your Render dashboard after deployment

---

## 5️⃣ Svelte Chart App (Vercel - Separate Repo)

**Repository**: `lggg123/Svelte-chart-app`

**Purpose**: Real-time candlestick charts with pattern detection

**Deployment**: See `docs/SVELTE_INTEGRATION.md` and `docs/SVELTE_DEPLOYMENT_CONFIG.md`

**Configuration**:
1. Deploy Svelte app to Vercel (separate repo)
2. Set environment variables:
   ```
   VITE_API_URL=https://pattern-detection-api.up.railway.app
   VITE_WS_URL=wss://pattern-detection-api.up.railway.app
   ```

**URL**: `https://svelte-chart-app.vercel.app`

---

## 🎯 Recommended Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                                                              │
│  Next.js Web App (Vercel)                                   │
│  https://virtual-options-desk.vercel.app                    │
│                                                              │
│  Svelte Chart App (Vercel - separate repo)                  │
│  https://svelte-chart-app.vercel.app                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTPS/WSS
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND APIS                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pattern Detection API (Railway)                      │   │
│  │ - WebSocket real-time data                          │   │
│  │ - Pattern detection                                  │   │
│  │ - Market data integration                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ML Stock Screening API (Render)                     │   │
│  │ - ML predictions                                     │   │
│  │ - Stock screening                                    │   │
│  │ - Model training                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CrewAI Service (Railway or Render)                  │   │
│  │ - AI market analysis                                 │   │
│  │ - CrewAI agents                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Deployment Checklist

### Frontend
- [ ] Next.js deployed to Vercel
- [ ] Root directory set to `frontend`
- [ ] Environment variables configured
- [ ] Supabase credentials added
- [ ] Build successful

### Backend APIs
- [ ] Pattern Detection API deployed to Railway
- [ ] ML Stock Screening API on Render (already done ✅)
- [ ] CrewAI Service deployed (Railway or Render)
- [ ] All health checks passing
- [ ] Environment variables configured

### Svelte Chart App
- [ ] Deployed to Vercel (separate repo)
- [ ] Environment variables point to Pattern Detection API
- [ ] WebSocket connection working
- [ ] Charts displaying real-time data

---

## 🔧 Environment Variables Summary

### Next.js Frontend (Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
BLOG_SCHEDULE=0 9 * * 1-5
BLOG_TIMEZONE=America/New_York
```

### Pattern Detection API (Railway)
```env
PYTHON_VERSION=3.12
PORT=${{PORT}}
```

### ML Stock Screening API (Render)
```env
PYTHON_VERSION=3.12.0
```

### CrewAI Service (Railway or Render)
```env
OPENAI_API_KEY=your_openai_key
PYTHON_VERSION=3.12
PORT=${{PORT}}
```

### Svelte Chart App (Vercel)
```env
VITE_API_URL=https://pattern-detection-api.up.railway.app
VITE_WS_URL=wss://pattern-detection-api.up.railway.app
```

---

## 💰 Cost Estimate

### Free Tier Usage

| Platform | Service | Free Tier | Cost |
|----------|---------|-----------|------|
| Vercel | Next.js Frontend | Unlimited hobby projects | **FREE** |
| Vercel | Svelte Chart App | Unlimited hobby projects | **FREE** |
| Railway | Pattern Detection API | $5 credit/month | **~$0-5/mo** |
| Railway | CrewAI Service | $5 credit/month | **~$0-5/mo** |
| Render | ML Stock Screening | 750 hours/month | **FREE** |
| **TOTAL** | All services | | **~$0-10/mo** |

### Paid Options (If Needed)

- **Railway Hobby**: $5/month per project (better performance)
- **Render Starter**: $7/month per service (no cold starts)
- **Vercel Pro**: $20/month (higher limits, faster builds)

---

## 🐛 Troubleshooting

### Service Won't Start

**Check logs** on the respective platform:
- **Vercel**: Deployment logs in dashboard
- **Railway**: Service → Deployments → View Logs
- **Render**: Service → Logs tab

### WebSocket Connection Fails

1. **Check CORS**: Pattern Detection API allows your domain
2. **Use WSS**: Production must use `wss://` not `ws://`
3. **Check URL**: Verify correct Railway/Render URL

### ML API Cold Starts (Render)

Render free tier has cold starts (~30-60s). Solutions:
1. Use UptimeRobot to keep warm (ping every 5 min)
2. Upgrade to Render Starter plan ($7/mo)

### Railway Build Fails

1. **Check Dockerfile**: Ensure correct path in railway config
2. **Check requirements**: Verify all dependencies are listed
3. **Python version**: Ensure Python 3.12 compatibility

---

## 📚 Additional Documentation

- `VERCEL_DEPLOYMENT.md` - Next.js deployment guide
- `RAILWAY_DEPLOYMENT.md` - Pattern Detection API guide
- `RENDER_DEPLOYMENT.md` - ML API deployment guide
- `docs/SVELTE_INTEGRATION.md` - Svelte app integration
- `docs/SVELTE_DEPLOYMENT_CONFIG.md` - Svelte configuration
- `docs/IOS_API_REFERENCE.md` - iOS app API reference

---

## 🎉 Quick Start - Deploy Everything

```bash
# 1. Frontend (Vercel)
# - Connect GitHub repo to Vercel
# - Set root directory to "frontend"
# - Add environment variables
# - Deploy

# 2. Pattern Detection API (Railway)
# - Create new Railway project from GitHub
# - Use railway-pattern-detection.json
# - Deploy

# 3. CrewAI Service (Railway)
# - Add new service to Railway project
# - Use railway-crewai.json
# - Deploy

# 4. ML API (Render)
# - Already deployed! ✅

# 5. Svelte Chart App (Vercel - separate repo)
# - Deploy Svelte-chart-app repo to Vercel
# - Update env vars with Railway URL
# - Deploy
```

---

**Created**: October 6, 2025  
**Status**: Complete Deployment Guide Ready 🚀  
**All Services**: Ready to Deploy!
