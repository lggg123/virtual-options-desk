# 🎯 Railway Deployment - Quick Reference Card

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  RAILWAY PATTERN DETECTION API - ML DEPLOYMENT      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📍 ROOT DIRECTORY (CRITICAL!):
   ┌─────────────┐
   │   python    │  ← Must be exactly this!
   └─────────────┘

🐳 DOCKERFILE:
   Path: ../Dockerfile.pattern
   What it does:
   ✓ Installs xgboost, lightgbm, torch
   ✓ Copies Python code from python/
   ✓ Copies ML models from ml_models/
   ✓ Starts uvicorn on $PORT

📦 MODELS INCLUDED:
   ml_models/
   ├── xgboost.pkl           217 KB
   ├── random_forest.pkl     9.1 MB
   ├── lightgbm.pkl          1.4 MB
   ├── feature_engineer.pkl  1.2 KB
   ├── metadata.json         1.9 KB
   └── premium/
       ├── lstm.pth          819 KB
       ├── lstm_scaler.pkl   671 B
       └── lstm_metadata.json 693 B
   
   TOTAL: 11.8 MB

🔑 ENVIRONMENT VARIABLES:
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbG...
   
   (PORT is auto-set by Railway)

⚙️ BUILD SETTINGS:
   Builder: Dockerfile
   Dockerfile Path: ../Dockerfile.pattern
   Root Directory: python
   Start Command: (from Dockerfile CMD)

🚀 EXPECTED STARTUP:
   1. Build (3-5 min)
      → Install dependencies
      → Copy code & models
      
   2. Deploy (10-15 sec)
      → Load ML models
      → Start uvicorn
      → Health check ✓
      
   3. Running!
      → https://your-service.railway.app

🧪 TEST COMMANDS:
   Health check:
   $ curl https://your-service.railway.app/health
   
   ML prediction:
   $ curl -X POST https://your-service.railway.app/api/ml/screen \
     -H "Content-Type: application/json" \
     -d '{"symbol":"AAPL","timeframe":"1d"}'

📊 RESOURCE USAGE:
   Memory: ~250 MB with models loaded
   CPU: Low (inference is fast)
   Storage: Ephemeral (models in code)
   Build time: 3-5 minutes (first deploy)

✅ SUCCESS INDICATORS:
   ✓ Build completes (green checkmark)
   ✓ "Running" status in dashboard
   ✓ Logs show "Loading ML models..."
   ✓ Logs show "Uvicorn running..."
   ✓ Health endpoint returns 200

❌ COMMON ISSUES:
   "Root directory '__pycache__'"
   → Fix: Set Root Directory to "python"
   
   "No module named 'xgboost'"
   → Fix: Check requirements-ml.txt installed
   
   "ml_models/ not found"
   → Fix: Verify models committed to git

📚 DOCUMENTATION:
   Quick Start:  RAILWAY_DEPLOY_QUICKSTART.md
   Full Guide:   RAILWAY_ML_DEPLOYMENT_GUIDE.md
   ML Info:      ML_DEPLOYMENT_READY.md
   Troubleshoot: RAILWAY_PATTERN_DETECTION_FIX.md

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🎯 4-STEP DEPLOYMENT                                ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  1. Railway Dashboard → New Service → GitHub Repo   ┃
┃  2. Settings → Root Directory → "python"            ┃
┃  3. Variables → Add SUPABASE_URL + SERVICE_KEY      ┃
┃  4. Deploy! 🚀                                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Status: ✅ READY TO DEPLOY
Models: ✅ Trained & Committed (11.8 MB)
Code:   ✅ use_ml=True enabled
Tests:  ✅ All passing locally
```

## Railway UI Checklist

```
Settings Tab:
├─ General
│  ├─ Service Name: pattern-detection-api
│  └─ Root Directory: python ⚠️ CRITICAL
│
├─ Build
│  ├─ Builder: Dockerfile
│  └─ Dockerfile Path: ../Dockerfile.pattern
│
└─ Deploy
   ├─ Restart Policy: ON_FAILURE
   └─ Max Retries: 10

Variables Tab:
├─ SUPABASE_URL (add manually)
├─ SUPABASE_SERVICE_KEY (add manually)
└─ PORT (auto-set by Railway) ✓

Deployments Tab:
└─ Watch logs here during deployment
```

## File Locations Reference

```
Repository Root: /
├─ Dockerfile.pattern         ← Build configuration
├─ ml_models/                  ← 11.8MB of trained models
│  ├─ xgboost.pkl
│  ├─ random_forest.pkl
│  ├─ lightgbm.pkl
│  ├─ feature_engineer.pkl
│  ├─ metadata.json
│  └─ premium/
│     ├─ lstm.pth
│     ├─ lstm_scaler.pkl
│     └─ lstm_metadata.json
│
└─ python/                     ← Root Directory for Railway
   ├─ pattern_detection_api.py ← Main API file
   ├─ pattern_detector.py      ← Pattern detection logic
   ├─ ml_ensemble.py           ← Ensemble model loader
   ├─ requirements-ml.txt      ← All dependencies
   └─ start.sh                 ← Alternative startup script
```

## Docker Build Process

```
Step 1: FROM python:3.12-slim
        Base image with Python 3.12

Step 2: Install system dependencies
        gcc, g++, libgl1 (for cv2)

Step 3: COPY python/requirements-ml.txt
        Dependencies list

Step 4: RUN pip install -r requirements-ml.txt
        ✓ xgboost 3.0.5
        ✓ lightgbm 4.6.0
        ✓ torch 2.1.0
        ✓ scikit-learn
        ✓ fastapi, uvicorn, pydantic
        ✓ yfinance, pandas, numpy

Step 5: COPY python/ ./
        All Python code

Step 6: COPY ml_models/ ./ml_models/
        All trained ML models (11.8MB)

Step 7: CMD uvicorn pattern_detection_api:app
        Start the FastAPI server
```

## Deployment Timeline

```
T+0:00   Push to GitHub (or trigger deploy)
T+0:30   Railway detects change
T+0:45   Build starts
         ├─ Pull base image
         ├─ Install system packages
         ├─ Install Python packages (cached)
         └─ Copy code & models
T+4:00   Build complete ✓
T+4:10   Deploy starts
         ├─ Start container
         ├─ Load ML models (11.8MB)
         └─ Start uvicorn
T+4:25   Health check passes ✓
T+4:30   Service is LIVE! 🎉

Total: ~4-5 minutes
```

## What Happens on Startup

```python
# 1. Import modules
from pattern_detector import PatternDetector
from ml_ensemble import MLEnsemble

# 2. Initialize detector with ML enabled
detector = PatternDetector(use_ml=True)

# 3. Load models from ml_models/
✓ Loading XGBoost from ml_models/xgboost.pkl
✓ Loading Random Forest from ml_models/random_forest.pkl  
✓ Loading LightGBM from ml_models/lightgbm.pkl
✓ Loading feature engineer from ml_models/feature_engineer.pkl
✓ Loading LSTM from ml_models/premium/lstm.pth

# 4. Start FastAPI server
INFO: Started server process
INFO: Waiting for application startup
INFO: Application startup complete
INFO: Uvicorn running on http://0.0.0.0:8080

# 5. Ready for requests!
```

## URLs You'll Get

```
Service Dashboard:
https://railway.app/project/[id]/service/[id]

Public API:
https://pattern-detection-api-production.up.railway.app

Endpoints:
https://your-service.railway.app/health
https://your-service.railway.app/docs (Swagger UI)
https://your-service.railway.app/api/ml/screen
https://your-service.railway.app/ws (WebSocket)
```

## Cost Estimate (Railway)

```
Free Tier:
- $5 credit/month
- ~500 hours runtime
- Enough for development + testing

Hobby Plan: $5/month
- $5 credit included
- Unlimited usage
- Your app uses ~$0.20/day = ~$6/month
- Total cost: $6/month (includes $5 credit)

Usage Breakdown:
- Compute: ~$0.15/day (250MB RAM, minimal CPU)
- Bandwidth: ~$0.05/day (assuming light traffic)
```

## Health Check Details

```
Dockerfile includes:
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=40s \
            --retries=3 \
  CMD python -c "import urllib.request; \
      urllib.request.urlopen('http://localhost:8080/health').read()"

What it does:
- Checks /health endpoint every 30 seconds
- Waits 40 seconds after startup before first check
- Fails if 3 consecutive checks fail
- Railway restarts if unhealthy
```

## Logs to Watch For

```
Good (Normal):
===============
✓ Installing collected packages: xgboost, lightgbm...
✓ Successfully installed xgboost-3.0.5
✓ Build succeeded
✓ Container started
✓ Loading ML models from ml_models/
✓ Loaded 3 ensemble models
✓ Loaded LSTM model
✓ Uvicorn running on http://0.0.0.0:8080
✓ Application startup complete

Bad (Need fixing):
==================
✗ ERROR: Could not find a version that satisfies xgboost
  → Fix: Check requirements-ml.txt syntax

✗ FileNotFoundError: [Errno 2] No such file or directory: 'ml_models/'
  → Fix: Check Dockerfile copies ml_models/

✗ ModuleNotFoundError: No module named 'pattern_detector'
  → Fix: Check Root Directory is set to "python"

✗ OSError: [Errno 98] Address already in use
  → Fix: Ensure using $PORT variable, not hardcoded port
```

---

**Ready to deploy? Follow the 4-step checklist above! 🚀**

For detailed walkthrough, see: `RAILWAY_DEPLOY_QUICKSTART.md`
