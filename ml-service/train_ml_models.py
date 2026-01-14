"""
Train ML Models for Stock Screening

This script trains the ensemble ML models using historical stock data.
It calculates features from price data and trains:
- XGBoost
- Random Forest  
- LightGBM
- LSTM (if PyTorch available)

The trained models are saved to ml_models/ directory.

Usage:
    cd ml-service
    python train_ml_models.py
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os

# Import local ml_ensemble module
from ml_ensemble import StockScreeningEnsemble, ModelPrediction
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class StockFactors:
    """Stock factors for ML model"""
    symbol: str
    timestamp: str
    fundamental: Dict
    technical: Dict
    sentiment: Dict
    market: Dict

def calculate_technical_indicators(df: pd.DataFrame) -> Dict:
    """Calculate technical indicators from price data"""
    
    close = df['close'].values
    high = df['high'].values
    low = df['low'].values
    volume = df['volume'].values
    
    # Helper to clean values
    def clean_value(val, default=0.0, max_val=1e6):
        """Replace inf/nan with default and clip extreme values"""
        if np.isnan(val) or np.isinf(val):
            return default
        return np.clip(val, -max_val, max_val)
    
    # RSI
    delta = np.diff(close)
    gains = np.where(delta > 0, delta, 0)
    losses = np.where(delta < 0, -delta, 0)
    
    avg_gain = np.mean(gains[-14:]) if len(gains) >= 14 else 0
    avg_loss = np.mean(losses[-14:]) if len(losses) >= 14 else 0.0001  # Avoid division by zero
    
    rs = avg_gain / avg_loss
    rsi_14 = clean_value(100 - (100 / (1 + rs)), default=50.0)
    
    # Moving averages
    sma_20 = clean_value(np.mean(close[-20:]) if len(close) >= 20 else close[-1])
    sma_50 = clean_value(np.mean(close[-50:]) if len(close) >= 50 else close[-1])
    sma_200 = clean_value(np.mean(close[-200:]) if len(close) >= 200 else close[-1])
    
    # Volatility - replace zero values to avoid inf
    returns = np.diff(close) / np.where(close[:-1] != 0, close[:-1], 1)
    volatility_20d = clean_value(np.std(returns[-20:]) * np.sqrt(252) * 100 if len(returns) >= 20 else 0, max_val=200)
    volatility_60d = clean_value(np.std(returns[-60:]) * np.sqrt(252) * 100 if len(returns) >= 60 else 0, max_val=200)
    
    # Momentum - avoid division by zero
    close_20 = close[-20] if len(close) >= 20 and close[-20] != 0 else close[-1]
    close_60 = close[-60] if len(close) >= 60 and close[-60] != 0 else close[-1]
    momentum_20d = clean_value(((close[-1] / close_20) - 1) * 100, max_val=1000)
    momentum_60d = clean_value(((close[-1] / close_60) - 1) * 100, max_val=1000)
    
    # MACD
    macd = clean_value(0.0)  # Simplified
    
    # Bollinger Bands
    bb_middle = sma_20
    bb_std = np.std(close[-20:]) if len(close) >= 20 else 0
    bb_upper = bb_middle + (2 * bb_std)
    bb_lower = bb_middle - (2 * bb_std)
    bb_width = clean_value(((bb_upper - bb_lower) / bb_middle) * 100 if bb_middle != 0 else 0, max_val=100)
    
    # Volume indicators
    avg_volume_20 = np.mean(volume[-20:]) if len(volume) >= 20 else volume[-1]
    avg_volume_20 = max(avg_volume_20, 1)  # Avoid division by zero
    volume_ratio = clean_value(volume[-1] / avg_volume_20, default=1.0, max_val=100)
    
    return {
        'rsi_14': rsi_14,
        'sma_20': sma_20,
        'sma_50': sma_50,
        'sma_200': sma_200,
        'volatility_20d': volatility_20d,
        'volatility_60d': volatility_60d,
        'momentum_20d': momentum_20d,
        'momentum_60d': momentum_60d,
        'macd': macd,
        'bb_width': bb_width,
        'volume_ratio': volume_ratio
    }

def calculate_fundamental_metrics(df: pd.DataFrame) -> Dict:
    """Calculate basic fundamental metrics from price data"""
    
    def clean_value(val, default=0.0, max_val=1e6):
        """Replace inf/nan with default and clip extreme values"""
        if np.isnan(val) or np.isinf(val):
            return default
        return np.clip(val, -max_val, max_val)
    
    close = df['close'].values
    volume = df['volume'].values
    
    # Market cap approximation (price * volume as proxy)
    avg_vol = np.mean(volume[-20:]) if len(volume) >= 20 else volume[-1]
    market_cap_proxy = clean_value(close[-1] * avg_vol, max_val=1e12)
    
    # Price trends as fundamental signals
    price_52w_high = np.max(close[-252:]) if len(close) >= 252 else close[-1]
    price_52w_low = np.min(close[-252:]) if len(close) >= 252 else close[-1]
    price_52w_high = max(price_52w_high, 0.01)  # Avoid division by zero
    price_from_52w_high = clean_value(((close[-1] / price_52w_high) - 1) * 100, max_val=100)
    
    return {
        'market_cap_proxy': market_cap_proxy,
        'price_52w_high': clean_value(price_52w_high),
        'price_52w_low': clean_value(price_52w_low),
        'price_from_52w_high': price_from_52w_high,
        'pe_ratio': 15,  # Placeholder
        'revenue_growth': 10,  # Placeholder
        'profit_margin': 20,  # Placeholder
        'debt_to_equity': 0.5,  # Placeholder
    }

def calculate_market_factors(df: pd.DataFrame) -> Dict:
    """Calculate market-related factors"""
    
    def clean_value(val, default=0.0, max_val=1e6):
        """Replace inf/nan with default and clip extreme values"""
        if np.isnan(val) or np.isinf(val):
            return default
        return np.clip(val, -max_val, max_val)
    
    close = df['close'].values
    volume = df['volume'].values
    
    # Relative strength vs average - avoid division by zero
    if len(close) > 1:
        returns = np.diff(close) / np.where(close[:-1] != 0, close[:-1], 1)
        avg_return = clean_value(np.mean(returns), max_val=10)
    else:
        avg_return = 0.0
    
    return {
        'relative_strength': avg_return * 100,
        'avg_volume': clean_value(np.mean(volume) if len(volume) > 0 else 0, max_val=1e9),
        'sector_performance': 5,  # Placeholder
        'market_correlation': 0.7,  # Placeholder
    }

def load_and_prepare_data(csv_path: str) -> tuple[List[StockFactors], Dict[str, pd.DataFrame]]:
    """Load historical data and prepare features"""
    
    print("📂 Loading historical data...")
    df = pd.read_csv(csv_path)
    print(f"   Loaded {len(df)} rows")
    
    # Convert date to datetime
    df['date'] = pd.to_datetime(df['date'])
    
    # Get unique symbols
    symbols = df['symbol'].unique()
    print(f"   Found {len(symbols)} symbols")
    
    stock_factors = []
    price_data = {}
    
    print("\n🔧 Calculating features for each stock...")
    for i, symbol in enumerate(symbols):
        if (i + 1) % 50 == 0:
            print(f"   Processed {i + 1}/{len(symbols)} stocks...")
        
        # Get stock data
        stock_df = df[df['symbol'] == symbol].sort_values('date')
        
        # Need at least 60 days of data
        if len(stock_df) < 60:
            continue
        
        # Store price data for target calculation
        price_data[symbol] = stock_df[['date', 'close']].set_index('date')
        
        # Calculate features
        try:
            technical = calculate_technical_indicators(stock_df)
            fundamental = calculate_fundamental_metrics(stock_df)
            market = calculate_market_factors(stock_df)
            
            factors = StockFactors(
                symbol=symbol,
                timestamp=stock_df['date'].iloc[-1].isoformat(),
                fundamental=fundamental,
                technical=technical,
                sentiment={'score': 0.5},  # Placeholder
                market=market
            )
            
            stock_factors.append(factors)
        except Exception as e:
            print(f"   ⚠️  Error processing {symbol}: {e}")
            continue
    
    print(f"\n✅ Prepared {len(stock_factors)} stocks for training")
    return stock_factors, price_data

def main():
    print("=" * 70)
    print("🤖 ML Model Training Pipeline")
    print("=" * 70)
    
    # Configuration - adjust paths to be relative to ml-service directory
    CSV_PATH = '../data/historical_stock_data.csv'
    MODEL_PATH = 'ml_models'
    FORWARD_DAYS = 30
    CV_SPLITS = 3
    
    # Check if data exists
    if not os.path.exists(CSV_PATH):
        print(f"\n❌ Error: Data file not found: {CSV_PATH}")
        print("\nPlease run the data fetching script first:")
        print("  python data/fetch_historical_for_ml.py")
        return
    
    # Load and prepare data
    stock_factors, price_data = load_and_prepare_data(CSV_PATH)
    
    if len(stock_factors) == 0:
        print("\n❌ Error: No stock data available for training")
        return
    
    print(f"\n📊 Training Configuration:")
    print(f"   Stocks: {len(stock_factors)}")
    print(f"   Forward prediction: {FORWARD_DAYS} days")
    print(f"   CV splits: {CV_SPLITS}")
    print(f"   Model save path: {MODEL_PATH}")
    
    # Create model directory
    os.makedirs(MODEL_PATH, exist_ok=True)
    
    # Initialize ensemble
    print("\n🚀 Initializing ensemble...")
    ensemble = StockScreeningEnsemble()
    
    # Train models
    print("\n" + "=" * 70)
    print("🎯 TRAINING MODELS")
    print("=" * 70)
    
    try:
        ensemble.train(
            stock_factors=stock_factors,
            price_data=price_data,
            forward_days=FORWARD_DAYS,
            cv_splits=CV_SPLITS
        )
        
        print("\n" + "=" * 70)
        print("💾 SAVING MODELS")
        print("=" * 70)
        
        ensemble.save_models(MODEL_PATH)
        
        print("\n" + "=" * 70)
        print("✅ TRAINING COMPLETE!")
        print("=" * 70)
        print(f"\nModels saved to: {MODEL_PATH}")
        print("\nYou can now:")
        print("  1. Deploy the ml_models/ folder to Railway")
        print("  2. Restart the ML service")
        print("  3. Test predictions at /api/ml/predict")
        
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
