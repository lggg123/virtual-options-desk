#!/usr/bin/env python3
"""
Fetch historical stock data directly to Supabase

Downloads multi-year data for 1000+ major stocks and uploads to Supabase.
Skips CSV - goes straight to database.
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client
import yfinance as yf
import pandas as pd
from tqdm import tqdm
import time

# Load environment
load_dotenv()

# Supabase config
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

# Initialize Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def load_stock_symbols():
    """Load top 1000 common stocks from eodhd_us_tickers.csv"""
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'eodhd_us_tickers.csv')
    
    try:
        df = pd.read_csv(csv_path)
        
        # Filter only common stocks on major exchanges
        df = df[
            (df['Type'] == 'Common Stock') & 
            (df['Exchange'].isin(['NYSE', 'NASDAQ', 'NYSE ARCA', 'BATS']))
        ]
        
        # Get symbols, limit to 1000
        symbols = df['Code'].head(1000).tolist()
        
        print(f"📊 Loaded {len(symbols)} symbols from {csv_path}")
        return symbols
        
    except Exception as e:
        print(f"⚠️  Could not load CSV: {e}")
        print("Using default symbol list...")
        # Fallback to major stocks
        return [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'NFLX', 'INTC',
            'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'USB',
            'UNH', 'JNJ', 'PFE', 'ABBV', 'TMO', 'MRK', 'ABT', 'DHR', 'LLY', 'BMY',
            'WMT', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'TJX', 'DG', 'COST',
            'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PXD', 'MPC', 'VLO', 'PSX', 'OXY',
            'BA', 'CAT', 'GE', 'HON', 'UNP', 'UPS', 'LMT', 'RTX', 'DE', 'MMM',
            'DIS', 'CMCSA', 'VZ', 'T', 'TMUS', 'CHTR', 'NXST', 'PARA', 'WBD', 'FOXA',
            'V', 'MA', 'PYPL', 'SQ', 'COIN', 'SHOP', 'UBER', 'ABNB', 'DASH', 'SNOW',
            'ADBE', 'CRM', 'ORCL', 'CSCO', 'ACN', 'IBM', 'QCOM', 'TXN', 'AVGO', 'NOW',
        ]

# Configuration
YEARS = 5  # 5 years of historical data for better ML predictions
BATCH_SIZE = 1000  # Upload in batches to avoid timeout


def fetch_symbol_data(symbol, years=3):
    """Fetch historical data for a symbol"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=years * 365)
        
        ticker = yf.Ticker(symbol)
        df = ticker.history(start=start_date, end=end_date)
        
        if df.empty:
            return None, f"{symbol}: No data"
        
        # Prepare data for Supabase
        df = df.reset_index()
        df['symbol'] = symbol
        df = df.rename(columns={
            'Date': 'date',
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume'
        })
        
        # Keep only required columns
        df = df[['symbol', 'date', 'open', 'high', 'low', 'close', 'volume']]
        
        # Convert date to string format
        df['date'] = df['date'].dt.strftime('%Y-%m-%d')
        
        # Convert to list of dicts
        records = df.to_dict('records')
        
        return records, None
        
    except Exception as e:
        return None, f"{symbol}: {str(e)}"


def upload_batch(records):
    """Upload a batch of records to Supabase"""
    try:
        result = supabase.table('historical_prices').upsert(
            records,
            on_conflict='symbol,date'
        ).execute()
        return True, None
    except Exception as e:
        return False, str(e)


def main():
    # Load symbols from CSV
    SYMBOLS = load_stock_symbols()
    
    print("=" * 70)
    print(f"📥 Fetching {YEARS} years of data for {len(SYMBOLS)} symbols")
    print("=" * 70)
    print(f"Start date: ~{(datetime.now() - timedelta(days=YEARS*365)).strftime('%Y-%m-%d')}")
    print(f"End date: {datetime.now().strftime('%Y-%m-%d')}")
    print(f"Target: Supabase ({SUPABASE_URL})")
    print()
    
    total_rows = 0
    successful_symbols = []
    errors = []
    
    # Fetch and upload each symbol
    for symbol in tqdm(SYMBOLS, desc="Processing symbols"):
        # Fetch data
        records, error = fetch_symbol_data(symbol, YEARS)
        
        if error:
            errors.append(error)
            tqdm.write(f"❌ {error}")
            continue
        
        if not records:
            errors.append(f"{symbol}: Empty data")
            continue
        
        # Upload in batches
        for i in range(0, len(records), BATCH_SIZE):
            batch = records[i:i + BATCH_SIZE]
            success, upload_error = upload_batch(batch)
            
            if not success:
                errors.append(f"{symbol}: Upload failed - {upload_error}")
                tqdm.write(f"❌ {symbol}: Upload failed")
                break
            
            time.sleep(0.1)  # Rate limiting
        else:
            # Successfully uploaded all batches
            successful_symbols.append(symbol)
            total_rows += len(records)
            tqdm.write(f"✅ {symbol}: {len(records)} rows")
    
    # Summary
    print()
    print("=" * 70)
    print("📊 Upload Complete")
    print("=" * 70)
    print(f"✅ Successful: {len(successful_symbols)} symbols")
    print(f"📈 Total rows: {total_rows:,}")
    print(f"❌ Errors: {len(errors)}")
    
    if successful_symbols:
        print(f"\nSuccessful symbols: {', '.join(successful_symbols[:10])}")
        if len(successful_symbols) > 10:
            print(f"  ... and {len(successful_symbols) - 10} more")
    
    if errors:
        print(f"\n⚠️  Errors ({len(errors)}):")
        for error in errors[:10]:
            print(f"  {error}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more")
    
    print()
    print("Next steps:")
    print("  1. Verify data: python -c \"from supabase_data import *; print(fetch_available_symbols())\"")
    print("  2. Retrain models: python train_ml_models.py")
    print("  3. Deploy: git push")
    print()


if __name__ == "__main__":
    main()
