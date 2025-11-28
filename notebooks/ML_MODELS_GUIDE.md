# ML Models Guide

This document explains the purpose of each machine learning model used in the Virtual Options Desk platform and which subscription tier they belong to.

---

## Overview

| Model | Notebook | Tier | Purpose |
|-------|----------|------|---------|
| XGBoost | `train_ensemble_models.ipynb` | Free/Pro | 30-day return prediction (35% weight) |
| Random Forest | `train_ensemble_models.ipynb` | Free/Pro | 30-day return prediction (25% weight) |
| LightGBM | `train_ensemble_models.ipynb` | Free/Pro | 30-day return prediction (40% weight) |
| LSTM | `train_lstm_premium.ipynb` | Premium | Deep learning time-series prediction (10% weight) |
| Breakout Classifier | `breakout_stock_classifier.ipynb` | All Tiers | Identifies sustained breakout stocks |

---

## 1. Ensemble Models (`train_ensemble_models.ipynb`)

### Purpose
These models predict **30-day forward returns** for stocks. They form the core stock screening/ranking system used in Free and Pro tiers.

### Models & Weights

| Model | Weight | Strengths |
|-------|--------|-----------|
| **LightGBM** | 40% | Fast, handles large datasets well, good with categorical features |
| **XGBoost** | 35% | Excellent accuracy, handles missing data, strong regularization |
| **Random Forest** | 25% | Robust to overfitting, good baseline, handles noisy data |

### Features Used (19 Technical Indicators)
- **Price-based**: close, volume
- **Returns**: 1-day, 5-day, 20-day, 60-day returns
- **Volatility**: 20-day and 60-day volatility
- **Moving Averages**: SMA 20, 50, 200
- **MA Crossovers**: SMA 20/50 ratio, SMA 50/200 ratio
- **RSI**: 14-day Relative Strength Index
- **Bollinger Bands**: Position within bands
- **Volume**: 20-day average, volume ratio
- **Momentum**: 20-day price momentum

### Training Data
- **Universe**: 500 stocks (S&P 500 or custom CSV)
- **History**: 2 years of daily OHLCV data
- **Samples**: Generated via sliding window (200+ days per stock)

### Output Files
```
ml_models/
├── xgboost.pkl
├── random_forest.pkl
├── lightgbm.pkl
├── feature_engineer.pkl  (scaler)
└── metadata.json
```

---

## 2. LSTM Model (`train_lstm_premium.ipynb`)

### Purpose
Deep learning model for **Premium tier** that captures temporal patterns in stock price movements. Adds sophistication to predictions by learning sequential dependencies.

### Architecture
```
LSTM (2 layers, 128 hidden units)
    ↓
Fully Connected (128 → 64 → 1)
    ↓
30-day Return Prediction
```

### Features Used
- **Daily Returns**: Percentage change in close price
- **Normalized Volume**: Z-score normalized trading volume

### Training Data
- **Sequence Length**: 60 days of history per sample
- **Prediction Target**: 30-day forward return
- **Universe**: Full stock list from CSV (or S&P 500 fallback)

### Requirements
- **GPU Required**: Training is very slow without GPU
- **Recommended**: Kaggle (for background execution) or Google Colab with T4 GPU
- **Training Time**: 30-60 minutes (200 stocks), 8-12 hours (5000 stocks)

> **For long training runs (5000+ stocks):** See [KAGGLE_LSTM_TRAINING_GUIDE.md](./KAGGLE_LSTM_TRAINING_GUIDE.md) for instructions on running in the background on Kaggle.

### Output Files
```
ml_models/
├── lstm.pth           (PyTorch model weights)
├── lstm_scaler.pkl    (StandardScaler for features)
└── lstm_metadata.json
```

### Premium Ensemble Weight
The LSTM model contributes **10% weight** to the final ensemble prediction for Premium tier users.

---

## 3. Breakout Stock Classifier (`breakout_stock_classifier.ipynb`)

### Purpose
Identifies stocks experiencing **sustained breakouts** - not just one-day spikes, but stocks that continue to rise over time while maintaining their gains.

### Key Improvement
The original model was finding stocks that "break out" but were actually in overall downtrends. The updated model now:

1. **Filters for Uptrends Only**: Stock must be above both 50-day and 200-day moving averages
2. **Requires Sustained Growth**: Returns must be positive at 30, 60, AND 90 days
3. **Validates Volume**: Breakouts need above-average volume confirmation
4. **Checks for Drawdown**: Excludes stocks that crash >15% during the period

### Breakout Definition (All Must Be True)
| Criteria | Threshold |
|----------|-----------|
| Price > 50-day MA | Required |
| Price > 200-day MA | Required |
| 30-day forward return | > 20% |
| 60-day forward return | > 30% |
| 90-day forward return | > 40% |
| Max drawdown (30 days) | < 15% |
| Volume ratio | > 1.2x average |

### Features Used (13 Features)
- **OHLCV**: open, high, low, close, volume
- **Moving Averages**: SMA 50, SMA 200
- **Momentum**: RSI, MACD, MACD histogram, ROC (10-day)
- **Volatility**: ATR (Average True Range)
- **Volume**: Volume ratio vs 30-day average

### Quality Filters Applied
- **Minimum Price**: $5 (excludes penny stocks)
- **Minimum Volume**: 500,000 shares (ensures liquidity)
- **Volatility Cap**: < 50% (excludes extreme volatility)

### Model
- **Algorithm**: XGBoost Classifier
- **Hyperparameters**: 300 estimators, max depth 6, learning rate 0.05
- **Class Balancing**: Automatic scale_pos_weight based on breakout frequency

### Output Files
```
python/ml_models/
├── breakout_classifier_xgb_stockslist.pkl
└── breakout_classifier_metadata.json
```

---

## Tier Feature Matrix

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| XGBoost predictions | ✓ | ✓ | ✓ |
| Random Forest predictions | ✓ | ✓ | ✓ |
| LightGBM predictions | ✓ | ✓ | ✓ |
| Breakout detection | ✓ | ✓ | ✓ |
| LSTM deep learning | ✗ | ✗ | ✓ |
| Ensemble weights | 35/25/40 | 35/25/40 | 31.5/22.5/36/10 |

---

## Training Workflow

### Recommended Order
1. **First**: Train ensemble models (`train_ensemble_models.ipynb`)
   - These are the foundation models used by all tiers
   - ~10-30 minutes training time

2. **Second**: Train breakout classifier (`breakout_stock_classifier.ipynb`)
   - Provides sustained breakout detection
   - ~15-45 minutes depending on stock universe

3. **Third** (Premium only): Train LSTM (`train_lstm_premium.ipynb`)
   - Requires GPU for reasonable training time
   - ~30-60 minutes with GPU

### Google Colab Tips
- Use **GPU runtime** for LSTM training (Runtime → Change runtime type → GPU)
- Upload your `stocks-list.csv` or `eodhd_us_tickers.csv` for custom stock universe
- Download trained `.pkl` and `.pth` files and upload to `ml_models/` directory

---

## Model Performance Expectations

### Ensemble Models
- **R² Score**: 0.02-0.10 (stock prediction is inherently noisy)
- **MAE**: ~0.05-0.10 (5-10% average error on 30-day returns)

### LSTM Model
- **R² Score**: 0.01-0.08
- Adds value through pattern recognition, not raw accuracy

### Breakout Classifier
- **Precision**: Focus on high precision (fewer false positives)
- **Recall**: Lower recall is acceptable (miss some breakouts, but catches real ones)
- **Breakout Rate**: Typically 1-5% of samples labeled as breakouts

---

## Troubleshooting

### "Too few breakouts found"
- Lower return thresholds in `preprocess_data()` (e.g., 15%/25%/35% instead of 20%/30%/40%)
- Use more historical data (change `start_date` to 2015)
- Expand stock universe

### "NaN or Inf in training data"
- Data cleaning is automatic in updated notebooks
- Check for stocks with zero prices or volumes
- Verify CSV has valid ticker symbols

### "GPU not available" (LSTM)
- In Colab: Runtime → Change runtime type → GPU
- Locally: Install PyTorch with CUDA support
- Alternative: Reduce `training_universe_size` and train on CPU (slow)
