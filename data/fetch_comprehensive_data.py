#!/usr/bin/env python3
"""
Fetch comprehensive historical data for top stocks

Uses yfinance to download 1 year of data for major stocks
"""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from tqdm import tqdm

# Top 100 most traded US stocks
SYMBOLS = [
    # Tech giants
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'NFLX', 'INTC',
    # Finance
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'USB',
    # Healthcare
    'UNH', 'JNJ', 'PFE', 'ABBV', 'TMO', 'MRK', 'ABT', 'DHR', 'LLY', 'BMY',
    # Consumer
    'WMT', 'HD', 'MCD', 'NKE', 'SBUX', 'TGT', 'LOW', 'TJX', 'DG', 'COST',
    # Energy
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PXD', 'MPC', 'VLO', 'PSX', 'OXY',
    # Industrials
    'BA', 'CAT', 'GE', 'HON', 'UNP', 'UPS', 'LMT', 'RTX', 'DE', 'MMM',
    # Communications
    'DIS', 'CMCSA', 'VZ', 'T', 'TMUS', 'CHTR', 'NXST', 'PARA', 'WBD', 'FOXA',
    # Other major stocks
    'V', 'MA', 'PYPL', 'SQ', 'COIN', 'SHOP', 'UBER', 'ABNB', 'DASH', 'SNOW',
    'CRM', 'ORCL', 'ADBE', 'CSCO', 'AVGO', 'QCOM', 'TXN', 'NOW', 'PLTR', 'CRWD',
    # SPY ETF and others
    'SPY', 'QQQ', 'IWM', 'DIA'
]

def fetch_historical_data(symbols, period='1y'):
    """Fetch historical data for multiple symbols"""
    
    all_data = []
    errors = []
    
    print(f"Fetching {period} of data for {len(symbols)} symbols...")
    print()
    
    for symbol in tqdm(symbols):
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            
            if hist.empty:
                errors.append(f"{symbol}: No data")
                continue
            
            # Reset index to get date as column
            hist = hist.reset_index()
            
            # Rename columns to match our schema
            hist = hist.rename(columns={
                'Date': 'date',
                'Open': 'open',
                'High': 'high',
                'Low': 'low',
                'Close': 'close',
                'Volume': 'volume'
            })
            
            # Add symbol and adjusted_close
            hist['symbol'] = symbol
            hist['adjusted_close'] = hist['close']  # yfinance already returns adjusted
            hist['interval'] = 'd'
            
            # Select only needed columns
            hist = hist[['date', 'symbol', 'interval', 'open', 'high', 'low', 'close', 'adjusted_close', 'volume']]
            
            all_data.append(hist)
            
        except Exception as e:
            errors.append(f"{symbol}: {str(e)}")
    
    # Combine all data
    if all_data:
        df = pd.concat(all_data, ignore_index=True)
        df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
        
        return df, errors
    else:
        return pd.DataFrame(), errors

def main():
    print("=" * 70)
    print("📥 Historical Data Fetcher")
    print("=" * 70)
    print()
    
    # Fetch data
    df, errors = fetch_historical_data(SYMBOLS, period='1y')
    
    if df.empty:
        print("❌ No data fetched!")
        return
    
    # Save to CSV
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(script_dir, 'historical_stock_data.csv')
    df.to_csv(output_file, index=False)
    
    print()
    print("=" * 70)
    print("✅ Data Fetched Successfully!")
    print("=" * 70)
    print(f"Total rows: {len(df):,}")
    print(f"Symbols: {df['symbol'].nunique()}")
    print(f"Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"Saved to: {output_file}")
    
    if errors:
        print(f"\n⚠️  Errors ({len(errors)}):")
        for error in errors[:10]:
            print(f"  {error}")
    
    print()
    print("Next steps:")
    print("  1. Run migration: cd ml-service && python migrate_historical_data.py")
    print("  2. Retrain models: ./train-models.sh")
    print("  3. Deploy to Railway")

if __name__ == "__main__":
    main()
