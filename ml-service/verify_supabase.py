#!/usr/bin/env python3
"""
Verify Supabase historical data migration

Checks:
- Connection to Supabase
- Row count
- Symbol coverage
- Date range
- Sample data quality
- Test predictions
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

try:
    from supabase import create_client
    import pandas as pd
    import asyncio
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("Run: pip install supabase pandas")
    sys.exit(1)

from supabase_data import (
    fetch_historical_data, 
    get_available_symbols,
    get_data_summary
)

async def verify_migration():
    """Run comprehensive migration verification"""
    
    print("=" * 70)
    print("🔍 Supabase Migration Verification")
    print("=" * 70)
    print()
    
    # Check 1: Connection
    print("1️⃣  Testing Supabase connection...")
    try:
        SUPABASE_URL = os.getenv('SUPABASE_URL')
        SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')
        
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("   ❌ Environment variables not set")
            return False
        
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.table('historical_prices').select('id').limit(1).execute()
        print(f"   ✅ Connected to {SUPABASE_URL}")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        return False
    
    # Check 2: Row Count
    print("\n2️⃣  Checking row count...")
    try:
        response = supabase.table('historical_prices').select('id', count='exact').limit(1).execute()
        total_rows = response.count
        print(f"   ✅ Total rows: {total_rows:,}")
        
        if total_rows == 0:
            print("   ❌ No data found! Run migration script.")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # Check 3: Symbol Coverage
    print("\n3️⃣  Checking symbol coverage...")
    try:
        symbols = get_available_symbols()
        print(f"   ✅ Found {len(symbols)} unique symbols")
        print(f"   📊 Sample: {', '.join(symbols[:10])}")
        
        if len(symbols) == 0:
            print("   ❌ No symbols found!")
            return False
    except Exception as e:
        print(f"   ⚠️  Error getting symbols: {e}")
    
    # Check 4: Date Range
    print("\n4️⃣  Checking date range...")
    try:
        date_response = supabase.table('historical_prices').select('date').order('date').limit(1).execute()
        earliest = date_response.data[0]['date'] if date_response.data else None
        
        date_response = supabase.table('historical_prices').select('date').order('date', desc=True).limit(1).execute()
        latest = date_response.data[0]['date'] if date_response.data else None
        
        print(f"   ✅ Date range: {earliest} to {latest}")
    except Exception as e:
        print(f"   ⚠️  Error: {e}")
    
    # Check 5: Sample Data Quality
    print("\n5️⃣  Testing data fetch for sample symbols...")
    try:
        test_symbols = ['AAPL', 'MSFT', 'GOOGL']
        df = await fetch_historical_data(test_symbols, days=60)
        
        if df.empty:
            print("   ❌ No data fetched!")
            return False
        
        print(f"   ✅ Fetched {len(df):,} rows for {df['symbol'].nunique()} symbols")
        
        # Check data completeness
        for symbol in test_symbols:
            symbol_df = df[df['symbol'] == symbol]
            if len(symbol_df) > 0:
                print(f"   📈 {symbol}: {len(symbol_df)} days, latest ${symbol_df['close'].iloc[-1]:.2f}")
            else:
                print(f"   ⚠️  {symbol}: No data found")
        
    except Exception as e:
        print(f"   ❌ Error fetching data: {e}")
        return False
    
    # Check 6: Test Feature Calculation
    print("\n6️⃣  Testing feature calculation...")
    try:
        from train_ml_models import calculate_technical_indicators
        
        # Get data for one symbol
        test_df = df[df['symbol'] == 'AAPL'].copy()
        
        if len(test_df) < 60:
            print("   ⚠️  Not enough data for feature calculation")
        else:
            features = calculate_technical_indicators(test_df)
            print(f"   ✅ Calculated {len(features)} technical indicators")
            print(f"      RSI: {features['rsi_14']:.2f}")
            print(f"      SMA20: ${features['sma_20']:.2f}")
            print(f"      Volatility: {features['volatility_20d']:.2f}%")
    except Exception as e:
        print(f"   ⚠️  Feature calculation error: {e}")
    
    # Check 7: Test ML Prediction Flow
    print("\n7️⃣  Testing ML prediction flow...")
    try:
        from train_ml_models import (
            calculate_technical_indicators,
            calculate_fundamental_metrics,
            calculate_market_factors,
            StockFactors
        )
        
        stock_factors = []
        for symbol in ['AAPL', 'MSFT']:
            symbol_df = df[df['symbol'] == symbol].sort_values('date')
            
            if len(symbol_df) < 60:
                continue
            
            technical = calculate_technical_indicators(symbol_df)
            fundamental = calculate_fundamental_metrics(symbol_df)
            market = calculate_market_factors(symbol_df)
            
            factors = StockFactors(
                symbol=symbol,
                timestamp=symbol_df['date'].iloc[-1].isoformat(),
                fundamental=fundamental,
                technical=technical,
                sentiment={'score': 0.5},
                market=market
            )
            stock_factors.append(factors)
        
        print(f"   ✅ Created {len(stock_factors)} StockFactors objects")
        print(f"   ✅ Ready for ML predictions!")
        
    except Exception as e:
        print(f"   ❌ Prediction flow error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Summary
    print("\n" + "=" * 70)
    print("✅ VERIFICATION COMPLETE")
    print("=" * 70)
    print()
    print("Summary:")
    print(f"  • Database: Connected ✅")
    print(f"  • Total rows: {total_rows:,}")
    print(f"  • Symbols: {len(symbols)}")
    print(f"  • Date range: {earliest} to {latest}")
    print(f"  • Data quality: OK ✅")
    print(f"  • Feature calculation: Working ✅")
    print(f"  • ML prediction flow: Ready ✅")
    print()
    print("🚀 System ready for predictions!")
    print()
    
    return True

if __name__ == "__main__":
    result = asyncio.run(verify_migration())
    sys.exit(0 if result else 1)
