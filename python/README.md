# Pattern Detection API - Railway Deployment

## 🚀 Quick Deploy to Railway

This directory contains everything needed for Railway deployment, including:
- ✅ Pattern detection API code
- ✅ ML models (11.8MB in `ml_models/`)
- ✅ Dockerfile for containerized deployment
- ✅ railway.json configuration

### Railway Settings

```yaml
Root Directory: python
```

That's it! Railway will automatically:
1. Find `railway.json` (tells it to use Dockerfile)
2. Use `Dockerfile` to build
3. Copy all code including `ml_models/` directory
4. Install dependencies from `requirements-ml.txt`
5. Start the API with ML models loaded

### Environment Variables Required

Add these in Railway dashboard:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

PORT is auto-set by Railway (don't add manually).

### Files Overview

```
python/
├── Dockerfile              ← Build instructions
├── railway.json            ← Railway configuration
├── requirements-ml.txt     ← Python dependencies
├── pattern_detection_api.py ← Main FastAPI app
├── pattern_detector.py     ← Pattern detection logic
├── ml_ensemble.py          ← ML model loader
└── ml_models/              ← Trained models (11.8MB)
    ├── xgboost.pkl         (217 KB)
    ├── random_forest.pkl   (9.1 MB)
    ├── lightgbm.pkl        (1.4 MB)
    ├── feature_engineer.pkl
    ├── metadata.json
    └── premium/
        ├── lstm.pth        (819 KB)
        ├── lstm_scaler.pkl
        └── lstm_metadata.json
```

### Expected Build Output

```
Step 1/10 : FROM python:3.12-slim
Step 2/10 : WORKDIR /app
Step 3/10 : RUN apt-get install gcc g++...
Step 4/10 : COPY requirements-ml.txt ./
Step 5/10 : RUN pip install -r requirements-ml.txt
  ✓ xgboost-3.0.5
  ✓ lightgbm-4.6.0
  ✓ torch-2.1.0
Step 6/10 : COPY . /app
  ✓ Copying all files including ml_models/
✓ Build complete!

Deployment:
✓ Loading ML models from ml_models/
✓ XGBoost loaded (217KB)
✓ Random Forest loaded (9.1MB)
✓ LightGBM loaded (1.4MB)
✓ LSTM loaded (819KB)
✓ Uvicorn running on 0.0.0.0:8080
```

### Verify Deployment

```bash
# Health check
curl https://your-service.railway.app/health

# Test ML predictions
curl -X POST https://your-service.railway.app/api/ml/screen \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "timeframe": "1d"}'
```

### Local Testing

```bash
# From repository root
cd python
python3 test_models.py

# Should show:
✅ Pro Tier (Ensemble):  PASSED
✅ Premium Tier (LSTM):  PASSED
```

### API Endpoints

- `GET /health` - Health check
- `POST /api/ml/screen` - ML stock screening
- `GET /docs` - Swagger API documentation
- `WebSocket /ws` - Real-time pattern updates

### Model Information

**Pro Tier (Ensemble):**
- XGBoost + Random Forest + LightGBM
- 19 technical indicators
- Trained on 50 stocks, 3 years data

**Premium Tier (LSTM):**
- 2-layer LSTM deep learning
- 60-day sequences → 30-day predictions
- GPU-trained on Google Colab

### Troubleshooting

If Railway doesn't use the Dockerfile:
1. Check Root Directory is set to `python`
2. Verify `railway.json` exists in python directory
3. Try redeploying or recreating the service

If models don't load:
1. Check Railway logs for "Loading ML models..."
2. Verify `ml_models/` directory was copied
3. Check file sizes match (should see 11.8MB in logs)

### Documentation

See repository root for detailed guides:
- `RAILWAY_DEPLOY_QUICKSTART.md`
- `RAILWAY_ML_DEPLOYMENT_GUIDE.md`
- `RAILWAY_FINAL_FIX_SUMMARY.md`

---

**Status: ✅ READY TO DEPLOY**

All ML models included, Dockerfile configured, Railway settings documented.
