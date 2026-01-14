#!/usr/bin/env python3
"""Debug: Check what's really in Supabase"""

import os
from dotenv import load_dotenv
from supabase import create_client
import pandas as pd

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_ANON_KEY')
)

# Get all data
print("Fetching all data from Supabase...")
response = supabase.table('historical_prices') \
    .select('symbol, date') \
    .limit(250000) \
    .execute()

df = pd.DataFrame(response.data)

print(f"\nTotal rows: {len(df):,}")
print(f"Unique symbols: {df['symbol'].nunique()}")
print(f"\nSymbol breakdown:")
print(df['symbol'].value_counts())

print(f"\nUnique (symbol, date) combinations: {df.drop_duplicates(['symbol', 'date']).shape[0]:,}")

# Check if there are duplicates
duplicates = df[df.duplicated(['symbol', 'date'], keep=False)]
if len(duplicates) > 0:
    print(f"\n⚠️  Found {len(duplicates)} duplicate (symbol, date) rows!")
    print(duplicates.head(20))
