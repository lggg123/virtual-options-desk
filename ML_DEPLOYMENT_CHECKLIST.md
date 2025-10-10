# 🚀 ML Models Deployment Checklist

## ✅ Completed Steps

### 1. Model Training ✅
- [x] Pro tier ensemble models trained in Google Colab
  - XGBoost (217KB)
  - Random Forest (9.1MB)
  - LightGBM (1.4MB)
- [x] Premium tier LSTM model trained in Google Colab (819KB)
- [x] All models uploaded to correct directories

### 2. Local Testing ✅
- [x] Dependencies installed (xgboost, lightgbm, torch)
- [x] Model loading verified with test_models.py
- [x] Pro tier: ✅ PASSED (19 features, 3 models)
- [x] Premium tier: ✅ PASSED (LSTM + scaler)

### 3. API Integration ✅
- [x] Enabled `use_ml=True` in pattern_detection_api.py
- [x] ML models will load on API startup

## 📋 Remaining Steps

### 4. Local API Test 🔄
```bash
# Start the pattern detection API
cd /workspaces/virtual-options-desk
/bin/python3 python/pattern_detection_api.py

# In another terminal, test the ML endpoint:
curl -X POST http://localhost:8081/api/ml/screen \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "timeframe": "1d",
    "candles": [...]
  }'
```

### 5. Railway Deployment 🚀
- [ ] Commit changes to git
  ```bash
  git add ml_models/ python/ requirements.txt
  git commit -m "Enable ML predictions with trained models"
  git push origin main
  ```
- [ ] Deploy to Railway
  - Models will be included in deployment (11.8MB total)
  - Check logs for "✅ Loaded ML models" message
  - Verify no import errors

### 6. Production Testing 🧪
- [ ] Test /api/ml/screen endpoint in production
- [ ] Verify predictions return for Pro tier users
- [ ] Verify Premium tier loads LSTM predictions
- [ ] Check response times (should be < 2 seconds)
- [ ] Monitor Railway logs for errors

### 7. Tier-Based Access Control 🔒
- [ ] Implement subscription tier checking
  - Free tier: Technical patterns only (no ML)
  - Pro tier: Ensemble predictions (XGBoost + RF + LightGBM)
  - Premium tier: Ensemble + LSTM predictions
- [ ] Add tier info to API response
- [ ] Test with different subscription levels

## 📊 Model Information

### Pro Tier (Ensemble)
- **Models**: XGBoost, Random Forest, LightGBM
- **Features**: 19 technical indicators
- **Size**: 10.8MB
- **Training**: 50 stocks, 3 years data
- **Performance**: R² ~0.05-0.15 (normal for stock prediction)

### Premium Tier (LSTM)
- **Model**: 2-layer LSTM deep learning
- **Input**: 60-day sequences
- **Output**: 30-day predictions
- **Size**: 820KB
- **Training**: GPU-accelerated on Colab
- **Features**: Price + volume time series

## 🔍 Verification Commands

### Check model files
```bash
ls -lh ml_models/
ls -lh ml_models/premium/
```

### Test model loading
```bash
/bin/python3 python/test_models.py
```

### Check API startup
```bash
# Look for these messages:
# "✅ Loaded ML models from ml_models/"
# "Models: ['xgboost', 'random_forest', 'lightgbm']"
```

## 🐛 Troubleshooting

### If models fail to load in Railway:
1. Check Railway logs for import errors
2. Verify requirements.txt includes xgboost, lightgbm, torch
3. Ensure ml_models/ directory is committed to git
4. Check file paths are relative (not absolute)

### If predictions are slow (>2s):
1. Consider caching recent predictions
2. Optimize feature engineering
3. Use smaller prediction windows
4. Implement async prediction queues

### If sklearn version warnings appear:
- Safe to ignore (trained with 1.6.1, running 1.7.0)
- Models remain compatible
- No action needed unless predictions fail

## 📝 Notes

- **sklearn version**: Models trained with 1.6.1, compatible with 1.7.0
- **Model persistence**: Using joblib for sklearn, torch.save for LSTM
- **Feature engineering**: 19 indicators including RSI, MACD, Bollinger Bands
- **Prediction horizon**: 1-30 days forward returns
- **Update frequency**: Retrain models monthly with new data

## 🎯 Success Criteria

- ✅ All model files load without errors
- ✅ API starts with `use_ml=True`
- ✅ Predictions return in < 2 seconds
- ✅ Pro tier gets ensemble predictions
- ✅ Premium tier gets ensemble + LSTM predictions
- ✅ No memory issues with 11.8MB models
- ✅ Railway deployment successful
