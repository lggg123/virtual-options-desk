"""
Supabase Integration for ML Stock Screening
Saves predictions and screening results to Supabase database
"""

import os
from typing import List, Dict, Optional
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_load_dotenv

load_dotenv()


class SupabaseClient:
    """Client for interacting with Supabase database"""
    
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment")
        
        self.client: Client = create_client(url, key)
    
    def save_monthly_screen(
        self, 
        universe_size: int, 
        picks_count: int, 
        model_version: str,
        metadata: Dict = None
    ) -> str:
        """
        Create a new monthly screen record
        Returns: screen_id
        """
        data = {
            'universe_size': universe_size,
            'picks_generated': picks_count,
            'model_version': model_version,
            'metadata': metadata or {}
        }
        
        response = self.client.table('monthly_screens').insert(data).execute()
        return response.data[0]['id']
    
    def save_stock_picks(self, screen_id: str, predictions: List) -> None:
        """
        Save stock picks from ML predictions
        predictions: List of ModelPrediction objects
        """
        picks_data = []
        
        for pred in predictions:
            pick = {
                'screen_id': screen_id,
                'symbol': pred.symbol,
                'company_name': getattr(pred, 'company_name', pred.symbol),
                'ai_score': float(pred.score),
                'rank': pred.rank,
                'confidence': float(pred.confidence),
                'risk_score': float(pred.risk_score),
                'predicted_return': float(pred.predicted_return),
                'category': self._categorize_stock(pred),
                'xgboost_score': float(pred.model_contributions.get('xgboost', 0)),
                'random_forest_score': float(pred.model_contributions.get('random_forest', 0)),
                'lightgbm_score': float(pred.model_contributions.get('lightgbm', 0)),
                'lstm_score': float(pred.model_contributions.get('lstm', 0)),
                'factor_scores': pred.factor_importance
            }
            picks_data.append(pick)
        
        # Batch insert (Supabase handles up to 1000 rows)
        batch_size = 1000
        for i in range(0, len(picks_data), batch_size):
            batch = picks_data[i:i+batch_size]
            self.client.table('stock_picks').insert(batch).execute()
    
    def save_stock_factors(self, pick_id: str, factors: Dict) -> None:
        """Save detailed factor values for a stock pick"""
        
        factor_data = {
            'pick_id': pick_id,
            # Fundamental
            'pe_ratio': factors.get('fund_pe_ratio'),
            'pb_ratio': factors.get('fund_pb_ratio'),
            'ps_ratio': factors.get('fund_ps_ratio'),
            'roe': factors.get('fund_roe'),
            'roa': factors.get('fund_roa'),
            'revenue_growth_yoy': factors.get('fund_revenue_growth_yoy'),
            'earnings_growth_yoy': factors.get('fund_earnings_growth_yoy'),
            'debt_to_equity': factors.get('fund_debt_to_equity'),
            'current_ratio': factors.get('fund_current_ratio'),
            # Technical
            'rsi_14': factors.get('tech_rsi_14'),
            'macd': factors.get('tech_macd'),
            'adx': factors.get('tech_adx'),
            'price_vs_sma50': factors.get('tech_price_vs_sma50'),
            'price_vs_sma200': factors.get('tech_price_vs_sma200'),
            'volume_ratio': factors.get('tech_volume_ratio'),
            'return_20d': factors.get('tech_return_20d'),
            # Sentiment
            'news_sentiment': factors.get('sent_news_sentiment'),
            'analyst_rating': factors.get('sent_analyst_rating'),
            # Market
            'beta': factors.get('mkt_beta'),
            'sector_momentum': factors.get('mkt_sector_momentum'),
            # Store all factors
            'all_factors': factors
        }
        
        self.client.table('stock_factors').insert(factor_data).execute()
    
    def get_latest_screen(self) -> Optional[Dict]:
        """Get the most recent monthly screen"""
        response = self.client.table('monthly_screens')\
            .select('*')\
            .order('run_date', desc=True)\
            .limit(1)\
            .execute()
        
        return response.data[0] if response.data else None
    
    def get_top_picks(
        self, 
        limit: int = 100, 
        category: Optional[str] = None,
        min_confidence: float = 0.0,
        max_risk: float = 100.0
    ) -> List[Dict]:
        """Get top stock picks with optional filtering"""
        
        latest_screen = self.get_latest_screen()
        if not latest_screen:
            return []
        
        query = self.client.table('stock_picks')\
            .select('*')\
            .eq('screen_id', latest_screen['id'])\
            .gte('confidence', min_confidence)\
            .lte('risk_score', max_risk)
        
        if category:
            query = query.eq('category', category)
        
        response = query.order('rank').limit(limit).execute()
        return response.data
    
    def get_stock_details(self, symbol: str) -> Optional[Dict]:
        """Get detailed analysis for a specific stock"""
        
        latest_screen = self.get_latest_screen()
        if not latest_screen:
            return None
        
        response = self.client.table('stock_picks')\
            .select('*, stock_factors(*)')\
            .eq('screen_id', latest_screen['id'])\
            .eq('symbol', symbol.upper())\
            .execute()
        
        return response.data[0] if response.data else None
    
    def save_candlestick_pattern(
        self,
        symbol: str,
        pattern_type: str,
        timeframe: str,
        confidence: float,
        direction: str,
        strength: int,
        price: float,
        volume: float = None,
        rsi: float = None
    ) -> str:
        """Save detected candlestick pattern"""
        
        data = {
            'symbol': symbol.upper(),
            'pattern_type': pattern_type,
            'timeframe': timeframe,
            'confidence': confidence,
            'direction': direction,
            'strength': strength,
            'price_at_detection': price,
            'volume_at_detection': volume,
            'rsi_at_detection': rsi
        }
        
        response = self.client.table('candlestick_patterns').insert(data).execute()
        return response.data[0]['id']
    
    def get_recent_patterns(
        self, 
        symbol: str, 
        timeframe: str = '1d', 
        days: int = 7
    ) -> List[Dict]:
        """Get recent candlestick patterns for a symbol"""
        
        from datetime import datetime, timedelta
        since = datetime.utcnow() - timedelta(days=days)
        
        response = self.client.table('candlestick_patterns')\
            .select('*')\
            .eq('symbol', symbol.upper())\
            .eq('timeframe', timeframe)\
            .gte('detected_at', since.isoformat())\
            .order('detected_at', desc=True)\
            .execute()
        
        return response.data
    
    def update_pick_performance(
        self, 
        pick_id: str, 
        actual_return_1w: float = None,
        actual_return_1m: float = None,
        actual_return_3m: float = None,
        is_winner: bool = None
    ) -> None:
        """Update actual performance for a stock pick"""
        
        updates = {}
        if actual_return_1w is not None:
            updates['actual_return_1w'] = actual_return_1w
        if actual_return_1m is not None:
            updates['actual_return_1m'] = actual_return_1m
        if actual_return_3m is not None:
            updates['actual_return_3m'] = actual_return_3m
        if is_winner is not None:
            updates['is_winner'] = is_winner
        
        if updates:
            self.client.table('stock_picks')\
                .update(updates)\
                .eq('id', pick_id)\
                .execute()
    
    def save_performance_tracking(
        self,
        screen_id: str,
        metrics: Dict
    ) -> None:
        """Save performance tracking metrics for a screen"""
        
        data = {
            'screen_id': screen_id,
            'avg_return_1m': metrics.get('avg_return_1m'),
            'avg_return_3m': metrics.get('avg_return_3m'),
            'win_rate': metrics.get('win_rate'),
            'sharpe_ratio': metrics.get('sharpe_ratio'),
            'max_drawdown': metrics.get('max_drawdown'),
            'growth_return': metrics.get('growth_return'),
            'value_return': metrics.get('value_return'),
            'momentum_return': metrics.get('momentum_return'),
            'quality_return': metrics.get('quality_return'),
            'model_rmse': metrics.get('model_rmse'),
            'model_mae': metrics.get('model_mae')
        }
        
        self.client.table('performance_tracking').insert(data).execute()
    
    def _categorize_stock(self, prediction) -> str:
        """Categorize stock based on factor importance"""
        
        factors = prediction.factor_importance
        
        # Simple categorization logic
        if any('growth' in k.lower() for k in factors.keys()):
            return 'growth'
        elif any('pe_ratio' in k or 'pb_ratio' in k for k in factors.keys()):
            return 'value'
        elif any('rsi' in k or 'macd' in k for k in factors.keys()):
            return 'momentum'
        else:
            return 'quality'


# ==================== INTEGRATION WITH ML ENSEMBLE ====================

def save_screening_results_to_supabase(predictions: List, config: Dict) -> str:
    """
    Save ML screening results to Supabase
    
    Args:
        predictions: List of ModelPrediction objects from ML ensemble
        config: Configuration dict with metadata
    
    Returns:
        screen_id: UUID of created screen
    """
    
    db = SupabaseClient()
    
    print("💾 Saving screening results to Supabase...")
    
    # Create screen record
    screen_id = db.save_monthly_screen(
        universe_size=config.get('universe_size', len(predictions)),
        picks_count=len(predictions),
        model_version=config.get('model_version', '1.0.0'),
        metadata=config
    )
    
    print(f"   ✓ Created screen: {screen_id}")
    
    # Save picks in batches
    print(f"   Saving {len(predictions)} picks...")
    db.save_stock_picks(screen_id, predictions)
    print(f"   ✓ Saved {len(predictions)} picks")
    
    print("✅ Screening results saved to Supabase!")
    return screen_id


# ==================== USAGE EXAMPLE ====================

if __name__ == '__main__':
    # Example usage
    db = SupabaseClient()
    
    # Get latest screen
    latest = db.get_latest_screen()
    if latest:
        print(f"Latest screen: {latest['run_date']}")
        print(f"Picks: {latest['picks_generated']}")
    
    # Get top 10 picks
    top_picks = db.get_top_picks(limit=10)
    print(f"\nTop 10 Picks:")
    for pick in top_picks:
        print(f"{pick['rank']}. {pick['symbol']}: {pick['ai_score']:.2f}")
    
    # Get stock details
    stock = db.get_stock_details('AAPL')
    if stock:
        print(f"\nAAPL Details:")
        print(f"  Score: {stock['ai_score']}")
        print(f"  Confidence: {stock['confidence']}")
        print(f"  Risk: {stock['risk_score']}")
