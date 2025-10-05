# ML Models Directory

This directory stores trained machine learning models for stock screening.

## Directory Structure

```
ml_models/
├── xgboost.pkl           # XGBoost regressor model
├── random_forest.pkl     # Random Forest regressor model
├── lightgbm.pkl          # LightGBM regressor model
├── lstm.pth              # LSTM neural network (if PyTorch available)
├── feature_engineer.pkl  # Feature engineering pipeline
└── metadata.json         # Model training metadata
```

## Model Files

### Core Models
- **xgboost.pkl**: Gradient boosting model (35% weight in ensemble)
- **random_forest.pkl**: Random forest model (25% weight in ensemble)
- **lightgbm.pkl**: LightGBM model (30% weight in ensemble)
- **lstm.pth**: LSTM deep learning model (10% weight, optional)

### Supporting Files
- **feature_engineer.pkl**: Preprocessing pipeline including scaler and feature names
- **metadata.json**: Training configuration, timestamp, and model metrics

## Metadata Format

```json
{
  "config": {
    "xgboost": {...},
    "random_forest": {...},
    "lightgbm": {...},
    "ensemble_weights": {...}
  },
  "trained_at": "2025-10-04T12:00:00",
  "feature_count": 85,
  "torch_available": true
}
```

## Version Control

⚠️ **Important**: Model files are typically large (100MB+) and should NOT be committed to git.

Add to `.gitignore`:
```
ml_models/*.pkl
ml_models/*.pth
```

Keep only `metadata.json` in version control for tracking model versions.

## Model Lifecycle

1. **Training**: Models are created and saved here during training
2. **Loading**: API service loads models from this directory on startup
3. **Updates**: Retrain models monthly or when performance degrades
4. **Backup**: Keep previous versions in a separate backup location

## Storage Requirements

- Approximately 200-500 MB per model set
- Recommend SSD for faster loading
- Consider cloud storage (S3, GCS) for production

## Security

- Models contain learned patterns from proprietary data
- Restrict access in production environments
- Encrypt sensitive model files if necessary
