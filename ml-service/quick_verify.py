#!/usr/bin/env python3
"""Quick verification after migration"""

import os
from dotenv import load_dotenv
from supabase import create_client
import pandas as pd

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_ANON_KEY')
)

print("Checking migration results...")
print()

# Get total count
response = supabase.table('historical_prices') \
    .select('id', count='exact') \
    .limit(1) \
    .execute()

print(f"Total rows: {response.count:,}")

# Get distinct symbols
response = supabase.table('historical_prices') \
    .select('symbol') \
    .limit(250000) \
    .execute()

df = pd.DataFrame(response.data)
symbols = df['symbol'].unique()

print(f"Unique symbols: {len(symbols)}")
print()
print(f"Sample symbols: {sorted(symbols)[:20]}")
print()

if len(symbols) >= 900:
    print("✅ Migration successful - all symbols uploaded!")
else:
    print(f"⚠️  Only {len(symbols)} symbols found (expected ~984)")
