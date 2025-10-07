# 🔑 Environment Variables Checklist

Complete list of all API keys and environment variables needed for deployment.

## ✅ Required Variables

### 1. Supabase (Database & Auth) - REQUIRED

**Where**: Frontend (Vercel), Backend APIs (Railway/Render)

```bash
# Frontend & Backend
NEXT_PUBLIC_SUPABASE_URL=https://qcwtkyxvejcogbhbauey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjd3RreXh2ZWpjb2diaGJhdWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzg5NDcsImV4cCI6MjA3NTM1NDk0N30.v6sLdGX4o8tVwMWiPeZGKxAhHE_SKh-vMP1RqrAYGQo

# Backend Only (API routes, Python services)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-from-supabase>
```

**How to Get**:
1. Supabase Dashboard → Settings → API
2. Copy URL and keys

**Status**: ✅ You have URL and anon key, need service_role key

---

### 2. OpenAI API (CrewAI Service) - REQUIRED for AI Analysis

**Where**: CrewAI Service (Railway)

```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview  # Optional, defaults to GPT-4
```

**How to Get**:
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

**Cost**: ~$0.05-$0.15 per analysis request (GPT-4) or ~$0.01 with GPT-3.5

**Status**: ⚠️ NEEDED for CrewAI service

---

### 3. Railway Auto-Set Variables

**Where**: Railway services (Pattern Detection, CrewAI)

```bash
PORT=${{PORT}}  # Auto-set by Railway, don't add manually
PYTHON_VERSION=3.12  # Optional but recommended
```

**Status**: ✅ Railway sets automatically

---

## 📊 Optional Variables (Market Data APIs)

### 4. Alpha Vantage (Market Data) - OPTIONAL

**Where**: Frontend (Vercel)

```bash
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

**How to Get**:
1. Go to: https://www.alphavantage.co/support/#api-key
2. Enter email
3. Get free key instantly

**Free Tier**: 25 API calls/day, 5 calls/minute

**Status**: ⚠️ Optional - Only needed if using Alpha Vantage for market data

---

### 5. Finnhub (Market Data) - OPTIONAL

**Where**: Frontend (Vercel)

```bash
FINNHUB_API_KEY=your_finnhub_key
```

**How to Get**:
1. Go to: https://finnhub.io/register
2. Sign up
3. Get API key from dashboard

**Free Tier**: 60 calls/minute

**Status**: ⚠️ Optional - Only needed if using Finnhub

---

### 6. Polygon.io (Market Data) - OPTIONAL

**Where**: Frontend (Vercel)

```bash
POLYGON_API_KEY=your_polygon_key
```

**How to Get**:
1. Go to: https://polygon.io/pricing
2. Sign up for free tier
3. Get API key

**Free Tier**: 5 API calls/minute

**Status**: ⚠️ Optional - Only needed if using Polygon.io

---

### 7. Financial Modeling Prep (Market Data) - OPTIONAL

**Where**: Frontend (Vercel)

```bash
FMP_API_KEY=your_fmp_key
```

**How to Get**:
1. Go to: https://site.financialmodelingprep.com/developer/docs
2. Sign up
3. Get API key

**Status**: ⚠️ Optional

---

### 8. EODHD (Market Data) - OPTIONAL

**Where**: Frontend (Vercel)

```bash
EODHD_API_KEY=your_eodhd_key
```

**How to Get**:
1. Go to: https://eodhd.com/register
2. Sign up
3. Get API key

**Status**: ⚠️ Optional

---

## 📍 Where to Add Variables

### Frontend (Vercel)

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add these:

```bash
# REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://qcwtkyxvejcogbhbauey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=<get-from-supabase>

# OPTIONAL (Market Data - only if using these providers)
ALPHA_VANTAGE_API_KEY=your_key
FINNHUB_API_KEY=your_key
POLYGON_API_KEY=your_key
FMP_API_KEY=your_key
EODHD_API_KEY=your_key
```

---

### Pattern Detection API (Railway)

1. Railway Dashboard → pattern-detection-api service
2. Variables tab
3. Add these:

```bash
# Auto-set by Railway (don't add)
PORT=${{PORT}}

# Recommended
PYTHON_VERSION=3.12

# OPTIONAL (only if using paid market data APIs)
ALPHA_VANTAGE_API_KEY=your_key
FINNHUB_API_KEY=your_key
```

**Note**: Pattern Detection uses **Yahoo Finance** (free, no API key) by default, so these are optional!

---

### CrewAI Service (Railway)

1. Railway Dashboard → crewai-market-analysis service
2. Variables tab
3. Add these:

```bash
# REQUIRED
OPENAI_API_KEY=sk-your-openai-api-key

# Auto-set by Railway
PORT=${{PORT}}

# OPTIONAL
OPENAI_MODEL=gpt-4-turbo-preview
PYTHON_VERSION=3.12
```

---

### ML Stock Screening API (Render)

1. Render Dashboard → ml-stock-screening service
2. Environment tab
3. Add these:

```bash
PYTHON_VERSION=3.12
```

**Note**: ML API uses Yahoo Finance (free, no API key required)

---

## 🔐 Local Development (.env.local)

Create `frontend/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qcwtkyxvejcogbhbauey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjd3RreXh2ZWpjb2diaGJhdWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3Nzg5NDcsImV4cCI6MjA3NTM1NDk0N30.v6sLdGX4o8tVwMWiPeZGKxAhHE_SKh-vMP1RqrAYGQo
SUPABASE_SERVICE_ROLE_KEY=<get-from-supabase-dashboard>

# OpenAI (if testing CrewAI locally)
OPENAI_API_KEY=sk-your-openai-key

# Market Data APIs (optional)
ALPHA_VANTAGE_API_KEY=your_key
FINNHUB_API_KEY=your_key
POLYGON_API_KEY=your_key
```

---

## 📊 Priority Summary

### 🔴 HIGH PRIORITY (Needed NOW)

1. ✅ **NEXT_PUBLIC_SUPABASE_URL** - You have it
2. ✅ **NEXT_PUBLIC_SUPABASE_ANON_KEY** - You have it
3. ⚠️ **SUPABASE_SERVICE_ROLE_KEY** - Get from Supabase Dashboard → Settings → API
4. ⚠️ **OPENAI_API_KEY** - Get from https://platform.openai.com/api-keys (for CrewAI)

### 🟡 MEDIUM PRIORITY (Optional but Useful)

5. **ALPHA_VANTAGE_API_KEY** - Free, 25 calls/day (market data backup)
6. **FINNHUB_API_KEY** - Free, 60 calls/min (market data backup)

### 🟢 LOW PRIORITY (Nice to Have)

7. **POLYGON_API_KEY** - Paid options data
8. **FMP_API_KEY** - Alternative market data
9. **EODHD_API_KEY** - Alternative market data

---

## ✅ Current Setup Status

| Service | Platform | Variables Needed | Status |
|---------|----------|------------------|--------|
| **Frontend** | Vercel | Supabase URL/Keys | ⚠️ Need service_role key |
| **Pattern Detection** | Railway | None (uses Yahoo Finance) | ✅ Ready |
| **CrewAI Service** | Railway | OPENAI_API_KEY | ⚠️ Need OpenAI key |
| **ML API** | Render | None (uses Yahoo Finance) | ✅ Ready |

---

## 🎯 Next Steps

### Step 1: Get Supabase Service Role Key
```bash
1. Supabase Dashboard: https://supabase.com/dashboard
2. Your Project → Settings → API
3. Find "service_role" section
4. Copy the "secret" key (very long token)
5. Add to Vercel environment variables
```

### Step 2: Get OpenAI API Key (for CrewAI)
```bash
1. OpenAI Platform: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name it: "virtual-options-desk"
4. Copy key (starts with sk-)
5. Add to Railway → CrewAI service → Variables
```

### Step 3: Optional Market Data APIs
```bash
Only needed if you want to use these specific providers:
- Alpha Vantage: https://www.alphavantage.co/support/#api-key
- Finnhub: https://finnhub.io/register
- Polygon: https://polygon.io/pricing

Default: Yahoo Finance (FREE, no API key needed!)
```

---

## 💡 Important Notes

### Security

- ✅ **NEXT_PUBLIC_*** variables are SAFE to expose (used in frontend)
- 🔒 **Service role keys** should NEVER be in frontend code
- 🔒 **OpenAI keys** should NEVER be in frontend code
- 🔒 All secret keys should be in backend/environment variables only

### Free Tier Limits

**Yahoo Finance** (Default):
- ✅ FREE unlimited use
- ✅ No API key required
- ✅ Already configured in Pattern Detection & ML APIs

**Supabase**:
- 500MB database
- 2GB bandwidth/month
- Unlimited API requests
- ✅ More than enough for development

**OpenAI**:
- Pay-as-you-go ($0.05-$0.15 per request with GPT-4)
- ~$10/month if used moderately
- Can use GPT-3.5 for cheaper ($0.01 per request)

### Cost Estimate

**Free Tier** (no OpenAI):
- Vercel: FREE
- Railway: $5/month credit (covers 2 services)
- Render: 750 hours/month FREE
- **Total: $0/month** ✅

**With OpenAI** (moderate use):
- Above + OpenAI: ~$10-20/month
- **Total: ~$10-20/month**

---

## 🚀 Ready to Deploy Checklist

- [ ] Supabase project created
- [ ] Database schemas run (supabase_auth_schema.sql)
- [ ] NEXT_PUBLIC_SUPABASE_URL added to Vercel
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY added to Vercel
- [ ] SUPABASE_SERVICE_ROLE_KEY added to Vercel
- [ ] OPENAI_API_KEY added to Railway (CrewAI service)
- [ ] Pattern Detection deployed to Railway (no extra keys needed)
- [ ] ML API deployed to Render (no extra keys needed)
- [ ] Frontend deployed to Vercel (Root Directory: `frontend`)
- [ ] Test signup/login functionality
- [ ] Test CrewAI analysis endpoint

---

**Last Updated**: October 7, 2025  
**Status**: Ready to deploy with minimal required keys! 🚀
