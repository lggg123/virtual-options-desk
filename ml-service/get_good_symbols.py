#!/usr/bin/env python3
"""Get list of symbols with sufficient data for ML"""

import os
from dotenv import load_dotenv
from supabase import create_client
import pandas as pd

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_ANON_KEY')
)

# Get all symbols with row counts
print("Getting symbols with row counts...")
response = supabase.table('historical_prices') \
    .select('symbol') \
    .limit(250000) \
    .execute()

df = pd.DataFrame(response.data)
symbol_counts = df['symbol'].value_counts()

# Filter symbols with 200+ days (good for ML)
good_symbols = symbol_counts[symbol_counts >= 200].index.tolist()

print(f"\nSymbols with 200+ days of data: {len(good_symbols)}")
print(f"\nTop 50 symbols by data count:")
for i, (symbol, count) in enumerate(symbol_counts.head(50).items()):
    print(f"{i+1:2}. {symbol:6} - {count} days")

print(f"\n\nFirst 100 good symbols for frontend:")
print(good_symbols[:100])
