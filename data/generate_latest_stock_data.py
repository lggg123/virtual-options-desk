"""
Script to generate latest_stock_data.csv from a list of tickers using EODHD API.
- Reads tickers from data/stocks-list.csv
- Downloads the most recent price data for each ticker
- Writes one row per ticker to data/latest_stock_data.csv
"""

import pandas as pd
import numpy as np
import time
import os
from eodhd import APIClient

EODHD_API_KEY = "68ebce6775f004.44089353"  # Replace with your actual API key
TICKER_CSV = "data/stocks-list.csv"
OUTPUT_CSV = "data/latest_stock_data.csv"
BATCH_SIZE = 5
DELAY = 2  # seconds between batches

# Load tickers
stock_df = pd.read_csv(TICKER_CSV)
ticker_col = next((col for col in ['symbol', 'ticker', 'Ticker', 'SYMBOL', 'Symbol'] if col in stock_df.columns), None)
if not ticker_col:
    raise ValueError(f"No ticker column found in {TICKER_CSV}. Columns: {stock_df.columns.tolist()}")
tickers = stock_df[ticker_col].dropna().unique().tolist()

client = APIClient(EODHD_API_KEY)
latest_rows = []

total = len(tickers)
for i in range(0, total, BATCH_SIZE):
    batch = tickers[i:i+BATCH_SIZE]
    print(f"Processing batch {i//BATCH_SIZE+1} ({i+1}-{min(i+BATCH_SIZE, total)}) of {total}...")
    for ticker in batch:
        try:
            df = client.get_historical_data(symbol=ticker, interval="d", iso8601_start=None, iso8601_end=None)
            if df is None or not hasattr(df, 'empty') or df.empty:
                print(f"No data for {ticker}")
                continue
            df['symbol'] = ticker
            # Get the most recent row (by date)
            latest = df.sort_values('date', ascending=False).iloc[0]
            latest_rows.append(latest)
        except Exception as e:
            print(f"Failed to download {ticker}: {e}")
    if i + BATCH_SIZE < total:
        print(f"Sleeping for {DELAY} seconds to avoid API rate limits...")
        time.sleep(DELAY)

if latest_rows:
    latest_df = pd.DataFrame(latest_rows)
    # Ensure required columns
    for col in ['open', 'high', 'low', 'close', 'volume']:
        if col not in latest_df.columns:
            latest_df[col] = np.nan
    # Save to CSV
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
    latest_df.to_csv(OUTPUT_CSV, index=False)
    print(f"Saved latest data for {len(latest_df)} stocks to {OUTPUT_CSV}")
else:
    print("No valid data downloaded.")
