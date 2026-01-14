#!/usr/bin/env python3
"""Check CSV vs Database data"""

import pandas as pd

print("Checking CSV file...")
df = pd.read_csv('../data/historical_stock_data.csv')

print(f"\nCSV Summary:")
print(f"  Total rows: {len(df):,}")
print(f"  Unique symbols: {df['symbol'].nunique()}")
print(f"  Date range: {df['date'].min()} to {df['date'].max()}")

print(f"\nSymbol counts (top 20):")
symbol_counts = df['symbol'].value_counts().head(20)
for symbol, count in symbol_counts.items():
    print(f"  {symbol}: {count} days")

print(f"\nAAPL data:")
aapl = df[df['symbol'] == 'AAPL']
print(f"  Rows: {len(aapl)}")
if len(aapl) > 0:
    print(f"  Date range: {aapl['date'].min()} to {aapl['date'].max()}")
    print(f"  Sample dates: {list(aapl['date'].head(10))}")
