# Machine Learning Stock Screening System

A comprehensive ML-based stock screening system using ensemble methods (XGBoost, Random Forest, LightGBM, LSTM) to predict stock performance and rank investment opportunities.

## 🎯 Overview

This system combines multiple machine learning models to:
- Predict future stock returns (30-day forward by default)
- Rank stocks by predicted performance
- Calculate confidence scores based on model agreement
- Assess risk levels for each prediction
- Identify key factors driving predictions

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ ML Training  │  │  Predictions │  │   Screening  │ │
│  │    UI        │  │      UI      │  │      UI      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js API Routes (/api/ml/*)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   /train     │  │  /predict    │  │   /screen    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│            Python ML Service (FastAPI)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Training   │  │  Prediction  │  │   Screening  │ │
│  │   Pipeline   │  │   Pipeline   │  │   Pipeline   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                  ML Ensemble Models                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ XGBoost  │  │  Random  │  │ LightGBM │  │  LSTM  │ │
│  │  (35%)   │  │  Forest  │  │  (30%)   │  │ (10%)  │ │
│  │          │  │  (25%)   │  │          │  │        │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 📦 Installation

### 1. Install Python Dependencies

```bash
# Install ML libraries
cd python
pip install -r requirements-ml.txt

# Optional: Install PyTorch for LSTM support
pip install torch>=2.1.0
```

### 2. Set Up Environment Variables

Create or update `.env.local`:

```bash
# ML Service URL
ML_SERVICE_URL=http://localhost:8002

# Add your API keys for data fetching
ALPHA_VANTAGE_API_KEY=your_key
FINNHUB_API_KEY=your_key
```

## 🚀 Quick Start

### Step 1: Start the ML Service

```bash
# From the python directory
cd python
python ml_api.py
```

The ML service will start on `http://localhost:8002`

### Step 2: Start the Frontend

```bash
# From the project root
cd frontend
bun run dev
```

Frontend runs on `http://localhost:3000`

### Step 3: Train Models (First Time)

#### Option A: Via API

```bash
curl -X POST http://localhost:3000/api/ml/train \
  -H "Content-Type: application/json" \
  -d '{
    "forward_days": 30,
    "cv_splits": 5,
    "force_retrain": false
  }'
```

#### Option B: Via Python Script

```python
import asyncio
from ml_ensemble import StockScreeningEnsemble

async def train():
    ensemble = StockScreeningEnsemble()
    
    # Load your stock factors and price data
    stock_factors = [...]  # Your factor data
    price_data = {...}     # Historical prices
    
    # Train models
    ensemble.train(stock_factors, price_data, forward_days=30)
    
    # Save for later use
    ensemble.save_models()

asyncio.run(train())
```

### Step 4: Check Training Status

```bash
curl http://localhost:3000/api/ml/train
```

Response:
```json
{
  "is_training": false,
  "is_trained": true,
  "progress": 100,
  "message": "Training completed successfully",
  "completed_at": "2025-10-04T12:00:00"
}
```

### Step 5: Generate Predictions

```bash
curl -X POST http://localhost:3000/api/ml/predict \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
    "top_n": 10
  }'
```

Response:
```json
{
  "predictions": [
    {
      "symbol": "AAPL",
      "score": 8.5,
      "rank": 1,
      "confidence": 0.87,
      "predicted_return": 8.5,
      "risk_score": 25.3,
      "factor_importance": {
        "tech_rsi_14": 0.15,
        "fund_pe_ratio": 0.12,
        ...
      },
      "model_contributions": {
        "xgboost": 3.2,
        "random_forest": 2.1,
        "lightgbm": 2.8,
        "lstm": 0.4
      }
    }
  ],
  "generated_at": "2025-10-04T12:30:00",
  "model_version": "1.0.0"
}
```

### Step 6: Run Monthly Screening

```bash
curl -X POST http://localhost:3000/api/ml/screen \
  -H "Content-Type: application/json" \
  -d '{
    "universe": ["AAPL", "MSFT", ... 5000 symbols],
    "top_n": 1000
  }'
```

## 📊 Model Details

### Ensemble Composition

| Model | Type | Weight | Purpose |
|-------|------|--------|---------|
| **XGBoost** | Gradient Boosting | 35% | Captures non-linear patterns, handles missing data |
| **Random Forest** | Ensemble Trees | 25% | Robust to outliers, good for feature importance |
| **LightGBM** | Gradient Boosting | 30% | Fast training, efficient with large datasets |
| **LSTM** | Deep Learning | 10% | Captures temporal patterns (optional) |

### Features Used

The models use 80+ features across 4 categories:

1. **Fundamental** (20+ features)
   - Valuation: P/E, P/B, P/S ratios
   - Profitability: ROE, ROA, profit margins
   - Growth: Revenue growth, earnings growth
   - Financial health: Debt ratios, current ratio

2. **Technical** (30+ features)
   - Momentum: RSI, MACD, Stochastic
   - Trend: Moving averages, ADX
   - Volatility: ATR, Bollinger Bands
   - Volume: Volume ratios, OBV

3. **Sentiment** (15+ features)
   - News sentiment scores
   - Social media buzz
   - Analyst ratings
   - Institutional ownership changes

4. **Market** (15+ features)
   - Sector performance
   - Market cap ranking
   - Beta, correlation
   - Short interest

### Training Process

1. **Feature Engineering**
   - Normalize all features using RobustScaler
   - Create interaction features (e.g., P/E × Growth)
   - Handle missing values with median imputation

2. **Cross-Validation**
   - Time Series Split (5 folds)
   - Respects temporal ordering
   - Prevents look-ahead bias

3. **Model Training**
   - XGBoost: 500 estimators, depth 8
   - Random Forest: 300 trees, depth 15
   - LightGBM: 500 estimators, 31 leaves
   - LSTM: 2 layers, 128 hidden dim (if enabled)

4. **Ensemble**
   - Weighted average of predictions
   - Confidence based on model agreement
   - Risk scoring based on volatility and debt

## 🔧 Configuration

### Model Hyperparameters

Edit `python/ml_ensemble.py` to customize:

```python
def _default_config(self) -> Dict:
    return {
        'xgboost': {
            'n_estimators': 500,      # More trees = better fit
            'max_depth': 8,            # Deeper = more complex
            'learning_rate': 0.05,     # Lower = more careful
            'subsample': 0.8,          # Feature sampling
        },
        'ensemble_weights': {
            'xgboost': 0.35,           # Adjust weights
            'random_forest': 0.25,
            'lightgbm': 0.30,
            'lstm': 0.10
        }
    }
```

### Forward Prediction Period

```python
# Predict 30 days ahead (default)
ensemble.train(stock_factors, price_data, forward_days=30)

# Or predict 60 days for longer-term
ensemble.train(stock_factors, price_data, forward_days=60)
```

## 📈 Usage Examples

### Example 1: Train and Save Models

```python
from ml_ensemble import StockScreeningEnsemble

# Initialize
ensemble = StockScreeningEnsemble()

# Train (with your data)
ensemble.train(stock_factors, price_data)

# Save for later
ensemble.save_models(path='ml_models')
```

### Example 2: Load and Predict

```python
from ml_ensemble import StockScreeningEnsemble

# Load pre-trained models
ensemble = StockScreeningEnsemble()
ensemble.load_models(path='ml_models')

# Generate predictions
predictions = ensemble.predict(new_stock_factors)

# Top 10 picks
for pick in predictions[:10]:
    print(f"{pick.symbol}: {pick.score:.2f} (confidence: {pick.confidence:.2%})")
```

### Example 3: Monthly Screening

```python
from ml_ensemble import MonthlyScreeningPipeline

# Set up pipeline
pipeline = MonthlyScreeningPipeline(ensemble)

# Run screening on universe
universe = ['AAPL', 'MSFT', ...]  # 5000+ symbols
top_picks = await pipeline.run_monthly_screen(universe, top_n=1000)

# Analyze results
for pick in top_picks[:20]:
    print(f"{pick.rank}. {pick.symbol}: {pick.predicted_return:.2f}% return")
```

## 🔍 Monitoring & Evaluation

### Check Feature Importance

```bash
curl http://localhost:3000/api/ml/features
```

### Model Performance Metrics

After training, check:
- Cross-validation R² scores
- Feature importance rankings
- Model agreement/confidence

### Retraining Schedule

Recommend retraining:
- **Monthly**: For production use
- **Quarterly**: For research/backtesting
- **On-demand**: When performance degrades

## 🐛 Troubleshooting

### Issue: "Models not trained yet"
**Solution**: Run training first via `/api/ml/train`

### Issue: "PyTorch not available"
**Solution**: Install PyTorch or set LSTM weight to 0

```python
config = {
    'ensemble_weights': {
        'xgboost': 0.40,
        'random_forest': 0.30,
        'lightgbm': 0.30,
        'lstm': 0.00  # Disable LSTM
    }
}
```

### Issue: Training takes too long
**Solution**: Reduce estimators or CV splits

```python
ensemble.train(
    stock_factors, 
    price_data, 
    cv_splits=3  # Reduce from 5
)
```

### Issue: Out of memory
**Solution**: 
1. Process universe in batches
2. Reduce feature count
3. Use lighter models

## 📚 API Reference

### POST /api/ml/train
Start model training

**Request:**
```json
{
  "forward_days": 30,
  "cv_splits": 5,
  "force_retrain": false
}
```

### POST /api/ml/predict
Generate predictions

**Request:**
```json
{
  "symbols": ["AAPL", "MSFT"],
  "top_n": 10
}
```

### POST /api/ml/screen
Run monthly screening

**Request:**
```json
{
  "universe": ["AAPL", "MSFT", ...],
  "top_n": 1000
}
```

### GET /api/ml/features
Get feature importance

### GET /api/ml/train
Check training status

## 🎓 Best Practices

1. **Data Quality**: Ensure clean, consistent factor data
2. **Regular Retraining**: Monthly updates for market changes
3. **Validation**: Backtest predictions before live use
4. **Ensemble Tuning**: Adjust weights based on performance
5. **Risk Management**: Always check risk scores
6. **Diversification**: Don't rely solely on model rankings

## 📝 Next Steps

1. Integrate with your factor calculator
2. Set up automated monthly training
3. Build frontend UI for predictions
4. Add backtesting functionality
5. Implement performance tracking

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the Python logs
3. Test with small datasets first
4. Verify data format matches expected schema

---

Happy screening! 📊🚀
