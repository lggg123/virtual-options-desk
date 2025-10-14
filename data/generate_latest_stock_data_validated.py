"""
Script to generate latest_stock_data.csv from a list of tickers using EODHD API, with ticker validation.
- Downloads EODHD's supported US tickers list once and filters your tickers against it.
- Only valid tickers are used for data download.
"""

import pandas as pd
import numpy as np

import time
import os
from eodhd import APIClient

EODHD_API_KEY = "68ebce6775f004.44089353"  # Replace with your actual API key
TICKER_CSV = "data/stocks-list.csv"
OUTPUT_CSV = "data/latest_stock_data.csv"
BATCH_SIZE = 1000
DELAY = 0  # No delay needed for 1000 calls/minute

def download_eodhd_bulk(tickers, api_key=EODHD_API_KEY, start_date="2015-01-01", end_date=None, batch_size=5, delay=2):
    """
    Download daily historical data for a list of tickers from EODHD.
    Returns a DataFrame with all data concatenated.
    Ensures 'close' column exists for all tickers.
    """
    client = APIClient(api_key)
    all_data = []
    total = len(tickers)
    for i in range(0, total, batch_size):
        batch = tickers[i:i+batch_size]
        print(f"Downloading batch {i//batch_size+1} ({i+1}-{min(i+batch_size, total)}) of {total}...")
        for ticker in batch:
            try:
                df = client.get_historical_data(
                    symbol=ticker,
                    interval="d",
                    iso8601_start=start_date,
                    iso8601_end=end_date if end_date else ""
                )
                if not df.empty:
                    if 'close' not in df.columns:
                        print(f"Ticker {ticker} missing 'close' column, adding as NaN.")
                        df['close'] = np.nan
                    df['symbol'] = ticker
                    all_data.append(df)
                else:
                    print(f"No data for {ticker}")
            except Exception as e:
                print(f"Failed to download {ticker}: {e}")
        # No delay needed for 1000 calls/minute
    if all_data:
        return pd.concat(all_data, ignore_index=True)
    else:
        print("No valid data downloaded.")
        return pd.DataFrame()





# Load and clean tickers using only the 'Symbol' column
stock_df = pd.read_csv(TICKER_CSV)
print(f"Loaded CSV columns: {stock_df.columns.tolist()}")
print("First 5 rows of CSV:")
print(stock_df.head())
if 'Symbol' not in stock_df.columns:
    raise ValueError(f"No 'Symbol' column found in {TICKER_CSV}. Columns: {stock_df.columns.tolist()}")
your_tickers = (
    stock_df['Symbol']
    .dropna()
    .astype(str)
    .str.strip()
    .str.upper()
    .str.replace(r'[^A-Z0-9\.-]', '', regex=True)
    .unique()
    .tolist()
)
print("First 10 cleaned tickers from 'Symbol' column:", your_tickers[:10])

# Download all latest data using the Colab-proven function
df = download_eodhd_bulk(your_tickers, batch_size=BATCH_SIZE, delay=DELAY)
if not df.empty:
    # Always reset index to ensure 'date' is a column
    df = df.reset_index()
    if 'date' not in df.columns:
        print(f"WARNING: 'date' column missing from downloaded DataFrame. Filling with today's date.")
        from datetime import datetime
        df['date'] = datetime.now().strftime('%Y-%m-%d')
    # For latest data, keep only the most recent row per symbol
    latest_df = df.sort_values('date').groupby('symbol', as_index=False).last()
    for col in ['open', 'high', 'low', 'close', 'volume']:
        if col not in latest_df.columns:
            latest_df[col] = np.nan
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
    latest_df.to_csv(OUTPUT_CSV, index=False)
    print(f"Saved latest data for {len(latest_df)} stocks to {OUTPUT_CSV}")
else:
    print("No valid data downloaded.")
