# Model Deployment Guide

## ✅ Current Status

Your models are organized and ready to deploy!

```
ml_models/
├── xgboost.pkl              ✅ 218KB
├── random_forest.pkl        ✅ 9.2MB
├── lightgbm.pkl             ✅ 1.5MB
├── feature_engineer.pkl     ✅ 1.3KB
├── metadata.json            ✅ Training info
└── premium/
    ├── lstm.pth             ✅ 819KB
    ├── lstm_scaler.pkl      ✅ 671 bytes
    └── lstm_metadata.json   ✅ Config info
```

**Total size:** ~12MB (small enough for GitHub!)

---

## 🔧 Step 1: Update Backend to Load Models

### A. Update `ml_ensemble.py` to Load from Disk

Your backend needs to:
1. ✅ Load Pro tier models (XGBoost, RF, LightGBM) - Already set up
2. ✅ Load Premium tier LSTM model (if user is Premium)
3. ✅ Check user's subscription tier before using models

### B. Create Model Loader

Location: `/workspaces/virtual-options-desk/python/ml_ensemble.py`

The file should have:
- `load_models()` - Loads Pro tier models
- `load_premium_models()` - Loads LSTM for Premium users
- `is_trained` property - Checks if models exist

---

## 🎯 Step 2: Enable ML in Pattern Detection API

Currently disabled:
```python
detector = PatternDetector(use_ml=False)  # ❌ Disabled
```

Should be:
```python
detector = PatternDetector(use_ml=True)  # ✅ Enable after models are loaded
```

Location: `/workspaces/virtual-options-desk/python/pattern_detection_api.py`

---

## 🔐 Step 3: Implement Tier-Based Access Control

### Subscription Tiers:
- **Free ($0)**: Basic screening, 10 picks/month
- **Pro ($29.99)**: Ensemble models (XGBoost + RF + LightGBM), 100 picks/month
- **Premium ($99.99)**: Ensemble + LSTM + Sentiment, unlimited picks

### Access Logic:
```python
def get_predictions(user_id, symbols):
    subscription = get_user_subscription(user_id)
    
    if subscription.tier == 'free':
        # Basic momentum screening only
        return basic_screen(symbols[:50])
    
    elif subscription.tier == 'pro':
        # Use ensemble models
        predictions = ensemble.predict(symbols[:100])
        return predictions
    
    elif subscription.tier == 'premium':
        # Use ensemble + LSTM
        ensemble_pred = ensemble.predict(symbols)
        lstm_pred = lstm_model.predict(symbols)
        
        # Weighted combination
        final_pred = 0.6 * ensemble_pred + 0.4 * lstm_pred
        return final_pred
```

---

## 📊 Step 4: Create Model Loading Script

Create: `/workspaces/virtual-options-desk/python/load_models.py`

This script should:
1. Check if model files exist
2. Load Pro tier models
3. Load Premium tier models (if available)
4. Validate models work correctly
5. Set `use_ml=True` in pattern detector

---

## 🚀 Step 5: Test Models Locally

Before deploying, test:

```bash
cd /workspaces/virtual-options-desk/python
python3 -c "
from ml_ensemble import StockScreeningEnsemble
import joblib

# Test Pro tier models
print('Testing Pro tier models...')
ensemble = StockScreeningEnsemble()
try:
    ensemble.load_models('../ml_models')
    print('✅ Pro tier models loaded successfully')
    print(f'   Is trained: {ensemble.is_trained}')
except Exception as e:
    print(f'❌ Error: {e}')

# Test Premium tier models
print('\\nTesting Premium tier models...')
try:
    import torch
    lstm_model = torch.load('../ml_models/premium/lstm.pth')
    print('✅ Premium LSTM model loaded successfully')
except Exception as e:
    print(f'❌ Error: {e}')
"
```

---

## 🌐 Step 6: Deploy to Railway

### Option A: Include Models in Git (Current - OK for now)
Your models are already committed (12MB total is fine for GitHub).

Pros:
- ✅ Simple deployment
- ✅ Models are versioned with code
- ✅ No extra infrastructure needed

Cons:
- ⚠️ GitHub has 100MB file limit (you're well under)
- ⚠️ Increases repo size

### Option B: Upload to Railway Directly
1. Go to Railway project
2. Navigate to Python service
3. Upload models to `/app/ml_models/` directory

### Option C: Use Cloud Storage (Future)
- Upload models to AWS S3 / Google Cloud Storage
- Download on server startup
- Best for larger models (> 100MB)

**Recommendation:** Keep current setup (models in Git) since they're small!

---

## 🔄 Step 7: Update Environment Variables

Add to Railway:
```bash
ML_MODELS_PATH=/app/ml_models
ML_MODELS_ENABLED=true
USE_PREMIUM_MODELS=true
```

---

## ✅ Step 8: Verification Checklist

After deployment:

- [ ] Models load successfully (check logs)
- [ ] Pro tier users get ensemble predictions
- [ ] Premium tier users get LSTM + ensemble predictions
- [ ] Free tier users get basic screening only
- [ ] API endpoints return predictions
- [ ] Performance is acceptable (< 2s for predictions)

---

## 📝 Next Immediate Actions

1. **Review `ml_ensemble.py`** - Check if it loads models correctly
2. **Enable ML** - Set `use_ml=True` in pattern_detection_api.py
3. **Test locally** - Run the test script above
4. **Deploy to Railway** - Push changes and verify logs
5. **Test API** - Call `/api/ml/screen` with test symbols

---

## 🆘 Troubleshooting

### Models not loading?
- Check file paths are correct
- Verify permissions on model files
- Check Railway logs for errors

### Predictions are slow?
- Models are loaded on every request (bad!)
- Load models once on server startup (good!)
- Cache loaded models in memory

### Out of memory?
- Your models are small (12MB), shouldn't be an issue
- If needed, load models on-demand per request
- Consider streaming predictions for large batches

---

## 🎯 Success Metrics

You'll know it's working when:
- ✅ `/api/ml/status` shows `is_trained: true`
- ✅ `/api/ml/predict` returns stock predictions
- ✅ Dashboard shows AI picks for users
- ✅ Premium users see different (better) picks than Pro users

---

Ready to proceed? Let's:
1. Check your `ml_ensemble.py` file
2. Enable ML in the pattern detector
3. Test locally
4. Deploy!
