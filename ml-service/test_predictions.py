#!/usr/bin/env python3
"""
Test ML API predictions with Supabase data
"""

import asyncio
import sys
from dotenv import load_dotenv

load_dotenv()

from supabase_data import fetch_historical_data, get_available_symbols
from train_ml_models import (
    calculate_technical_indicators,
    calculate_fundamental_metrics,
    calculate_market_factors,
    StockFactors
)

async def test_predictions():
    print("=" * 70)
    print("🧪 Testing ML Predictions with Supabase Data")
    print("=" * 70)
    print()
    
    # Get available symbols
    print("📊 Getting available symbols from database...")
    symbols = get_available_symbols()
    print(f"   Found {len(symbols)} symbols: {symbols}")
    print()
    
    if len(symbols) == 0:
        print("❌ No symbols found in database!")
        return False
    
    # Use first few symbols for testing
    test_symbols = symbols[:5]
    print(f"🎯 Testing with symbols: {test_symbols}")
    print()
    
    # Fetch historical data (need more days for features)
    print("📥 Fetching historical data (365 days)...")
    df = await fetch_historical_data(test_symbols, days=365)
    print(f"   Fetched {len(df):,} rows")
    print()
    
    if df.empty:
        print("❌ No data fetched!")
        return False
    
    # Calculate features for each symbol
    print("🔧 Calculating features...")
    stock_factors = []
    
    for symbol in test_symbols:
        symbol_df = df[df['symbol'] == symbol].sort_values('date')
        
        print(f"\n   {symbol}:")
        print(f"     Rows: {len(symbol_df)}")
        
        if len(symbol_df) < 60:
            print(f"     ⚠️  Not enough data (need 60+ days)")
            continue
        
        try:
            # Calculate all features
            technical = calculate_technical_indicators(symbol_df)
            fundamental = calculate_fundamental_metrics(symbol_df)
            market = calculate_market_factors(symbol_df)
            
            # Create StockFactors object
            factors = StockFactors(
                symbol=symbol,
                timestamp=symbol_df['date'].iloc[-1].isoformat(),
                fundamental=fundamental,
                technical=technical,
                sentiment={'score': 0.5},
                market=market
            )
            
            stock_factors.append(factors)
            
            print(f"     ✅ Features calculated")
            print(f"        RSI: {technical['rsi_14']:.2f}")
            print(f"        SMA20: ${technical['sma_20']:.2f}")
            print(f"        Volatility: {technical['volatility_20d']:.2f}%")
            
        except Exception as e:
            print(f"     ❌ Error: {e}")
            continue
    
    print()
    print("=" * 70)
    print(f"✅ Successfully created {len(stock_factors)} StockFactors objects")
    print()
    
    if len(stock_factors) > 0:
        print("Sample factor data:")
        sample = stock_factors[0]
        print(f"  Symbol: {sample.symbol}")
        print(f"  Timestamp: {sample.timestamp}")
        print(f"  Technical indicators: {list(sample.technical.keys())}")
        print(f"  Fundamental metrics: {list(sample.fundamental.keys())}")
        print()
        print("🚀 Ready for ML predictions!")
        return True
    else:
        print("⚠️  No stock factors created - need more historical data")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_predictions())
    sys.exit(0 if result else 1)
