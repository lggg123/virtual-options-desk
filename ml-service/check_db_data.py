#!/usr/bin/env python3
"""Check what's actually in the database"""

import asyncio
from dotenv import load_dotenv
from supabase import create_client
import os

load_dotenv()

async def check_data():
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_ANON_KEY')
    )
    
    print("Checking database contents...")
    print()
    
    # Get symbol counts
    response = supabase.table('historical_prices') \
        .select('symbol') \
        .execute()
    
    import pandas as pd
    df = pd.DataFrame(response.data)
    symbol_counts = df['symbol'].value_counts()
    
    print(f"Total rows: {len(df)}")
    print(f"Unique symbols: {len(symbol_counts)}")
    print()
    print("Rows per symbol:")
    print(symbol_counts)
    print()
    
    # Check AAPL specifically
    aapl_response = supabase.table('historical_prices') \
        .select('*') \
        .eq('symbol', 'AAPL') \
        .order('date') \
        .execute()
    
    if aapl_response.data:
        aapl_df = pd.DataFrame(aapl_response.data)
        print(f"AAPL data:")
        print(f"  Rows: {len(aapl_df)}")
        print(f"  Date range: {aapl_df['date'].min()} to {aapl_df['date'].max()}")
        print(f"  Sample:")
        print(aapl_df[['date', 'symbol', 'close']].head(10))

if __name__ == "__main__":
    asyncio.run(check_data())
