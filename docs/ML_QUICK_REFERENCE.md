# ML Stock Screening - Quick Reference

## 🚀 Quick Commands

```bash
# Start ML service
./start-ml-service.sh

# Check if service is running
curl http://localhost:8002/

# Install dependencies
pip install -r python/requirements-ml.txt
```

## 📡 API Endpoints

### Train Models
```bash
# POST /api/ml/train
curl -X POST http://localhost:3000/api/ml/train \
  -H "Content-Type: application/json" \
  -d '{"forward_days": 30, "cv_splits": 5}'
```

### Check Training Status
```bash
# GET /api/ml/train
curl http://localhost:3000/api/ml/train
```

### Generate Predictions
```bash
# POST /api/ml/predict
curl -X POST http://localhost:3000/api/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["AAPL", "MSFT", "GOOGL"], "top_n": 10}'
```

### Run Monthly Screening
```bash
# POST /api/ml/screen
curl -X POST http://localhost:3000/api/ml/screen \
  -H "Content-Type: application/json" \
  -d '{"universe": ["AAPL", "MSFT", ...], "top_n": 1000}'
```

### Get Feature Importance
```bash
# GET /api/ml/features
curl http://localhost:3000/api/ml/features
```

## 🎯 Model Architecture

| Model | Type | Weight | Purpose |
|-------|------|--------|---------|
| XGBoost | Gradient Boosting | 35% | Non-linear patterns |
| Random Forest | Tree Ensemble | 25% | Feature importance |
| LightGBM | Gradient Boosting | 30% | Fast & efficient |
| LSTM | Deep Learning | 10% | Temporal patterns |

## 📊 Response Format

### Prediction Object
```json
{
  "symbol": "AAPL",
  "score": 8.5,
  "rank": 1,
  "confidence": 0.87,
  "predicted_return": 8.5,
  "risk_score": 25.3,
  "factor_importance": {
    "tech_rsi_14": 0.15,
    "fund_pe_ratio": 0.12
  },
  "model_contributions": {
    "xgboost": 3.2,
    "random_forest": 2.1,
    "lightgbm": 2.8,
    "lstm": 0.4
  }
}
```

## 🔧 Configuration

### Files
- **Models**: `/ml_models/` directory
- **Config**: `python/ml_ensemble.py`
- **API**: `python/ml_api.py`
- **Routes**: `src/app/api/ml/*/route.ts`

### Environment Variables
```bash
# .env.local
ML_SERVICE_URL=http://localhost:8002
```

## 📁 Project Structure

```
python/
├── ml_ensemble.py        # Core ML models
├── ml_api.py             # FastAPI service
└── requirements-ml.txt   # ML dependencies

src/app/api/ml/
├── train/route.ts        # Training endpoint
├── predict/route.ts      # Prediction endpoint
├── screen/route.ts       # Screening endpoint
└── features/route.ts     # Feature importance

ml_models/
├── xgboost.pkl          # Trained XGBoost
├── random_forest.pkl    # Trained RF
├── lightgbm.pkl         # Trained LightGBM
├── lstm.pth             # Trained LSTM
├── feature_engineer.pkl # Feature pipeline
└── metadata.json        # Model metadata
```

## 🐛 Troubleshooting

### Service won't start
```bash
# Check Python installation
python3 --version

# Check dependencies
pip list | grep -E 'xgboost|lightgbm|sklearn'

# Reinstall
pip install -r python/requirements-ml.txt
```

### Training fails
```bash
# Check disk space (models are ~500MB)
df -h

# Check logs
tail -f python/ml_service.log

# Try with smaller dataset
```

### Predictions fail
```bash
# Ensure models are trained
curl http://localhost:3000/api/ml/train

# Check model files exist
ls -lh ml_models/

# Reload models
curl -X DELETE http://localhost:8002/api/ml/models
curl -X POST http://localhost:3000/api/ml/train
```

## 📈 Performance Tips

1. **Training**: Use 3 CV splits for faster training
2. **Predictions**: Batch requests (100+ symbols at once)
3. **Screening**: Process universe in chunks of 1000
4. **Storage**: Use SSD for model files
5. **Memory**: Ensure 4GB+ RAM available

## 🔄 Maintenance

### Retraining Schedule
- **Monthly**: Production use
- **Quarterly**: Research mode
- **On-demand**: Performance degradation

### Model Lifecycle
```bash
# 1. Train new models
curl -X POST http://localhost:3000/api/ml/train

# 2. Backup old models
cp -r ml_models ml_models_backup_$(date +%Y%m%d)

# 3. Verify new models
curl -X POST http://localhost:3000/api/ml/predict \
  -d '{"symbols": ["AAPL"]}'

# 4. Monitor performance
curl http://localhost:3000/api/ml/features
```

## 📚 Resources

- **Full Guide**: [docs/ML_TRAINING_GUIDE.md](../docs/ML_TRAINING_GUIDE.md)
- **ML Code**: [python/ml_ensemble.py](../python/ml_ensemble.py)
- **API Docs**: http://localhost:8002/docs (when running)

## 💡 Usage Examples

### Python Script
```python
from ml_ensemble import StockScreeningEnsemble

# Load models
ensemble = StockScreeningEnsemble()
ensemble.load_models()

# Predict
predictions = ensemble.predict(stock_factors)
for pred in predictions[:10]:
    print(f"{pred.symbol}: {pred.score:.2f}")
```

### JavaScript/TypeScript
```typescript
// Fetch predictions
const response = await fetch('/api/ml/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    symbols: ['AAPL', 'MSFT'],
    top_n: 10 
  })
});

const { predictions } = await response.json();
```

## ⚡ Quick Tips

- ✅ Train models before first use
- ✅ Use batch predictions for efficiency
- ✅ Check confidence scores before acting
- ✅ Monitor feature importance changes
- ✅ Retrain monthly for best results
- ❌ Don't train during market hours
- ❌ Don't ignore risk scores
- ❌ Don't rely on single model

---

For detailed documentation, see [ML_TRAINING_GUIDE.md](../docs/ML_TRAINING_GUIDE.md)
