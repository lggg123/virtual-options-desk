"""
Fetch historical stock data for ML predictions

Downloads 250 days of historical data for technical indicator calculation.
This data is needed for the ML models to generate accurate predictions.

Usage:
    python data/fetch_historical_for_ml.py
"""

import pandas as pd
import numpy as np
import time
import os
from eodhd import APIClient
from datetime import datetime, timedelta

EODHD_API_KEY = "68ebce6775f004.44089353"
TICKER_CSV = "data/stocks-list.csv"
OUTPUT_CSV = "data/historical_stock_data.csv"
DAYS_OF_HISTORY = 250  # ~1 year of trading days
BATCH_SIZE = 20
DELAY = 1  # seconds between batches

def download_historical(tickers, days=DAYS_OF_HISTORY):
    """Download historical data for tickers"""
    
    client = APIClient(EODHD_API_KEY)
    
    # Calculate start date
    start_date = (datetime.now() - timedelta(days=days + 100)).strftime('%Y-%m-%d')  # Extra buffer
    end_date = datetime.now().strftime('%Y-%m-%d')
    
    print(f"📊 Downloading {days} days of historical data...")
    print(f"   Date range: {start_date} to {end_date}")
    print(f"   Tickers: {len(tickers)}")
    
    all_data = []
    total = len(tickers)
    
    for i in range(0, total, BATCH_SIZE):
        batch = tickers[i:i+BATCH_SIZE]
        print(f"\n[{i+1:>4}/{total}] Processing batch {i//BATCH_SIZE+1}...")
        
        for ticker in batch:
            try:
                df = client.get_historical_data(
                    symbol=ticker,
                    interval="d",
                    iso8601_start=start_date,
                    iso8601_end=end_date
                )
                
                if df is not None and not df.empty:
                    # Ensure date is a column
                    if 'date' not in df.columns:
                        df = df.reset_index()
                    
                    df['symbol'] = ticker
                    
                    # Keep only last N days
                    df = df.sort_values('date').tail(days)
                    
                    all_data.append(df)
                    print(f"   ✓ {ticker}: {len(df)} days")
                else:
                    print(f"   ✗ {ticker}: No data")
                    
            except Exception as e:
                print(f"   ✗ {ticker}: {e}")
        
        # Rate limiting
        if i + BATCH_SIZE < total:
            time.sleep(DELAY)
    
    if all_data:
        combined = pd.concat(all_data, ignore_index=True)
        print(f"\n✅ Downloaded {len(combined)} total data points")
        print(f"   Unique stocks: {combined['symbol'].nunique()}")
        print(f"   Date range: {combined['date'].min()} to {combined['date'].max()}")
        return combined
    else:
        print("\n❌ No data downloaded")
        return pd.DataFrame()


def main():
    """Main execution"""
    
    print("=" * 70)
    print("📈 Historical Stock Data Downloader for ML")
    print("=" * 70)
    
    # Load tickers
    if not os.path.exists(TICKER_CSV):
        print(f"❌ Ticker file not found: {TICKER_CSV}")
        return
    
    stock_df = pd.read_csv(TICKER_CSV)
    
    # Find ticker column
    ticker_col = None
    for col in ['Symbol', 'symbol', 'Ticker', 'ticker', 'SYMBOL']:
        if col in stock_df.columns:
            ticker_col = col
            break
    
    if not ticker_col:
        print(f"❌ No ticker column found in {TICKER_CSV}")
        print(f"   Available columns: {stock_df.columns.tolist()}")
        return
    
    tickers = stock_df[ticker_col].dropna().astype(str).str.strip().unique().tolist()
    
    # Limit to reasonable number for API
    if len(tickers) > 500:
        print(f"⚠️  {len(tickers)} tickers found - limiting to first 500 for API efficiency")
        tickers = tickers[:500]
    
    print(f"📋 Processing {len(tickers)} tickers")
    
    # Download data
    df = download_historical(tickers)
    
    if df.empty:
        print("\n❌ Failed to download historical data")
        return
    
    # Ensure required columns
    required_cols = ['open', 'high', 'low', 'close', 'volume', 'date', 'symbol']
    for col in required_cols:
        if col not in df.columns:
            print(f"⚠️  Missing column '{col}', adding with NaN")
            df[col] = np.nan
    
    # Save to CSV
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False)
    
    print(f"\n✅ Saved historical data to: {OUTPUT_CSV}")
    print(f"   Total rows: {len(df):,}")
    print(f"   Total stocks: {df['symbol'].nunique()}")
    print(f"   File size: {os.path.getsize(OUTPUT_CSV) / 1024 / 1024:.2f} MB")
    
    print("\n🎯 Next step: Run the ML stock picks generator")
    print("   python python/generate_ml_stock_picks.py")


if __name__ == '__main__':
    main()
