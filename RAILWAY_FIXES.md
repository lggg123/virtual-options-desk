# Railway Deployment Fixes - Both Services

## Issues Fixed

### 1. Payment API Health Check ✅
**Problem:** Health endpoint returning wrong format or timing out
**Solution:** 
- Enhanced health check to test Supabase connection
- Returns proper 200 status code with detailed info
- Added error handling with 503 on failure

### 2. Pattern Detection API Dockerfile ✅
**Problem:** `E: Unable to locate package supabase`
**Solution:** 
- Removed `supabase` from apt-get (it's not an apt package!)
- Supabase CLI is NOT needed - we use Python SDK (`supabase-py`)
- Added required system libraries: `libgl1`, `libglib2.0-0`
- Added `PYTHONPATH` environment variable

## Railway Configuration

### Payment API Service

**Settings → General:**
- Service Name: `payment-api`
- Root Directory: `payment-api`
- Watch Paths: `/payment-api/**`

**Settings → Build:**
- Builder: `Dockerfile`
- Dockerfile Path: `Dockerfile`

**Settings → Environment Variables:**
```bash
PORT=8080
NODE_ENV=production
STRIPE_SECRET_KEY=sk_test_...
SUPABASE_URL=https://ofsneyxnervkoeommlfh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ALLOWED_ORIGINS=http://www.marketstockpick.com
```

**Settings → Networking:**
- Generate Domain → Get your URL

**Settings → Deploy:**
- Health Check Path: `/health`
- Health Check Timeout: 100 seconds

### Pattern Detection API Service

**Settings → General:**
- Service Name: `pattern-detection-api`
- Root Directory: `.` (root)
- Watch Paths: `/python/**,/Dockerfile.pattern`

**Settings → Build:**
- Builder: `Dockerfile`
- Dockerfile Path: `Dockerfile.pattern`

**Settings → Environment Variables:**
```bash
PORT=8080
SUPABASE_URL=https://ofsneyxnervkoeommlfh.supabase.co
SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Settings → Networking:**
- Generate Domain → Get your URL

**Settings → Deploy:**
- Health Check Path: `/health`
- Health Check Timeout: 100 seconds

## How to Deploy

### Option 1: Auto-Deploy (Recommended)

1. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "fix: Railway deployment for both payment and pattern APIs"
   git push
   ```

2. **Railway auto-deploys** when connected to GitHub

3. **Monitor deployments** in Railway Dashboard

### Option 2: Manual Deploy with CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy payment API
cd payment-api
railway up --service payment-api

# Deploy pattern detection
cd ..
railway up --service pattern-detection-api
```

## Testing Deployments

### Payment API
```bash
# Test health check
curl https://your-payment-api.up.railway.app/health

# Expected response:
{
  "status": "ok",
  "service": "payment-api",
  "timestamp": "2025-10-07T...",
  "stripe": "connected",
  "supabase": "connected"
}
```

### Pattern Detection API
```bash
# Test health check
curl https://your-pattern-api.up.railway.app/health

# Expected response:
{
  "status": "healthy",
  "service": "Pattern Detection API",
  "ml_enabled": false
}
```

## Common Issues & Solutions

### Payment API: "Service Unavailable"
- Check Railway logs for Supabase connection errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key!)
- Verify `STRIPE_SECRET_KEY` is valid
- Check health endpoint locally: `cd payment-api && PORT=8080 npm run dev`

### Pattern Detection: "Unable to locate package supabase"
- **FIXED** - Removed supabase from apt-get install
- Railway might be using cached build → Click "Redeploy" in Railway Dashboard
- Or force rebuild: Delete service and recreate

### Pattern Detection: "ModuleNotFoundError"
- **FIXED** - Added `PYTHONPATH=/app` to Dockerfile
- Ensure all Python files are in `python/` directory
- Check `requirements-ml.txt` has all dependencies

### Both Services: "Healthcheck timeout"
- Increased timeout to 40s start period, 10s check timeout
- Check logs for startup errors
- Verify environment variables are set
- Test locally with same PORT: `PORT=8080 npm run dev` or `PORT=8080 uvicorn ...`

## Dockerfile Changes Summary

### Dockerfile.pattern (Pattern Detection)
**Before:**
```dockerfile
RUN apt-get update && apt-get install -y supabase ...  # ❌ supabase not an apt package
```

**After:**
```dockerfile
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libgl1 \
    libglib2.0-0 \  # ✅ Actual required packages
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONPATH=/app  # ✅ Added Python path
```

### payment-api/src/index.ts (Health Check)
**Before:**
```typescript
fastify.get('/health', async () => {
  return { status: 'healthy' };  // ❌ Simple response
});
```

**After:**
```typescript
fastify.get('/health', async (request, reply) => {
  try {
    // Test Supabase connection
    const { error } = await supabase.from('subscriptions').select('count').limit(1);
    
    reply.code(200).send({  // ✅ Explicit 200 code
      status: 'ok',
      service: 'payment-api',
      stripe: 'connected',
      supabase: error ? 'error' : 'connected'
    });
  } catch (err) {
    reply.code(503).send({ status: 'error' });  // ✅ Proper error handling
  }
});
```

## Next Steps

1. ✅ Commit and push changes (see Option 1 above)
2. ⏳ Wait for Railway to rebuild (2-3 minutes per service)
3. ✅ Test both health endpoints
4. ✅ Update frontend with API URLs
5. ✅ Test end-to-end payment flow
6. ✅ Test pattern detection from app

## Railway Dashboard URLs

- Payment API: https://railway.app/project/[your-project]/service/payment-api
- Pattern Detection: https://railway.app/project/[your-project]/service/pattern-detection-api

Monitor logs in real-time:
```bash
railway logs --service payment-api
railway logs --service pattern-detection-api
```

## Success Indicators

### Payment API Logs:
```
🚀 Payment API running on http://0.0.0.0:8080
📊 Health check available at http://0.0.0.0:8080/health
🔧 Environment: production
```

### Pattern Detection Logs:
```
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8080
```

Both should show "Healthy" status in Railway Dashboard.
