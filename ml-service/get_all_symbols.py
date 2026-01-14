#!/usr/bin/env python3
"""Get distinct symbols using SQL function"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')  # Use service key for RPC
)

print("Getting total count...")
response = supabase.table('historical_prices') \
    .select('id', count='exact') \
    .limit(1) \
    .execute()

print(f"Total rows in database: {response.count:,}")

print("\nGetting distinct symbols via SQL...")

# Execute raw SQL to get distinct symbols
try:
    # Try using RPC or execute SQL
    result = supabase.rpc('get_distinct_symbols').execute()
    print(f"Symbols: {result.data}")
except Exception as e:
    print(f"RPC failed: {e}")
    print("\nTrying alternative method...")
    
    # Alternative: Create a SQL function in Supabase first
    print("Please run this SQL in Supabase SQL Editor:")
    print("""
    CREATE OR REPLACE FUNCTION get_distinct_symbols()
    RETURNS TABLE(symbol TEXT) AS $$
    BEGIN
        RETURN QUERY SELECT DISTINCT hp.symbol FROM historical_prices hp ORDER BY hp.symbol;
    END;
    $$ LANGUAGE plpgsql;
    """)
    
# Simpler approach: use the view we created
print("\nTrying available_symbols view...")
try:
    response = supabase.table('available_symbols') \
        .select('symbol') \
        .execute()
    
    symbols = [row['symbol'] for row in response.data]
    print(f"Found {len(symbols)} unique symbols")
    print(f"Sample: {symbols[:20]}")
except Exception as e:
    print(f"View query failed: {e}")
    print("The view might not exist yet. Run the schema SQL first.")
