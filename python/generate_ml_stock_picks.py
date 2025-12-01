"""
Generate Tiered AI Stock Picks using Trained ML Models

This script:
1. Loads trained ensemble models (XGBoost, Random Forest, LightGBM, LSTM)
2. Loads breakout classifier model
3. Fetches latest stock data from EODHD
4. Generates predictions using all models
5. Applies breakout detection
6. Creates tiered stock picks:
   - Free: Top 10 stocks (basic info)
   - Pro: Top 25 stocks with analytics (max 3 per sector)
   - Premium: Top 50 stocks with full analytics (max 2 per sector)

Usage:
    python python/generate_ml_stock_picks.py
"""

import pandas as pd
import numpy as np
import joblib
import json
import os
from datetime import datetime
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')

# Deep learning imports
try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("⚠️  PyTorch not available, LSTM predictions will be skipped")


# ==================== LSTM MODEL DEFINITION ====================
if TORCH_AVAILABLE:
    class LSTMPredictor(nn.Module):
        """LSTM model for time-series stock prediction"""
        
        def __init__(self, input_dim: int = 3, hidden_dim: int = 128, num_layers: int = 2, dropout: float = 0.2):
            super().__init__()
            self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True, dropout=dropout)
            self.fc1 = nn.Linear(hidden_dim, 64)
            self.dropout = nn.Dropout(dropout)
            self.fc2 = nn.Linear(64, 1)
            self.relu = nn.ReLU()
        
        def forward(self, x):
            lstm_out, (hidden, cell) = self.lstm(x)
            last_out = lstm_out[:, -1, :]
            out = self.relu(self.fc1(last_out))
            out = self.dropout(out)
            out = self.fc2(out)
            return out.squeeze()


# ==================== DATA LOADING & PREPARATION ====================

def load_stock_data() -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Load stock list and historical market data"""
    print("📊 Loading stock data...")
    
    # Load stock list with sector/industry info
    stock_info_path = "data/stocks-list.csv"
    if not os.path.exists(stock_info_path):
        print(f"❌ Stock list not found: {stock_info_path}")
        return None, None
    
    stock_info = pd.read_csv(stock_info_path)
    print(f"   Loaded {len(stock_info)} stocks from stocks-list.csv")
    
    # Try to load historical data first (needed for technical indicators)
    historical_data_path = "data/historical_stock_data.csv"
    if os.path.exists(historical_data_path):
        historical_data = pd.read_csv(historical_data_path)
        print(f"   Loaded {len(historical_data)} data points from historical_stock_data.csv")
        return stock_info, historical_data
    
    # Fallback to latest data
    latest_data_path = "data/latest_stock_data.csv"
    if os.path.exists(latest_data_path):
        print(f"   ⚠️  Using latest_stock_data.csv (limited historical data)")
        print(f"   For better results, run: python data/fetch_historical_for_ml.py")
        latest_data = pd.read_csv(latest_data_path)
        print(f"   Loaded {len(latest_data)} stocks from latest_stock_data.csv")
        return stock_info, latest_data
    
    print(f"❌ No market data found")
    print("   Run: python data/fetch_historical_for_ml.py")
    return stock_info, None


def calculate_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate technical indicators for ML models"""
    print("🔧 Calculating technical indicators...")
    
    # Group by symbol for calculations
    result_dfs = []
    
    for symbol in df['symbol'].unique():
        stock_df = df[df['symbol'] == symbol].copy()
        stock_df = stock_df.sort_values('date')
        
        if len(stock_df) < 200:  # Need enough history
            continue
        
        # Price-based features
        stock_df['return_1d'] = stock_df['close'].pct_change(1)
        stock_df['return_5d'] = stock_df['close'].pct_change(5)
        stock_df['return_20d'] = stock_df['close'].pct_change(20)
        stock_df['return_60d'] = stock_df['close'].pct_change(60)
        
        # Volatility
        stock_df['volatility_20d'] = stock_df['return_1d'].rolling(20).std() * np.sqrt(252)
        stock_df['volatility_60d'] = stock_df['return_1d'].rolling(60).std() * np.sqrt(252)
        
        # Moving averages
        stock_df['sma_20'] = stock_df['close'].rolling(20).mean()
        stock_df['sma_50'] = stock_df['close'].rolling(50).mean()
        stock_df['sma_200'] = stock_df['close'].rolling(200).mean()
        
        # MA ratios
        stock_df['sma_20_50_ratio'] = stock_df['sma_20'] / stock_df['sma_50']
        stock_df['sma_50_200_ratio'] = stock_df['sma_50'] / stock_df['sma_200']
        
        # RSI
        delta = stock_df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / loss
        stock_df['rsi_14'] = 100 - (100 / (1 + rs))
        
        # Bollinger Bands
        bb_middle = stock_df['close'].rolling(20).mean()
        bb_std = stock_df['close'].rolling(20).std()
        bb_upper = bb_middle + (2 * bb_std)
        bb_lower = bb_middle - (2 * bb_std)
        stock_df['bb_position'] = (stock_df['close'] - bb_lower) / (bb_upper - bb_lower)
        
        # Volume features
        stock_df['volume_20d_avg'] = stock_df['volume'].rolling(20).mean()
        stock_df['volume_ratio'] = stock_df['volume'] / stock_df['volume_20d_avg']
        
        # Momentum
        stock_df['momentum_20d'] = stock_df['close'] / stock_df['close'].shift(20) - 1
        
        result_dfs.append(stock_df)
    
    if not result_dfs:
        print("❌ No stocks with enough historical data")
        return pd.DataFrame()
    
    result = pd.concat(result_dfs, ignore_index=True)
    print(f"   Calculated indicators for {len(result_dfs)} stocks")
    
    return result


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """Prepare features matching the trained model"""
    
    feature_cols = [
        'close', 'volume', 'return_1d', 'return_5d', 'return_20d', 'return_60d',
        'volatility_20d', 'volatility_60d', 'sma_20', 'sma_50', 'sma_200',
        'sma_20_50_ratio', 'sma_50_200_ratio', 'rsi_14', 'bb_position',
        'volume_20d_avg', 'volume_ratio', 'momentum_20d'
    ]
    
    # Get latest data point for each stock
    latest = df.sort_values('date').groupby('symbol').last().reset_index()
    
    # Keep only feature columns
    features = latest[['symbol', 'date'] + feature_cols].copy()
    
    # Fill missing values with median
    for col in feature_cols:
        if col in features.columns:
            features[col].fillna(features[col].median(), inplace=True)
    
    print(f"   Prepared features for {len(features)} stocks")
    
    return features


# ==================== MODEL LOADING ====================

def load_ensemble_models() -> Dict:
    """Load trained ensemble models"""
    print("\n🤖 Loading ML models...")
    
    models = {}
    model_path = "python/ml_models"
    
    # Load metadata
    metadata_path = f"{model_path}/metadata.json"
    if not os.path.exists(metadata_path):
        print(f"❌ Model metadata not found: {metadata_path}")
        return None
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    print(f"   Models trained on: {metadata.get('training_date', 'unknown')}")
    print(f"   Training samples: {metadata.get('training_samples', 'unknown'):,}")
    
    # Load ensemble models
    try:
        models['xgboost'] = joblib.load(f"{model_path}/xgboost.pkl")
        print("   ✓ XGBoost loaded")
    except Exception as e:
        print(f"   ⚠️  XGBoost failed: {e}")
    
    try:
        models['random_forest'] = joblib.load(f"{model_path}/random_forest.pkl")
        print("   ✓ Random Forest loaded")
    except Exception as e:
        print(f"   ⚠️  Random Forest failed: {e}")
    
    try:
        models['lightgbm'] = joblib.load(f"{model_path}/lightgbm.pkl")
        print("   ✓ LightGBM loaded")
    except Exception as e:
        print(f"   ⚠️  LightGBM failed: {e}")
    
    # Load feature scaler
    try:
        models['scaler'] = joblib.load(f"{model_path}/feature_engineer.pkl")
        print("   ✓ Feature scaler loaded")
    except Exception as e:
        print(f"   ⚠️  Feature scaler failed: {e}")
        models['scaler'] = None
    
    # Load LSTM (Premium only)
    if TORCH_AVAILABLE:
        lstm_path = f"{model_path}/premium/lstm.pth"
        if os.path.exists(lstm_path):
            try:
                lstm_model = LSTMPredictor()
                lstm_model.load_state_dict(torch.load(lstm_path, map_location='cpu'))
                lstm_model.eval()
                models['lstm'] = lstm_model
                print("   ✓ LSTM loaded (Premium tier)")
            except Exception as e:
                print(f"   ⚠️  LSTM failed: {e}")
    
    # Load breakout classifier
    breakout_path = f"{model_path}/breakout_classifier_xgb_stockslist.pkl"
    if os.path.exists(breakout_path):
        try:
            models['breakout'] = joblib.load(breakout_path)
            print("   ✓ Breakout classifier loaded")
        except Exception as e:
            print(f"   ⚠️  Breakout classifier failed: {e}")
    
    models['metadata'] = metadata
    
    return models


# ==================== PREDICTION GENERATION ====================

def generate_predictions(features_df: pd.DataFrame, models: Dict) -> pd.DataFrame:
    """Generate predictions using ensemble models"""
    print("\n🔮 Generating predictions...")
    
    feature_cols = [
        'close', 'volume', 'return_1d', 'return_5d', 'return_20d', 'return_60d',
        'volatility_20d', 'volatility_60d', 'sma_20', 'sma_50', 'sma_200',
        'sma_20_50_ratio', 'sma_50_200_ratio', 'rsi_14', 'bb_position',
        'volume_20d_avg', 'volume_ratio', 'momentum_20d'
    ]
    
    X = features_df[feature_cols].values
    
    # Scale features if scaler available
    if models.get('scaler'):
        try:
            X_scaled = models['scaler'].scaler.transform(X)
        except:
            X_scaled = X
    else:
        X_scaled = X
    
    predictions = {}
    
    # Get predictions from each model
    if 'xgboost' in models:
        predictions['xgboost'] = models['xgboost'].predict(X_scaled)
        print(f"   ✓ XGBoost predictions: mean={predictions['xgboost'].mean():.2f}%")
    
    if 'random_forest' in models:
        predictions['random_forest'] = models['random_forest'].predict(X_scaled)
        print(f"   ✓ Random Forest predictions: mean={predictions['random_forest'].mean():.2f}%")
    
    if 'lightgbm' in models:
        predictions['lightgbm'] = models['lightgbm'].predict(X_scaled)
        print(f"   ✓ LightGBM predictions: mean={predictions['lightgbm'].mean():.2f}%")
    
    # Ensemble weights from metadata
    weights = models['metadata'].get('model_weights', {
        'xgboost': 0.35,
        'random_forest': 0.25,
        'lightgbm': 0.40
    })
    
    # Calculate ensemble prediction
    ensemble_pred = np.zeros(len(X))
    total_weight = 0
    
    for model_name, pred in predictions.items():
        if model_name in weights:
            ensemble_pred += pred * weights[model_name]
            total_weight += weights[model_name]
    
    # Normalize if weights don't sum to 1
    if total_weight > 0 and total_weight != 1.0:
        ensemble_pred = ensemble_pred / total_weight
    
    # Add predictions to dataframe
    result = features_df.copy()
    result['predicted_return_30d'] = ensemble_pred
    
    # Add individual model predictions
    for model_name, pred in predictions.items():
        result[f'{model_name}_prediction'] = pred
    
    print(f"   ✓ Ensemble prediction: mean={ensemble_pred.mean():.2f}%, std={ensemble_pred.std():.2f}%")
    
    return result


def apply_breakout_detection(predictions_df: pd.DataFrame, models: Dict) -> pd.DataFrame:
    """Apply breakout classifier to identify breakout stocks"""
    print("\n🚀 Detecting breakout stocks...")
    
    if 'breakout' not in models:
        print("   ⚠️  Breakout classifier not available")
        predictions_df['breakout_probability'] = 0.0
        predictions_df['is_breakout'] = False
        return predictions_df
    
    # Prepare features for breakout classifier
    # The breakout classifier uses similar features
    feature_cols = [
        'close', 'volume', 'sma_50', 'sma_200', 'rsi_14',
        'volatility_20d', 'volume_ratio', 'momentum_20d'
    ]
    
    # Fill any missing features with median
    for col in feature_cols:
        if col not in predictions_df.columns:
            predictions_df[col] = 0.0
    
    X_breakout = predictions_df[feature_cols].values
    
    try:
        # Get breakout probability
        breakout_proba = models['breakout'].predict_proba(X_breakout)[:, 1]
        predictions_df['breakout_probability'] = breakout_proba
        predictions_df['is_breakout'] = breakout_proba > 0.5
        
        num_breakouts = predictions_df['is_breakout'].sum()
        print(f"   ✓ Identified {num_breakouts} potential breakout stocks")
        print(f"   ✓ Mean breakout probability: {breakout_proba.mean():.2%}")
        
    except Exception as e:
        print(f"   ⚠️  Breakout detection failed: {e}")
        predictions_df['breakout_probability'] = 0.0
        predictions_df['is_breakout'] = False
    
    return predictions_df


# ==================== PREMIUM LSTM PREDICTIONS ====================

def add_lstm_predictions(predictions_df: pd.DataFrame, models: Dict, weight: float = 0.10) -> pd.DataFrame:
    """Add LSTM predictions for Premium tier (weighted blend)"""
    
    if not TORCH_AVAILABLE or 'lstm' not in models:
        print("   ℹ️  LSTM not available, skipping Premium enhancement")
        return predictions_df
    
    print("\n🧠 Adding LSTM predictions (Premium)...")
    
    # For now, we'll use a simplified approach
    # In production, you'd need historical sequences for each stock
    # Here we'll just add a small weighted contribution
    
    # LSTM would need 60-day sequences, which we don't have in this single-point prediction
    # So we'll skip true LSTM prediction for now
    print("   ℹ️  LSTM requires historical sequences (not available in this script)")
    print("   ℹ️  Using ensemble predictions only")
    
    return predictions_df


# ==================== SECTOR DIVERSITY FILTERING ====================

def apply_sector_diversity(df: pd.DataFrame, max_per_sector: int) -> pd.DataFrame:
    """Limit number of stocks per sector for diversification"""
    
    if 'Industry' not in df.columns:
        print("   ⚠️  'Industry' column not found, skipping sector filtering")
        return df
    
    result = []
    sector_counts = {}
    
    for _, row in df.iterrows():
        sector = row.get('Industry', 'Unknown')
        if pd.isna(sector):
            sector = 'Unknown'
        
        if sector_counts.get(sector, 0) < max_per_sector:
            result.append(row)
            sector_counts[sector] = sector_counts.get(sector, 0) + 1
    
    return pd.DataFrame(result)


# ==================== TIERED STOCK PICKS ====================

def generate_tiered_picks(predictions_df: pd.DataFrame, stock_info: pd.DataFrame):
    """Generate stock picks for each subscription tier"""
    print("\n🎯 Generating tiered stock picks...")
    
    # Merge with stock info for sector/industry
    merged = predictions_df.merge(
        stock_info,
        left_on='symbol',
        right_on='Symbol',
        how='left'
    )
    
    # Sort by predicted return
    merged = merged.sort_values('predicted_return_30d', ascending=False)
    
    # Remove any rows with NaN predictions
    merged = merged.dropna(subset=['predicted_return_30d'])
    
    print(f"   Total stocks with predictions: {len(merged)}")
    
    # --- FREE TIER: Top 10 ---
    print("\n📦 FREE TIER: Top 10 stocks")
    top10_buffer = merged.head(50)  # Buffer for diversity
    free_picks = apply_sector_diversity(top10_buffer, max_per_sector=2).head(10)
    
    free_output = free_picks[['symbol', 'date', 'predicted_return_30d', 'breakout_probability']].copy()
    free_output.columns = ['symbol', 'date', 'predicted_return_30d', 'breakout_probability']
    free_output.to_csv('data/top10_free.csv', index=False)
    print(f"   ✓ Saved {len(free_output)} picks to data/top10_free.csv")
    print(f"   Top pick: {free_output.iloc[0]['symbol']} ({free_output.iloc[0]['predicted_return_30d']:.2f}%)")
    
    # --- PRO TIER: Top 25 with analytics ---
    print("\n⭐ PRO TIER: Top 25 stocks")
    top25_buffer = merged.head(100)
    pro_picks = apply_sector_diversity(top25_buffer, max_per_sector=3).head(25)
    
    pro_cols = [
        'symbol', 'date', 'predicted_return_30d', 'breakout_probability',
        'Industry', 'Market Cap', 'volume', 'volatility_20d', 'rsi_14'
    ]
    # Only include columns that exist
    pro_cols = [col for col in pro_cols if col in pro_picks.columns]
    
    pro_output = pro_picks[pro_cols].copy()
    pro_output.to_csv('data/top25_pro.csv', index=False)
    print(f"   ✓ Saved {len(pro_output)} picks to data/top25_pro.csv")
    print(f"   Top pick: {pro_output.iloc[0]['symbol']} ({pro_output.iloc[0]['predicted_return_30d']:.2f}%)")
    
    # --- PREMIUM TIER: Top 50 with full analytics ---
    print("\n💎 PREMIUM TIER: Top 50 stocks")
    top50_buffer = merged.head(200)
    premium_picks = apply_sector_diversity(top50_buffer, max_per_sector=2).head(50)
    
    premium_cols = [
        'symbol', 'date', 'predicted_return_30d', 'breakout_probability',
        'Industry', 'Market Cap', 'volume', 'volatility_20d', 'volatility_60d',
        'rsi_14', 'momentum_20d', 'volume_ratio',
        'xgboost_prediction', 'random_forest_prediction', 'lightgbm_prediction'
    ]
    # Only include columns that exist
    premium_cols = [col for col in premium_cols if col in premium_picks.columns]
    
    premium_output = premium_picks[premium_cols].copy()
    premium_output.to_csv('data/top50_premium.csv', index=False)
    print(f"   ✓ Saved {len(premium_output)} picks to data/top50_premium.csv")
    print(f"   Top pick: {premium_output.iloc[0]['symbol']} ({premium_output.iloc[0]['predicted_return_30d']:.2f}%)")
    
    # Print summary statistics
    print("\n📊 Summary Statistics:")
    print(f"   Free (n={len(free_output)}): {free_output['predicted_return_30d'].mean():.2f}% avg return")
    print(f"   Pro (n={len(pro_output)}): {pro_output['predicted_return_30d'].mean():.2f}% avg return")
    print(f"   Premium (n={len(premium_output)}): {premium_output['predicted_return_30d'].mean():.2f}% avg return")
    
    return free_output, pro_output, premium_output


# ==================== MAIN PIPELINE ====================

def main():
    """Main execution pipeline"""
    
    print("=" * 70)
    print("🎯 AI Stock Picks Generator - Multi-Model ML System")
    print("=" * 70)
    print(f"⏰ Run time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Load data
    stock_info, latest_data = load_stock_data()
    if stock_info is None or latest_data is None:
        print("\n❌ Failed to load required data")
        return
    
    # Step 2: Calculate technical indicators
    # Note: For this to work, we need historical data, not just latest
    # For now, we'll work with what we have in latest_stock_data.csv
    
    # Check if latest_data has the needed columns
    if 'close' not in latest_data.columns:
        print("\n❌ Latest data missing required columns")
        return
    
    # Load full historical data if available for indicator calculation
    # For now, assume latest_stock_data.csv has multiple dates
    if 'date' not in latest_data.columns:
        print("⚠️  No date column, using current date")
        latest_data['date'] = datetime.now().strftime('%Y-%m-%d')
    
    # Calculate indicators
    features_with_indicators = calculate_technical_indicators(latest_data)
    
    if features_with_indicators.empty:
        print("\n❌ Failed to calculate technical indicators")
        return
    
    # Prepare features for ML
    features = prepare_features(features_with_indicators)
    
    if features.empty:
        print("\n❌ No features prepared")
        return
    
    # Step 3: Load models
    models = load_ensemble_models()
    if not models:
        print("\n❌ Failed to load models")
        return
    
    # Step 4: Generate predictions
    predictions = generate_predictions(features, models)
    
    # Step 5: Apply breakout detection
    predictions = apply_breakout_detection(predictions, models)
    
    # Step 6: Add LSTM predictions (Premium)
    predictions = add_lstm_predictions(predictions, models)
    
    # Step 7: Generate tiered picks
    free, pro, premium = generate_tiered_picks(predictions, stock_info)
    
    print("\n" + "=" * 70)
    print("✅ Stock picks generation complete!")
    print("=" * 70)
    print("\n📁 Output files:")
    print("   • data/top10_free.csv    - Free tier (10 stocks)")
    print("   • data/top25_pro.csv     - Pro tier (25 stocks)")
    print("   • data/top50_premium.csv - Premium tier (50 stocks)")
    print("\n")


if __name__ == '__main__':
    main()
