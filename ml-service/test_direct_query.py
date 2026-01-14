#!/usr/bin/env python3
"""Direct test of Supabase query with explicit limit"""

import os
from dotenv import load_dotenv
from supabase import create_client
import pandas as pd

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_ANON_KEY')
)

print("Testing direct Supabase query...")
print()

# Test 1: Query AAPL with NO limit
print("1. Query AAPL with no limit (default):")
response = supabase.table('historical_prices') \
    .select('*') \
    .eq('symbol', 'AAPL') \
    .order('date') \
    .execute()

print(f"   Rows returned: {len(response.data) if response.data else 0}")

# Test 2: Query AAPL with high limit
print("\n2. Query AAPL with limit(10000):")
response = supabase.table('historical_prices') \
    .select('*') \
    .eq('symbol', 'AAPL') \
    .limit(10000) \
    .order('date') \
    .execute()

print(f"   Rows returned: {len(response.data) if response.data else 0}")

if response.data:
    df = pd.DataFrame(response.data)
    print(f"   Date range: {df['date'].min()} to {df['date'].max()}")

# Test 3: Count total AAPL rows
print("\n3. Count total AAPL rows:")
response = supabase.table('historical_prices') \
    .select('id', count='exact') \
    .eq('symbol', 'AAPL') \
    .execute()

print(f"   Total count: {response.count}")

# Test 4: Get all symbols
print("\n4. Get distinct symbols:")
response = supabase.table('historical_prices') \
    .select('symbol') \
    .limit(250000) \
    .execute()

if response.data:
    df = pd.DataFrame(response.data)
    symbols = df['symbol'].unique()
    print(f"   Unique symbols: {len(symbols)}")
    print(f"   Symbols: {sorted(symbols)}")
