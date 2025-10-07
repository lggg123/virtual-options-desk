# 🏗️ Complete Architecture & Deployment Status

## Overview
Virtual Options Desk is a comprehensive AI-powered options trading platform with multiple microservices.

---

## 🎯 Services Architecture

### 1. **Pattern Detection API** ✅ DEPLOYED
- **Status**: ✅ Successfully deployed on Railway
- **URL**: `https://[your-railway-domain].up.railway.app`
- **Port**: 8080 (Railway managed)
- **Technology**: FastAPI + Python 3.12
- **Purpose**: Real-time candlestick pattern detection using AI/ML

**Endpoints**:
- `GET /` - Service info
- `GET /health` - Health check
- `POST /detect` - Detect patterns from candlestick data
- `POST /detect/realtime` - Real-time pattern detection
- `GET /patterns/types` - List supported patterns
- `GET /api/picks/top/{count}` - Get top stock picks (basic yfinance data)
- `WebSocket /ws/detect/{symbol}` - Real-time streaming detection

**Environment Variables**:
```env
PORT=${{PORT}}  # Railway auto-assigned
```

---

### 2. **CrewAI Analysis Service** ✅ DEPLOYED  
- **Status**: ✅ Successfully deployed on Railway
- **URL**: `https://[your-crewai-domain].up.railway.app`
- **Port**: 8080 (Railway managed)
- **Technology**: FastAPI + CrewAI + LangChain + OpenAI
- **Purpose**: Advanced market analysis using AI agents

**Endpoints**:
- `GET /` - Service info
- `GET /health` - Health check
- `POST /analyze` - Comprehensive market analysis with AI agents

**Environment Variables**:
```env
OPENAI_API_KEY=sk-...  # Required for CrewAI agents
PORT=${{PORT}}          # Railway auto-assigned
```

**AI Agents**:
- Market Analyst Agent
- Risk Manager Agent
- Strategy Expert Agent

---

### 3. **ML Stock Screening API** ⚠️ NEEDS DEPLOYMENT
- **Status**: ⚠️ **NOT YET DEPLOYED** - Code ready, needs deployment
- **Recommended Platform**: Render or Railway
- **Port**: 8002
- **Technology**: FastAPI + ML Ensemble (XGBoost, Random Forest, LightGBM, LSTM)
- **Purpose**: **THIS IS THE "200 FACTORS" AI PICKS API**

**Endpoints**:
- `GET /` - Service info
- `GET /health` - Health check
- `POST /api/ml/train` - Train ML models with stock factors
- `GET /api/ml/status` - Check training status
- `POST /api/ml/predict` - Generate stock predictions
- `POST /api/ml/screen` - **Monthly screening with 200+ factors**
- `GET /api/ml/feature-importance` - Get feature importance analysis
- `DELETE /api/ml/models` - Clean up models

**Environment Variables**:
```env
PORT=8002
ML_MODEL_PATH=./ml_models
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**ML Models**:
1. **XGBoost** - Gradient boosting
2. **Random Forest** - Ensemble learning
3. **LightGBM** - Fast gradient boosting
4. **LSTM** (optional) - Deep learning for time series

**The 200+ Factors**:
The ML ensemble analyzes stocks using **200+ features** across 4 categories:

1. **Fundamental Factors** (~50 factors)
   - P/E, P/B, P/S, EV/EBITDA ratios
   - ROE, ROA, ROIC profitability metrics
   - Revenue growth, earnings growth
   - Debt ratios, liquidity ratios
   - Cash flow metrics

2. **Technical Factors** (~50 factors)
   - RSI, MACD, ADX indicators
   - Moving averages (SMA, EMA)
   - Bollinger Bands, ATR
   - Volume indicators
   - Price momentum metrics

3. **Sentiment Factors** (~50 factors)
   - News sentiment analysis
   - Social media sentiment
   - Analyst ratings
   - Institutional ownership changes
   - Options flow analysis

4. **Market Factors** (~50 factors)
   - Sector performance
   - Market correlation
   - Beta, volatility metrics
   - Relative strength vs market
   - Liquidity metrics

**Process**:
```python
# Monthly screening pipeline
1. Load universe of stocks (1000+)
2. Calculate 200+ factors for each stock
3. Run through 4 ML models
4. Ensemble predictions
5. Rank stocks by AI score
6. Save top picks to Supabase
```

---

### 4. **Next.js Frontend** ⚠️ NEEDS DEPLOYMENT
- **Status**: ⚠️ **NOT YET DEPLOYED** - Code ready
- **Recommended Platform**: Vercel
- **Technology**: Next.js 14 + TypeScript + React
- **Purpose**: Web UI for all services

**Features**:
- Real-time pattern detection charts
- AI market analysis dashboard
- ML stock picks screening results
- Portfolio tracking
- Authentication with Supabase

**Environment Variables**:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# API URLs
PATTERN_DETECTION_API_URL=https://pattern-api.up.railway.app
CREWAI_API_URL=https://crewai-api.up.railway.app
ML_SERVICE_URL=https://ml-screening-api.onrender.com

# OpenAI (for blog generation)
OPENAI_API_KEY=sk-...

# Market Data (optional)
ALPHA_VANTAGE_API_KEY=...
FINNHUB_API_KEY=...
```

**API Routes** (Next.js → Python backends):
- `/api/patterns/detect` → Pattern Detection API
- `/api/crewai/analyze` → CrewAI Service
- `/api/ml/train` → ML Screening API
- `/api/ml/predict` → ML Screening API
- `/api/ml/screen` → ML Screening API

---

### 5. **Supabase Database** ✅ CONFIGURED
- **Status**: ✅ Setup complete
- **URL**: `https://qcwtkyxvejcogbhbauey.supabase.co`
- **Purpose**: PostgreSQL database with real-time subscriptions

**Tables**:
1. **profiles** - User profiles
2. **portfolios** - User portfolios
3. **positions** - Trading positions
4. **monthly_screens** - Tracks ML screening runs
5. **stock_picks** - **AI-generated stock picks with 200 factors**
6. **stock_factors** - Detailed factor breakdown per stock
7. **analysis_cache** - Cached market analysis

**Key Features**:
- Row Level Security (RLS) enabled
- Real-time subscriptions for live updates
- Authentication built-in
- Storage for ML models (optional)

---

## 🚀 Deployment Checklist

### ✅ Already Deployed
- [x] Pattern Detection API → Railway
- [x] CrewAI Service → Railway
- [x] Supabase Database → Supabase Cloud

### ⚠️ Still Needed
- [ ] **ML Stock Screening API** (The 200 factors API) → Deploy to Render or Railway
- [ ] **Next.js Frontend** → Deploy to Vercel
- [ ] Configure environment variables on all platforms
- [ ] Connect frontend to all backend APIs
- [ ] Generate Railway/Render public domains
- [ ] Test end-to-end integration

---

## 📦 What is the "200 Factors AI Picks"?

**File**: `python/ml_api.py` + `python/ml_ensemble.py`

This is the **ML Stock Screening API** that:

1. **Analyzes 1000+ stocks monthly** using machine learning
2. **Calculates 200+ features** per stock across fundamental, technical, sentiment, and market factors
3. **Runs 4 ML models** (XGBoost, Random Forest, LightGBM, LSTM) to predict future performance
4. **Generates AI scores** (0-100) for each stock
5. **Ranks stocks** and saves top picks to Supabase `stock_picks` table
6. **Provides feature importance** to show which factors matter most

**Example API Call**:
```bash
# Run monthly screening
POST /api/ml/screen
{
  "symbols": ["AAPL", "MSFT", "GOOGL", ...],  # 1000+ symbols
  "top_n": 100,
  "save_to_db": true
}

# Response
{
  "screen_id": "uuid",
  "top_picks": [
    {
      "symbol": "AAPL",
      "ai_score": 87.5,
      "rank": 1,
      "predicted_return": 15.2,
      "confidence": 0.85,
      "risk_score": 32.1,
      "factor_scores": {
        "fundamental": 82,
        "technical": 78,
        "sentiment": 91,
        "market": 85
      },
      "model_contributions": {
        "xgboost": 88,
        "random_forest": 85,
        "lightgbm": 89,
        "lstm": 88
      }
    },
    ...
  ]
}
```

---

## 💰 Payment/Subscription System

**Status**: ❌ **NOT IMPLEMENTED**

Currently, there is **NO payment or subscription system** in the codebase. To add this, you would need to:

1. **Choose a payment provider**:
   - Stripe (recommended)
   - Paddle
   - LemonSqueezy

2. **Implement subscription tiers**:
   - Free: Limited access (10 picks/month)
   - Premium: Full access (100 picks/month)
   - Pro: Unlimited + real-time alerts

3. **Add to codebase**:
   - `src/app/api/stripe/checkout/route.ts` - Create checkout
   - `src/app/api/stripe/webhook/route.ts` - Handle webhooks
   - Database: Add `subscriptions` table
   - Middleware: Check subscription status before API calls

4. **Stripe Integration Example**:
```typescript
// src/app/api/stripe/checkout/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { priceId, userId } = await req.json();
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: { userId }
  });
  
  return Response.json({ url: session.url });
}
```

---

## 🎯 Next Steps

### Priority 1: Deploy ML Stock Screening API
This is the core "200 factors AI picks" service.

**Option A: Railway**
```bash
# Railway Settings
Root Directory: python
Custom Build Command: apt-get update && apt-get install -y python3 python3-pip libgl1 libglib2.0-0 && python3 -m pip install --break-system-packages -r requirements-ml.txt && chmod +x start-ml-service.sh
Custom Start Command: ./start-ml-service.sh
Environment Variables:
  PORT=${{PORT}}
  SUPABASE_URL=...
  SUPABASE_SERVICE_ROLE_KEY=...
```

**Option B: Render**
```yaml
# render.yaml
services:
  - type: web
    name: ml-stock-screening-api
    env: python
    buildCommand: pip install -r requirements-ml.txt
    startCommand: python python/ml_api.py
    envVars:
      - key: PYTHON_VERSION
        value: 3.12.0
      - key: PORT
        value: 8002
```

### Priority 2: Deploy Frontend to Vercel
```bash
# Vercel deployment
vercel --prod

# Set environment variables in Vercel dashboard:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- PATTERN_DETECTION_API_URL
- CREWAI_API_URL
- ML_SERVICE_URL
```

### Priority 3: Test End-to-End
1. Generate Railway domains for all services
2. Update frontend environment variables with API URLs
3. Test pattern detection
4. Test CrewAI analysis
5. Test ML screening (train models → run screening → view picks)
6. Verify Supabase data saving

### Priority 4: (Optional) Add Payments
1. Create Stripe account
2. Implement subscription logic
3. Add payment UI to frontend
4. Test checkout flow

---

## 📊 Service Dependencies

```
┌─────────────────────────────────────────────────────┐
│                  Next.js Frontend                   │
│                     (Vercel)                        │
│                                                     │
│  - Pattern Detection UI                            │
│  - ML Stock Picks Dashboard                        │
│  - CrewAI Analysis Dashboard                       │
│  - Portfolio Tracking                              │
└─────────────────────────────────────────────────────┘
           │            │              │
           ▼            ▼              ▼
┌──────────────┐  ┌───────────┐  ┌──────────────────┐
│   Pattern    │  │  CrewAI   │  │  ML Screening    │
│  Detection   │  │  Service  │  │   API (8002)     │
│   (Railway)  │  │ (Railway) │  │  (Render/Railway)│
│              │  │           │  │                  │
│  - Detect    │  │ - AI      │  │ - 200 Factors   │
│  - Real-time │  │   Agents  │  │ - ML Models     │
│  - WebSocket │  │ - Analysis│  │ - Screening     │
└──────────────┘  └───────────┘  └──────────────────┘
           │            │              │
           └────────────┴──────────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │   Supabase Database │
            │   (PostgreSQL)      │
            │                     │
            │ - stock_picks       │
            │ - stock_factors     │
            │ - portfolios        │
            │ - positions         │
            └─────────────────────┘
```

---

## 🔑 Required API Keys Summary

### Already Have
- ✅ Supabase URL + Keys
- ✅ OpenAI API Key (for CrewAI)

### Still Need (Optional)
- ❌ Stripe API Keys (if adding payments)
- ❌ Alpha Vantage API Key (for real-time market data)
- ❌ Finnhub API Key (alternative market data)
- ❌ Polygon.io API Key (premium market data)

---

## 💡 Key Insights

1. **Pattern Detection** = Already working on Railway ✅
2. **CrewAI Analysis** = Already working on Railway ✅
3. **ML Stock Screening (200 factors)** = CODE EXISTS but NOT deployed yet ⚠️
4. **Frontend** = CODE EXISTS but NOT deployed yet ⚠️
5. **Payments** = NOT IMPLEMENTED, need to add ❌

The **ML Stock Screening API** (`python/ml_api.py`) is the missing piece that provides the "200 factors AI picks" functionality. This needs to be deployed next!
