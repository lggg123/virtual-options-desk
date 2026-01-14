#!/usr/bin/env python3
"""Check what's in the CSV"""

import pandas as pd

print("Loading CSV...")
df = pd.read_csv('../data/historical_stock_data.csv')

print(f"\nCSV contains:")
print(f"  Total rows: {len(df):,}")
print(f"  Unique symbols: {df['symbol'].nunique()}")

print(f"\nAll symbols in CSV:")
symbols = sorted(df['symbol'].unique())
print(symbols)

print(f"\nRows per symbol (top 20):")
counts = df['symbol'].value_counts().head(20)
for sym, count in counts.items():
    print(f"  {sym}: {count} days")
