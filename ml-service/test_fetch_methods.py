#!/usr/bin/env python3
"""Direct test of fetch with different approaches"""

import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client
import pandas as pd
from datetime import datetime, timedelta

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_ANON_KEY')
)

async def test_fetch():
    print("Testing different fetch approaches for AAPL...")
    print()
    
    start_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
    
    # Test 1: Basic query with limit
    print("1. Query with .limit(10000):")
    response = supabase.table('historical_prices') \
        .select('*') \
        .eq('symbol', 'AAPL') \
        .gte('date', start_date) \
        .limit(10000) \
        .order('date') \
        .execute()
    
    print(f"   Rows: {len(response.data)}")
    
    # Test 2: Query with .in_() filter
    print("\n2. Query with .in_(['AAPL']) and limit:")
    response = supabase.table('historical_prices') \
        .select('*') \
        .in_('symbol', ['AAPL']) \
        .gte('date', start_date) \
        .limit(10000) \
        .order('date') \
        .execute()
    
    print(f"   Rows: {len(response.data)}")
    
    # Test 3: Check total count for AAPL
    print("\n3. Total AAPL rows (with count):")
    response = supabase.table('historical_prices') \
        .select('id', count='exact') \
        .eq('symbol', 'AAPL') \
        .gte('date', start_date) \
        .execute()
    
    print(f"   Total count: {response.count}")
    
    # Test 4: Paginated fetch
    print("\n4. Paginated fetch:")
    all_data = []
    page_size = 1000
    offset = 0
    
    while True:
        response = supabase.table('historical_prices') \
            .select('*') \
            .eq('symbol', 'AAPL') \
            .gte('date', start_date) \
            .range(offset, offset + page_size - 1) \
            .order('date') \
            .execute()
        
        if not response.data or len(response.data) == 0:
            break
        
        all_data.extend(response.data)
        offset += page_size
        
        if len(response.data) < page_size:
            break
    
    print(f"   Total rows fetched: {len(all_data)}")
    
    if all_data:
        df = pd.DataFrame(all_data)
        print(f"   Date range: {df['date'].min()} to {df['date'].max()}")

if __name__ == "__main__":
    asyncio.run(test_fetch())
