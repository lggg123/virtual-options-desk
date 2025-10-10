# 🚀 QUICK START: Deploy ML Models to Railway

## 📝 TL;DR

1. **Push code to GitHub** (if not already done)
2. **Railway Dashboard** → New Service → GitHub Repo
3. **Critical Setting**: Root Directory = `python`
4. **Add env vars**: SUPABASE_URL, SUPABASE_SERVICE_KEY
5. **Deploy** and watch it go! 🎉

---

## ✅ Pre-Flight Checklist

Make sure these are committed and pushed:

```bash
# Check if ML models are in git
git ls-files ml_models/

# Should show:
# ml_models/xgboost.pkl
# ml_models/random_forest.pkl
# ml_models/lightgbm.pkl
# ml_models/feature_engineer.pkl
# ml_models/metadata.json
# ml_models/premium/lstm.pth
# ml_models/premium/lstm_scaler.pkl
# ml_models/premium/lstm_metadata.json
```

If not, commit them:
```bash
git add ml_models/ python/ Dockerfile.pattern
git commit -m "Add trained ML models for deployment"
git push origin main
```

---

## 🚂 Railway UI Setup (5 Minutes)

### Step 1: Create Service

1. Go to: https://railway.app/dashboard
2. Click your project (or create new one)
3. Click **"+ New"**
4. Select **"GitHub Repo"**
5. Choose: **`lggg123/virtual-options-desk`**
6. Click **"Add Service"**

### Step 2: Configure Service

Click your new service, then:

#### A. Name it (optional)
```
Service Name: pattern-detection-api
```

#### B. Set Root Directory (CRITICAL!)
```
Settings → Root Directory → python
```
⚠️ Must be exactly: `python` (no slashes, lowercase)

#### C. Builder Settings
```
Settings → Build → Builder: Dockerfile
Settings → Build → Dockerfile Path: ../Dockerfile.pattern
```

Railway will auto-detect this, but verify it's set correctly.

### Step 3: Add Environment Variables

Click **"Variables"** tab:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...your-service-key
```

**Don't add PORT** - Railway sets this automatically!

### Step 4: Deploy!

Click **"Deploy"** or push to main branch (auto-deploys)

---

## 📊 What to Expect

### Build Phase (3-5 min):
```
Building...
→ Detected Dockerfile
→ Installing system dependencies (gcc, g++, libgl1)
→ Installing Python packages...
  ✓ xgboost 3.0.5
  ✓ lightgbm 4.6.0  
  ✓ torch 2.1.0
  ✓ scikit-learn
  ✓ fastapi, uvicorn
→ Copying application code
→ Copying ML models (11.8MB)
✓ Build complete!
```

### Deploy Phase (10-15 sec):
```
Deploying...
→ Starting container
→ Loading ML models...
  ✓ XGBoost (217KB)
  ✓ Random Forest (9.1MB)
  ✓ LightGBM (1.4MB)
  ✓ LSTM from premium/ (819KB)
→ Starting uvicorn on 0.0.0.0:8080
✓ Health check passed
✓ Service is live!
```

---

## 🧪 Test Your Deployment

### 1. Get Your Railway URL

In service dashboard, copy the URL:
```
https://pattern-detection-api-production.up.railway.app
```

### 2. Test Health Endpoint

```bash
curl https://your-service.railway.app/health

# Expected:
{
  "status": "healthy",
  "ml_enabled": true
}
```

### 3. Test ML Predictions (with auth)

```bash
curl -X POST https://your-service.railway.app/api/ml/screen \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"symbol": "AAPL", "timeframe": "1d"}'
```

---

## 🎯 Railway Configuration Summary

| Setting | Value |
|---------|-------|
| **Root Directory** | `python` ← CRITICAL! |
| **Builder** | Dockerfile |
| **Dockerfile Path** | `../Dockerfile.pattern` |
| **Port** | Auto (Railway sets $PORT) |
| **Memory** | ~250MB with models |
| **Build Time** | 3-5 minutes |
| **Deploy Time** | 10-15 seconds |
| **Models Included** | 11.8MB (4 models) |

---

## 🚨 Common Issues & Quick Fixes

### ❌ "Root directory '__pycache__' not found"
**Fix**: Settings → Root Directory → `python`

### ❌ "No module named 'xgboost'"
**Fix**: Check Dockerfile copies `requirements-ml.txt` and installs it

### ❌ "ml_models/ directory not found"
**Fix**: 
```bash
# Verify models are in git
git ls-files ml_models/

# If empty, add them:
git add ml_models/
git commit -m "Add ML models"
git push
```

### ❌ Port binding error
**Fix**: Dockerfile uses `${PORT:-8080}` - Railway sets PORT automatically

### ✅ Build succeeds but models don't load
**Check**: Dockerfile.pattern includes this line:
```dockerfile
COPY ml_models/ ./ml_models/
```

---

## 📱 Update Your Frontend

After deployment, update your Next.js `.env.local`:

```bash
# Add your Railway service URL
NEXT_PUBLIC_PATTERN_API_URL=https://your-service.railway.app
```

Redeploy frontend on Vercel.

---

## 🎉 Success Criteria

✅ Railway build completes (green checkmark)  
✅ Service shows "Running" status  
✅ Health check endpoint returns 200  
✅ Logs show "Loading ML models..."  
✅ Logs show "Uvicorn running on..."  
✅ No error messages in logs  
✅ Frontend can connect to API  

---

## 📊 Monitor Your Service

### Railway Dashboard → Your Service:

1. **Deployments**: See build/deploy history
2. **Logs**: Real-time application logs
3. **Metrics**: CPU, Memory, Network usage
4. **Settings**: Change configuration
5. **Variables**: Manage environment variables

### Key Logs to Watch:

```bash
# Good signs:
✓ "Installing xgboost"
✓ "Installing lightgbm"
✓ "Loading ML models from ml_models/"
✓ "Models loaded: ['xgboost', 'random_forest', 'lightgbm']"
✓ "Uvicorn running on http://0.0.0.0:8080"

# Bad signs (troubleshoot if you see):
✗ "No module named 'xgboost'"
✗ "FileNotFoundError: ml_models/ not found"
✗ "Port already in use"
✗ "Health check failed"
```

---

## 🔗 Resources

- **Full Guide**: See `RAILWAY_ML_DEPLOYMENT_GUIDE.md`
- **ML Models Info**: See `ML_DEPLOYMENT_READY.md`
- **Dockerfile**: `Dockerfile.pattern`
- **Requirements**: `python/requirements-ml.txt`
- **Railway Docs**: https://docs.railway.app

---

## ⏱️ Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Git push | < 1 min | ✅ Ready |
| Railway setup | 2-3 min | 👉 **Start here** |
| Build | 3-5 min | ⏳ Automated |
| Deploy | 10-15 sec | ⏳ Automated |
| Test | 1-2 min | ✅ Manual |
| **Total** | **~10 minutes** | 🚀 |

---

## 🎯 You're Ready!

Everything is set up for deployment:
- ✅ ML models trained and committed
- ✅ Dockerfile updated to copy models
- ✅ Requirements include all dependencies
- ✅ Code has `use_ml=True` enabled
- ✅ Tests passing locally

**Just follow the 4 steps at the top and you're live!** 🚀

---

## 💡 Pro Tips

1. **First deployment takes longer** - Railway caches layers for subsequent deploys
2. **Watch the logs** - Real-time feedback helps catch issues early
3. **Test health endpoint first** - Ensures service is running before testing ML
4. **Start with small test** - Send one prediction request before load testing
5. **Monitor memory** - Railway shows usage in metrics tab

---

**Ready to deploy? Let's go! 🚀**
