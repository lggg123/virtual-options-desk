"""
Multi-Model Ensemble for Stock Screening
Combines XGBoost, Random Forest, LSTM, and LightGBM
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, asdict
import joblib
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit
import xgboost as xgb
import lightgbm as lgb
from datetime import datetime
import json
import os

# Deep learning imports
try:
    import torch
    import torch.nn as nn
    from torch.utils.data import Dataset, DataLoader
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("⚠️  PyTorch not available, LSTM model will be disabled")


@dataclass
class ModelPrediction:
    """Prediction result from ensemble model"""
    symbol: str
    score: float
    rank: int
    confidence: float
    factor_importance: Dict[str, float]
    model_contributions: Dict[str, float]
    predicted_return: float
    risk_score: float
    
    def to_dict(self):
        return asdict(self)


# ==================== FEATURE ENGINEERING ====================

class FeatureEngineer:
    """Prepares features for ML models"""
    
    def __init__(self):
        self.scaler = RobustScaler()  # Robust to outliers
        self.feature_names = []
        self.is_fitted = False
    
    def prepare_features(self, stock_factors: List, fit: bool = False) -> pd.DataFrame:
        """Convert StockFactors to ML-ready DataFrame"""
        
        rows = []
        for sf in stock_factors:
            row = {'symbol': sf.symbol, 'timestamp': sf.timestamp}
            
            # Flatten all factor dictionaries
            row.update({f'fund_{k}': v for k, v in sf.fundamental.items()})
            row.update({f'tech_{k}': v for k, v in sf.technical.items()})
            row.update({f'sent_{k}': v for k, v in sf.sentiment.items()})
            row.update({f'mkt_{k}': v for k, v in sf.market.items()})
            
            rows.append(row)
        
        df = pd.DataFrame(rows)
        
        # Handle missing values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())
        
        # Store feature names
        if fit:
            self.feature_names = [col for col in df.columns if col not in ['symbol', 'timestamp']]
            self.is_fitted = True
        
        return df
    
    def create_target_labels(self, df: pd.DataFrame, price_data: Dict[str, pd.DataFrame], 
                            forward_days: int = 30) -> pd.Series:
        """Create forward return labels for supervised learning"""
        
        labels = []
        for _, row in df.iterrows():
            symbol = row['symbol']
            if symbol in price_data:
                prices = price_data[symbol]['close']
                current_price = prices.iloc[-1]
                future_price = prices.iloc[-1 - forward_days] if len(prices) > forward_days else current_price
                forward_return = (future_price / current_price - 1) * 100
                labels.append(forward_return)
            else:
                labels.append(0)
        
        return pd.Series(labels)
    
    def scale_features(self, df: pd.DataFrame, fit: bool = False) -> np.ndarray:
        """Scale features for model training"""
        
        X = df[self.feature_names].values
        
        if fit:
            X_scaled = self.scaler.fit_transform(X)
        else:
            X_scaled = self.scaler.transform(X)
        
        return X_scaled
    
    def engineer_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features"""
        
        # Valuation * Growth interactions
        if 'fund_pe_ratio' in df.columns and 'fund_earnings_growth_yoy' in df.columns:
            df['pe_growth_interaction'] = df['fund_pe_ratio'] * df['fund_earnings_growth_yoy']
        
        # Momentum * Volume
        if 'tech_rsi_14' in df.columns and 'tech_volume_ratio' in df.columns:
            df['momentum_volume_interaction'] = df['tech_rsi_14'] * df['tech_volume_ratio']
        
        # Technical confluence
        if all(f'tech_{col}' in df.columns for col in ['rsi_14', 'macd', 'adx']):
            df['technical_score'] = (df['tech_rsi_14'] + df['tech_macd'] + df['tech_adx']) / 3
        
        return df


# ==================== LSTM MODEL (TIME SERIES) ====================

if TORCH_AVAILABLE:
    class StockSequenceDataset(Dataset):
        """Dataset for LSTM time-series prediction"""
        
        def __init__(self, sequences: np.ndarray, labels: np.ndarray):
            self.sequences = torch.FloatTensor(sequences)
            self.labels = torch.FloatTensor(labels)
        
        def __len__(self):
            return len(self.sequences)
        
        def __getitem__(self, idx):
            return self.sequences[idx], self.labels[idx]
    
    
    class LSTMPredictor(nn.Module):
        """LSTM model for time-series factor prediction"""
        
        def __init__(self, input_dim: int, hidden_dim: int = 128, num_layers: int = 2, dropout: float = 0.3):
            super().__init__()
            
            self.lstm = nn.LSTM(
                input_dim, 
                hidden_dim, 
                num_layers, 
                batch_first=True,
                dropout=dropout if num_layers > 1 else 0
            )
            
            self.attention = nn.MultiheadAttention(hidden_dim, num_heads=4, batch_first=True)
            self.fc1 = nn.Linear(hidden_dim, 64)
            self.dropout = nn.Dropout(dropout)
            self.fc2 = nn.Linear(64, 1)
            self.relu = nn.ReLU()
        
        def forward(self, x):
            # LSTM
            lstm_out, (hidden, cell) = self.lstm(x)
            
            # Self-attention
            attn_out, _ = self.attention(lstm_out, lstm_out, lstm_out)
            
            # Use last timestep
            last_out = attn_out[:, -1, :]
            
            # Fully connected layers
            out = self.relu(self.fc1(last_out))
            out = self.dropout(out)
            out = self.fc2(out)
            
            return out.squeeze()


# ==================== ENSEMBLE MODEL ====================

class StockScreeningEnsemble:
    """Ensemble of multiple models for robust predictions"""
    
    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.models = {}
        self.feature_engineer = FeatureEngineer()
        self.feature_importance = {}
        self.is_trained = False
    
    def _default_config(self) -> Dict:
        return {
            'xgboost': {
                'n_estimators': 500,
                'max_depth': 8,
                'learning_rate': 0.05,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'objective': 'reg:squarederror',
                'eval_metric': 'rmse',
                'random_state': 42
            },
            'random_forest': {
                'n_estimators': 300,
                'max_depth': 15,
                'min_samples_split': 10,
                'min_samples_leaf': 5,
                'max_features': 'sqrt',
                'random_state': 42
            },
            'lightgbm': {
                'n_estimators': 500,
                'max_depth': 8,
                'learning_rate': 0.05,
                'num_leaves': 31,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'random_state': 42,
                'verbose': -1
            },
            'ensemble_weights': {
                'xgboost': 0.35,
                'random_forest': 0.25,
                'lightgbm': 0.30,
                'lstm': 0.10
            }
        }
    
    def train(self, stock_factors: List, price_data: Dict[str, pd.DataFrame], 
              forward_days: int = 30, cv_splits: int = 5):
        """Train all models with cross-validation"""
        
        print("📊 Preparing features...")
        df = self.feature_engineer.prepare_features(stock_factors, fit=True)
        df = self.feature_engineer.engineer_interaction_features(df)
        
        print("🎯 Creating target labels...")
        y = self.feature_engineer.create_target_labels(df, price_data, forward_days)
        
        print("⚖️  Scaling features...")
        X = self.feature_engineer.scale_features(df, fit=True)
        
        # Time series cross-validation
        tscv = TimeSeriesSplit(n_splits=cv_splits)
        
        # Train XGBoost
        print("\n🚀 Training XGBoost...")
        self.models['xgboost'] = xgb.XGBRegressor(**self.config['xgboost'])
        cv_scores = []
        
        for train_idx, val_idx in tscv.split(X):
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
            
            self.models['xgboost'].fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                verbose=False
            )
            score = self.models['xgboost'].score(X_val, y_val)
            cv_scores.append(score)
        
        print(f"   ✓ XGBoost CV Score: {np.mean(cv_scores):.4f} (+/- {np.std(cv_scores):.4f})")
        
        # Final fit on all data
        self.models['xgboost'].fit(X, y)
        self.feature_importance['xgboost'] = dict(zip(
            self.feature_engineer.feature_names,
            self.models['xgboost'].feature_importances_
        ))
        
        # Train Random Forest
        print("\n🌲 Training Random Forest...")
        self.models['random_forest'] = RandomForestRegressor(**self.config['random_forest'], n_jobs=-1)
        self.models['random_forest'].fit(X, y)
        self.feature_importance['random_forest'] = dict(zip(
            self.feature_engineer.feature_names,
            self.models['random_forest'].feature_importances_
        ))
        print(f"   ✓ Random Forest trained")
        
        # Train LightGBM
        print("\n💡 Training LightGBM...")
        self.models['lightgbm'] = lgb.LGBMRegressor(**self.config['lightgbm'])
        self.models['lightgbm'].fit(X, y, eval_set=[(X, y)])
        self.feature_importance['lightgbm'] = dict(zip(
            self.feature_engineer.feature_names,
            self.models['lightgbm'].feature_importances_
        ))
        print(f"   ✓ LightGBM trained")
        
        # Train LSTM (if available)
        if TORCH_AVAILABLE:
            print("\n🧠 Training LSTM...")
            self._train_lstm(X, y)
        
        self.is_trained = True
        print("\n✅ All models trained successfully!")
    
    def _train_lstm(self, X: np.ndarray, y: pd.Series, epochs: int = 50):
        """Train LSTM model"""
        
        # Create sequences (using sliding window)
        sequence_length = 20
        sequences = []
        labels = []
        
        for i in range(len(X) - sequence_length):
            sequences.append(X[i:i+sequence_length])
            labels.append(y.iloc[i+sequence_length])
        
        sequences = np.array(sequences)
        labels = np.array(labels)
        
        # Create dataset and dataloader
        dataset = StockSequenceDataset(sequences, labels)
        dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
        
        # Initialize model
        input_dim = X.shape[1]
        model = LSTMPredictor(input_dim)
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
        
        # Training loop
        model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch_seq, batch_labels in dataloader:
                optimizer.zero_grad()
                predictions = model(batch_seq)
                loss = criterion(predictions, batch_labels)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()
            
            if (epoch + 1) % 10 == 0:
                print(f"   Epoch {epoch+1}/{epochs}, Loss: {total_loss/len(dataloader):.4f}")
        
        self.models['lstm'] = model
        print(f"   ✓ LSTM trained")
    
    def predict(self, stock_factors: List) -> List[ModelPrediction]:
        """Generate predictions for stocks"""
        
        if not self.is_trained:
            raise ValueError("❌ Models not trained yet! Call train() first.")
        
        # Prepare features
        df = self.feature_engineer.prepare_features(stock_factors, fit=False)
        df = self.feature_engineer.engineer_interaction_features(df)
        X = self.feature_engineer.scale_features(df, fit=False)
        
        # Get predictions from each model
        predictions = {}
        predictions['xgboost'] = self.models['xgboost'].predict(X)
        predictions['random_forest'] = self.models['random_forest'].predict(X)
        predictions['lightgbm'] = self.models['lightgbm'].predict(X)
        
        if 'lstm' in self.models and TORCH_AVAILABLE:
            # For LSTM, we'd need sequences - simplified here
            predictions['lstm'] = self.models['xgboost'].predict(X)  # Fallback
        
        # Ensemble predictions
        weights = self.config['ensemble_weights']
        ensemble_preds = np.zeros(len(X))
        
        for model_name, preds in predictions.items():
            if model_name in weights:
                ensemble_preds += preds * weights[model_name]
        
        # Calculate confidence (based on model agreement)
        confidences = self._calculate_confidence(predictions)
        
        # Calculate risk scores
        risk_scores = self._calculate_risk(df, ensemble_preds)
        
        # Create ModelPrediction objects
        results = []
        for i, row in df.iterrows():
            # Get top feature importance for this prediction
            top_factors = self._get_top_factors(X[i], n=10)
            
            model_contributions = {
                model: float(pred[i] * weights.get(model, 0))
                for model, pred in predictions.items()
            }
            
            pred = ModelPrediction(
                symbol=row['symbol'],
                score=float(ensemble_preds[i]),
                rank=0,  # Will be assigned after sorting
                confidence=float(confidences[i]),
                factor_importance=top_factors,
                model_contributions=model_contributions,
                predicted_return=float(ensemble_preds[i]),
                risk_score=float(risk_scores[i])
            )
            results.append(pred)
        
        # Rank predictions
        results.sort(key=lambda x: x.score, reverse=True)
        for rank, pred in enumerate(results, 1):
            pred.rank = rank
        
        return results
    
    def _calculate_confidence(self, predictions: Dict[str, np.ndarray]) -> np.ndarray:
        """Calculate prediction confidence based on model agreement"""
        
        pred_array = np.array([preds for preds in predictions.values()])
        
        # Standard deviation across models (lower = higher agreement)
        std_dev = np.std(pred_array, axis=0)
        
        # Convert to confidence score (0-1)
        max_std = np.max(std_dev)
        if max_std > 0:
            confidence = 1 - (std_dev / max_std)
        else:
            confidence = np.ones(len(std_dev))
        
        return confidence
    
    def _calculate_risk(self, df: pd.DataFrame, predictions: np.ndarray) -> np.ndarray:
        """Calculate risk scores"""
        
        risk_scores = np.zeros(len(df))
        
        # Factors that indicate risk
        if 'tech_volatility_60d' in df.columns:
            risk_scores += df['tech_volatility_60d'].values / 100
        
        if 'fund_debt_to_equity' in df.columns:
            risk_scores += df['fund_debt_to_equity'].values / 10
        
        # Normalize to 0-100 scale
        risk_scores = (risk_scores / np.max(risk_scores)) * 100 if np.max(risk_scores) > 0 else risk_scores
        
        return risk_scores
    
    def _get_top_factors(self, X_row: np.ndarray, n: int = 10) -> Dict[str, float]:
        """Get top contributing factors for a prediction"""
        
        # Average feature importance across models
        avg_importance = {}
        for feature_name in self.feature_engineer.feature_names:
            importances = [
                self.feature_importance[model].get(feature_name, 0)
                for model in self.feature_importance.keys()
            ]
            avg_importance[feature_name] = float(np.mean(importances))
        
        # Sort and get top N
        sorted_factors = sorted(avg_importance.items(), key=lambda x: x[1], reverse=True)
        return dict(sorted_factors[:n])
    
    def save_models(self, path: str = 'ml_models'):
        """Save all trained models"""
        os.makedirs(path, exist_ok=True)
        
        # Save sklearn models
        joblib.dump(self.models['xgboost'], f'{path}/xgboost.pkl')
        joblib.dump(self.models['random_forest'], f'{path}/random_forest.pkl')
        joblib.dump(self.models['lightgbm'], f'{path}/lightgbm.pkl')
        
        # Save LSTM if available
        if 'lstm' in self.models and TORCH_AVAILABLE:
            torch.save(self.models['lstm'].state_dict(), f'{path}/lstm.pth')
        
        # Save feature engineer
        joblib.dump(self.feature_engineer, f'{path}/feature_engineer.pkl')
        
        # Save config and metadata
        metadata = {
            'config': self.config,
            'trained_at': datetime.now().isoformat(),
            'feature_count': len(self.feature_engineer.feature_names),
            'torch_available': TORCH_AVAILABLE
        }
        with open(f'{path}/metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✅ Models saved to {path}/")
    
    def load_models(self, path: str = 'ml_models'):
        """Load trained models"""
        
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model directory not found: {path}")
        
        self.models['xgboost'] = joblib.load(f'{path}/xgboost.pkl')
        self.models['random_forest'] = joblib.load(f'{path}/random_forest.pkl')
        self.models['lightgbm'] = joblib.load(f'{path}/lightgbm.pkl')
        
        if os.path.exists(f'{path}/lstm.pth') and TORCH_AVAILABLE:
            # Would need to recreate model architecture
            pass
        
        self.feature_engineer = joblib.load(f'{path}/feature_engineer.pkl')
        
        with open(f'{path}/metadata.json', 'r') as f:
            metadata = json.load(f)
            self.config = metadata['config']
        
        self.is_trained = True
        print(f"✅ Models loaded from {path}/")


# ==================== MONTHLY SCREENING PIPELINE ====================

class MonthlyScreeningPipeline:
    """Orchestrates monthly stock screening"""
    
    def __init__(self, ensemble: StockScreeningEnsemble):
        self.ensemble = ensemble
    
    async def run_monthly_screen(self, universe: List[str], top_n: int = 1000) -> List[ModelPrediction]:
        """Run full monthly screening process"""
        
        print(f"🚀 Starting monthly screen for {len(universe)} stocks...")
        
        # Note: You'll need to implement or import BatchFactorCalculator
        # from your factor_calculator module
        
        # Step 1: Calculate factors
        print("\n1. Calculating factors...")
        # batch_calc = BatchFactorCalculator({})  # Add API keys
        # stock_factors = await batch_calc.process_universe(universe)
        # For now, this is a placeholder
        stock_factors = []  # Replace with actual implementation
        print(f"✅ Calculated factors for {len(stock_factors)} stocks")
        
        # Step 2: Generate predictions
        print("\n2. Generating ML predictions...")
        predictions = self.ensemble.predict(stock_factors)
        print(f"✅ Generated {len(predictions)} predictions")
        
        # Step 3: Select top picks
        top_picks = predictions[:top_n]
        
        # Step 4: Categorize picks
        categorized = self._categorize_picks(top_picks)
        
        print(f"\n✅ Monthly screening complete!")
        print(f"📊 Top {top_n} picks selected")
        print(f"   - Growth: {len(categorized['growth'])}")
        print(f"   - Value: {len(categorized['value'])}")
        print(f"   - Momentum: {len(categorized['momentum'])}")
        print(f"   - Quality: {len(categorized['quality'])}")
        
        return top_picks
    
    def _categorize_picks(self, picks: List[ModelPrediction]) -> Dict[str, List]:
        """Categorize stocks by investment style"""
        
        categories = {
            'growth': [],
            'value': [],
            'momentum': [],
            'quality': []
        }
        
        for pick in picks:
            # Categorization logic based on factor importance
            factors = pick.factor_importance
            
            if any('growth' in k for k in factors.keys()):
                categories['growth'].append(pick)
            elif any('pe_ratio' in k or 'pb_ratio' in k for k in factors.keys()):
                categories['value'].append(pick)
            elif any('rsi' in k or 'macd' in k for k in factors.keys()):
                categories['momentum'].append(pick)
            else:
                categories['quality'].append(pick)
        
        return categories


# ==================== USAGE EXAMPLE ====================

async def main():
    """Example usage"""
    
    # Initialize ensemble
    ensemble = StockScreeningEnsemble()
    
    # Training phase (run once or periodically)
    # stock_factors = [...]  # From factor calculator
    # price_data = {...}  # Historical prices
    # ensemble.train(stock_factors, price_data, forward_days=30)
    # ensemble.save_models()
    
    # Prediction phase (run monthly)
    ensemble.load_models()
    
    # Run monthly screening
    pipeline = MonthlyScreeningPipeline(ensemble)
    universe = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']  # List of ~5000 stocks
    top_picks = await pipeline.run_monthly_screen(universe, top_n=100)
    
    # Display top 10
    print("\n🏆 Top 10 Picks:")
    for i, pick in enumerate(top_picks[:10], 1):
        print(f"{i}. {pick.symbol}: Score={pick.score:.2f}, Confidence={pick.confidence:.2%}, Risk={pick.risk_score:.1f}")


if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
