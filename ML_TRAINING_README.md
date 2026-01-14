# ML Model Training Guide

This guide shows you how to train the ML models for stock screening.

## 📋 Prerequisites

- Python 3.10+ installed
- Historical stock data in `data/historical_stock_data.csv`
- Virtual environment (recommended)

## 🚀 Quick Start

### Step 1: Check Your Data

Make sure you have historical stock data:

```bash
ls -lh data/historical_stock_data.csv
```

If the file doesn't exist or is outdated, fetch new data:

```bash
python data/fetch_historical_for_ml.py
```

This will download ~250 days of price history for all stocks in `data/stocks-list.csv`.

### Step 2: Train the Models

Simply run the training script from the root directory:

```bash
./train-models.sh
```

Or manually:

```bash
# Install dependencies
pip install pandas numpy scikit-learn==1.7.2 xgboost lightgbm joblib

# Run training
cd ml-service
python train_ml_models.py
cd ..
```

### Step 3: Deploy to Railway

After training completes, you'll have a `ml-service/ml_models/` directory with these files:

```
ml-service/ml_models/
├── xgboost.pkl           # XGBoost model
├── random_forest.pkl     # Random Forest model
├── lightgbm.pkl          # LightGBM model
├── feature_engineer.pkl  # Feature scaler
└── config.json          # Model configuration
```

**Deploy to Railway:**

1. **Zip the models:**
   ```bash
   cd ml_models
   zip -r ../ml_models.zip .
   cd ..
   ```

2. **Upload to Railway:**
   - Option A: Add to your git repo (if < 100MB total)
   - Option B: Upload via Railway's file storage
   - Option C: Use Railway volumes

3. **Restart your ML service on Railway**

## 📊 What Data is Needed?

The training script requires historical stock data with these columns:

- `date` - Trading date
- `symbol` - Stock ticker
- `open` - Opening price
- `high` - Day's high price
- `low` - Day's low price
- `close` - Closing price
- `volume` - Trading volume

### Data Requirements

- **Minimum:** 60 days of historical data per stock
- **Recommended:** 250+ days (1 year) for better technical indicators
- **Stocks:** At least 100 stocks for meaningful training

## 🎯 Training Process

The script:

1. **Loads historical data** from CSV
2. **Calculates features** for each stock:
   - Technical indicators (RSI, MACD, Bollinger Bands, etc.)
   - Fundamental proxies (52-week high/low, market cap proxy)
   - Market factors (volume trends, momentum)
3. **Trains ensemble models**:
   - XGBoost (35% weight)
   - Random Forest (25% weight)
   - LightGBM (30% weight)
   - LSTM (10% weight, if PyTorch available)
4. **Validates** using time-series cross-validation
5. **Saves models** to `ml_models/` directory

## 🔧 Configuration

Edit `train_ml_models.py` to customize:

```python
# Training parameters
FORWARD_DAYS = 30      # Predict 30-day forward returns
CV_SPLITS = 3          # Cross-validation splits
MODEL_PATH = 'ml_models'  # Where to save models
```

## ✅ Verification

After training, verify the models:

```bash
# Check model files
ls -lh ml_models/

# Test loading (optional)
python -c "
import joblib
model = joblib.load('ml_models/xgboost.pkl')
print('✅ Models loaded successfully!')
"
```

## 🐛 Troubleshooting

### "No stock data available for training"

- Make sure `data/historical_stock_data.csv` exists
- Check that it has data for at least 100 stocks
- Verify each stock has 60+ days of history

### "ValueError: node array from pickle has incompatible dtype"

This means sklearn version mismatch. Fix:

```bash
# Uninstall old version
pip uninstall scikit-learn -y

# Install exact version
pip install scikit-learn==1.5.2

# Retrain models
python train_ml_models.py
```

### Models are too large for Railway

If models exceed Railway's file size limits:

1. Use Railway volumes for storage
2. Or reduce `n_estimators` in the config:
   ```python
   'xgboost': {'n_estimators': 300}  # Instead of 500
   'random_forest': {'n_estimators': 200}  # Instead of 300
   ```

## 📈 Expected Results

Training on 250+ stocks with 1 year of data:

- **Training time:** 5-15 minutes
- **Model sizes:** 50-200MB total
- **CV Score:** R² of 0.15-0.30 (typical for stock prediction)
- **Prediction speed:** < 100ms for 100 stocks

## 🔄 Retraining

Retrain models when:

- New stocks are added to your universe
- Market conditions change significantly
- Models are > 3 months old
- Prediction accuracy degrades

Set up a monthly cron job:

```bash
# Run first day of every month
0 0 1 * * /path/to/train-models.sh
```

## 📚 Next Steps

After successful training:

1. ✅ Models are saved to `ml_models/`
2. 📤 Upload to Railway ML service
3. 🔄 Restart the ML service
4. 🧪 Test predictions: `https://your-ml-service.railway.app/api/ml/predict`
5. 🎨 View results in ML Screening Dashboard: `/dashboard/ml-screening`

---

**Need Help?** Check the main [ML Training Guide](docs/ML_TRAINING_GUIDE.md) for more details.
