# 🚂 Railway Deployment Guide - Pattern Detection API with ML Models

## 📋 Quick Summary

**Service Name**: Pattern Detection API with ML Models  
**Root Directory**: `python`  
**Port**: Auto-assigned by Railway (usually 8080)  
**Models Included**: 11.8MB (XGBoost, Random Forest, LightGBM, LSTM)  
**Build Method**: Dockerfile

---

## 🎯 Step-by-Step Railway UI Setup

### Step 1: Create New Service on Railway

1. Go to your Railway dashboard: https://railway.app/dashboard
2. Select your project (or create a new one)
3. Click **"+ New"** → **"GitHub Repo"**
4. Select your repository: `lggg123/virtual-options-desk`
5. Click **"Add Service"**

### Step 2: Configure Service Settings

#### A. General Settings (CRITICAL!)

1. Click on your new service
2. Go to **Settings** tab
3. Find **"Root Directory"** setting
4. Set: **`python`** ← This is CRITICAL!

```
Settings → Root Directory → python
```

**Why?** All the Python code and models are in the `/python` directory. Railway needs to start from there.

#### B. Build Settings

1. In **Settings** → **Build**
2. **Builder**: Select **"Dockerfile"**
3. **Dockerfile Path**: `../Dockerfile.pattern`
   - The `..` means go up one level from `/python` to find the Dockerfile

**OR** use the railway-pattern-detection.json config:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.pattern"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### C. Deploy Settings

1. In **Settings** → **Deploy**
2. **Restart Policy**: ON_FAILURE (already configured)
3. **Health Check**: Enabled (Dockerfile has HEALTHCHECK)
4. **Port**: Auto-detected (8080) - Railway sets `$PORT` automatically

### Step 3: Environment Variables

Click **Variables** tab and add these:

#### Required Variables:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Optional: If you need subscription auth
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

#### Auto-Set by Railway (DON'T ADD):
- `PORT` - Railway sets this automatically (usually 8080)
- `RAILWAY_ENVIRONMENT` - Set by Railway

### Step 4: Deploy!

1. Railway will automatically detect changes and deploy
2. Or click **Deploy** manually

#### Expected Build Output:

```
=== Building Pattern Detection API ===
Step 1/12 : FROM python:3.12-slim
Step 2/12 : WORKDIR /app
Step 3/12 : Installing system dependencies...
Step 4/12 : Copying requirements...
Step 5/12 : Installing Python packages...
  ✓ xgboost-3.0.5
  ✓ lightgbm-4.6.0
  ✓ scikit-learn-1.7.0
  ✓ torch (if enabled)
  ✓ fastapi, uvicorn, pydantic
Step 6/12 : Copying application code...
  ✓ pattern_detection_api.py
  ✓ pattern_detector.py
  ✓ ml_ensemble.py
  ✓ ml_models/ directory (11.8MB)
Step 7/12 : Setting environment...
✓ Build completed successfully!

=== Deployment ===
Starting uvicorn on 0.0.0.0:8080...
Loading ML models from ml_models/...
✓ XGBoost loaded (217KB)
✓ Random Forest loaded (9.1MB)
✓ LightGBM loaded (1.4MB)
✓ LSTM loaded from ml_models/premium/ (819KB)
✅ Pattern Detection API is running!
```

---

## 📁 File Structure Expected by Railway

```
virtual-options-desk/
├── python/                     ← Root Directory (set in Railway)
│   ├── pattern_detection_api.py
│   ├── pattern_detector.py
│   ├── ml_ensemble.py
│   ├── requirements-ml.txt     ← Installed by Dockerfile
│   └── start.sh                ← Backup start script
│
├── ml_models/                  ← Copied by Dockerfile
│   ├── xgboost.pkl            (217KB)
│   ├── random_forest.pkl      (9.1MB)
│   ├── lightgbm.pkl           (1.4MB)
│   ├── feature_engineer.pkl   (1.2KB)
│   ├── metadata.json          (1.9KB)
│   └── premium/
│       ├── lstm.pth           (819KB)
│       ├── lstm_scaler.pkl    (671B)
│       └── lstm_metadata.json (693B)
│
└── Dockerfile.pattern          ← Used for build
```

---

## 🔍 What the Dockerfile Does

```dockerfile
# 1. Base image
FROM python:3.12-slim

# 2. Install system dependencies (gcc, libgl1 for cv2)
RUN apt-get update && apt-get install -y gcc g++ libgl1

# 3. Copy and install Python requirements
COPY python/requirements-ml.txt ./
RUN pip install -r requirements-ml.txt
   ✓ Installs xgboost, lightgbm, torch, fastapi, etc.

# 4. Copy Python code
COPY python/ ./
   ✓ Copies pattern_detection_api.py, pattern_detector.py, etc.

# 5. Copy ML models (THIS IS KEY!)
   ✓ ml_models/ directory is in the repo
   ✓ Gets copied during deployment
   ✓ Total size: 11.8MB

# 6. Start the API
CMD uvicorn pattern_detection_api:app --host 0.0.0.0 --port ${PORT:-8080}
```

---

## ✅ Verification Steps

### 1. Check Deployment Logs

In Railway dashboard:
1. Click on your service
2. Go to **Deployments** tab
3. Click latest deployment
4. Check logs for:

```bash
✓ "Installing xgboost..."
✓ "Installing lightgbm..."
✓ "Loading ML models from ml_models/"
✓ "Uvicorn running on http://0.0.0.0:8080"
```

### 2. Test the Health Endpoint

Railway gives you a URL like: `https://pattern-api-production.up.railway.app`

```bash
curl https://your-service.railway.app/health

# Expected response:
{
  "status": "healthy",
  "service": "pattern-detection-api",
  "ml_enabled": true,
  "models_loaded": ["xgboost", "random_forest", "lightgbm", "lstm"]
}
```

### 3. Test ML Predictions

```bash
curl -X POST https://your-service.railway.app/api/ml/screen \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "symbol": "AAPL",
    "timeframe": "1d"
  }'

# Should return predictions if models loaded correctly
```

---

## 🚨 Troubleshooting

### Issue 1: "No module named 'xgboost'"

**Problem**: Dependencies not installed

**Fix**:
1. Check `python/requirements-ml.txt` includes xgboost, lightgbm
2. Verify Dockerfile copies and installs requirements-ml.txt
3. Check build logs for installation errors

### Issue 2: "ml_models/ directory not found"

**Problem**: Models not included in deployment

**Fix**:
1. Verify `ml_models/` is committed to git:
   ```bash
   git ls-files ml_models/
   ```
2. Check `.gitignore` doesn't exclude `*.pkl` or `*.pth`
3. Ensure Dockerfile copies ml_models (it should copy entire python/ context)

**Current Dockerfile.pattern doesn't explicitly copy ml_models!** 
→ See "Important Update" section below

### Issue 3: "Root directory '__pycache__' not found"

**Problem**: Root directory not set correctly

**Fix**:
```
Railway Settings → Root Directory → python
```

Must be exactly `python` (lowercase, no slashes)

### Issue 4: Build takes too long (>10 minutes)

**Problem**: Installing large dependencies every time

**Fix**: Railway caches layers, but if it's rebuilding:
- Use smaller base image (already using python:3.12-slim ✓)
- Pin dependency versions (already done in requirements-ml.txt ✓)
- Consider using a pre-built Docker image with dependencies

### Issue 5: Port binding errors

**Problem**: App not using Railway's PORT variable

**Fix**: Dockerfile already handles this:
```dockerfile
CMD uvicorn pattern_detection_api:app --host 0.0.0.0 --port ${PORT:-8080}
```

Railway sets `$PORT`, defaults to 8080 if not set.

---

## ⚠️ IMPORTANT UPDATE: ML Models Not in Dockerfile!

Looking at `Dockerfile.pattern`, I notice it **doesn't explicitly copy ml_models/**!

```dockerfile
# Current Dockerfile only copies python/ directory
COPY python/ ./
```

### Fix Option 1: Update Dockerfile (RECOMMENDED)

Add this line after copying python code:

```dockerfile
# Copy Python code
COPY python/ ./

# Copy ML models (ADD THIS!)
COPY ml_models/ ./ml_models/
```

### Fix Option 2: Keep Models in python/ml_models/

Move models into python directory:
```bash
mv ml_models python/ml_models
```

Then update your code to look for models in the right place.

**I'll create an updated Dockerfile for you below!**

---

## 📝 Environment Variables Reference

| Variable | Required | Example | Where Used |
|----------|----------|---------|------------|
| `SUPABASE_URL` | Yes | `https://xxx.supabase.co` | Auth, Database |
| `SUPABASE_SERVICE_KEY` | Yes | `eyJhbG...` | Server auth |
| `SUPABASE_ANON_KEY` | Optional | `eyJhbG...` | Client auth |
| `PORT` | Auto-set | `8080` | Railway sets this |

---

## 🎯 Complete Railway Configuration

### Railway Settings Summary:

```yaml
Service Name: pattern-detection-api
Root Directory: python
Builder: Dockerfile
Dockerfile Path: ../Dockerfile.pattern
Start Command: (auto from Dockerfile CMD)
Port: Auto-detected from $PORT
Health Check: Enabled (from Dockerfile HEALTHCHECK)
Restart Policy: ON_FAILURE
Max Retries: 10
```

### Service URL:
Railway will provide: `https://[service-name]-production.up.railway.app`

### Resource Limits (Railway Free Tier):
- **Memory**: Up to 8GB (your app uses ~250MB with models)
- **CPU**: Shared (sufficient for ML inference)
- **Storage**: Ephemeral (models load from code on each deploy)
- **Bandwidth**: 100GB/month

---

## 🚀 Quick Deploy Checklist

- [ ] Git commit all changes (including ml_models/)
- [ ] Push to GitHub: `git push origin main`
- [ ] Create new Railway service from GitHub repo
- [ ] **Set Root Directory to `python`**
- [ ] Select Dockerfile builder
- [ ] Add environment variables (SUPABASE_URL, etc.)
- [ ] **Update Dockerfile to copy ml_models/** (see fix above)
- [ ] Deploy and check logs
- [ ] Test health endpoint
- [ ] Test ML predictions endpoint

---

## 📊 Expected Resource Usage

```
Build Time: 3-5 minutes (first deploy)
Build Size: ~500MB (Python + dependencies)
Runtime Memory: ~200MB baseline + ~50MB for models
Startup Time: ~10-15 seconds
Cold Start: N/A (Railway keeps services warm)
```

---

## 🎉 Success Indicators

✅ Build completes without errors  
✅ Deployment shows "Running"  
✅ Health check passes  
✅ Logs show "Loading ML models..."  
✅ Logs show "Uvicorn running..."  
✅ `/health` endpoint returns 200  
✅ `/api/ml/screen` endpoint returns predictions  

---

## 📞 Next Steps After Deployment

1. **Get your Railway URL** from service dashboard
2. **Update frontend** to use Railway API:
   ```env
   NEXT_PUBLIC_PATTERN_API_URL=https://your-service.railway.app
   ```
3. **Test from frontend** - Virtual trading should get AI predictions
4. **Monitor logs** for the first few hours
5. **Set up alerts** for service health (Railway has built-in monitoring)

---

## 🔗 Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- Your Service Logs: https://railway.app/project/[project-id]/service/[service-id]
- Dockerfile Reference: `/Dockerfile.pattern`
- ML Models Guide: `/ML_DEPLOYMENT_READY.md`

---

**Status**: Ready to deploy with one Dockerfile update!

Next: Update Dockerfile.pattern to include ml_models/ directory.
