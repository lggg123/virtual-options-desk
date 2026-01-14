"""
Supabase data fetcher for ML service

Replaces CSV-based historical data loading with database queries
"""

import os
import pandas as pd
from typing import List, Optional
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("⚠️  Warning: Supabase credentials not configured")

async def fetch_historical_data(
    symbols: List[str], 
    days: int = 365,
    end_date: Optional[str] = None
) -> pd.DataFrame:
    """
    Fetch historical price data from Supabase
    
    Args:
        symbols: List of stock symbols to fetch
        days: Number of days of history to fetch
        end_date: Optional end date (YYYY-MM-DD), defaults to today
    
    Returns:
        DataFrame with columns: date, symbol, open, high, low, close, volume
    """
    
    if not supabase:
        raise ValueError("Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY")
    
    # Calculate date range
    if end_date:
        end = datetime.strptime(end_date, '%Y-%m-%d')
    else:
        end = datetime.now()
    
    start = end - timedelta(days=days)
    start_date = start.strftime('%Y-%m-%d')
    
    print(f"📊 Fetching data for {len(symbols)} symbols from {start_date}...")
    
    try:
        all_data = []
        
        # Fetch data in batches of symbols to avoid query size limits
        batch_size = 50
        for i in range(0, len(symbols), batch_size):
            symbol_batch = symbols[i:i+batch_size]
            
            # Use pagination to get all rows (limit doesn't work reliably)
            page_size = 1000
            offset = 0
            
            while True:
                response = supabase.table('historical_prices') \
                    .select('date, symbol, open, high, low, close, adjusted_close, volume') \
                    .in_('symbol', symbol_batch) \
                    .gte('date', start_date) \
                    .range(offset, offset + page_size - 1) \
                    .order('symbol') \
                    .order('date') \
                    .execute()
                
                if not response.data or len(response.data) == 0:
                    break
                
                all_data.extend(response.data)
                offset += page_size
                
                # Stop if we got less than page_size (last page)
                if len(response.data) < page_size:
                    break
        
        # Convert to DataFrame
        if all_data:
            df = pd.DataFrame(all_data)
            df['date'] = pd.to_datetime(df['date'])
            
            print(f"   ✅ Fetched {len(df):,} rows for {df['symbol'].nunique()} symbols")
            return df
        else:
            print("   ⚠️  No data found")
            return pd.DataFrame()
        
    except Exception as e:
        print(f"   ❌ Error fetching data: {e}")
        import traceback
        traceback.print_exc()
        raise

async def fetch_latest_prices(symbols: List[str]) -> pd.DataFrame:
    """
    Fetch only the latest price for each symbol
    
    Args:
        symbols: List of stock symbols
    
    Returns:
        DataFrame with latest price for each symbol
    """
    
    if not supabase:
        raise ValueError("Supabase not configured")
    
    try:
        response = supabase.table('latest_prices') \
            .select('*') \
            .in_('symbol', symbols) \
            .execute()
        
        if response.data:
            return pd.DataFrame(response.data)
        else:
            return pd.DataFrame()
        
    except Exception as e:
        print(f"❌ Error fetching latest prices: {e}")
        raise

def get_available_symbols() -> List[str]:
    """
    Get list of all symbols in the database
    
    Returns:
        List of unique stock symbols
    """
    
    if not supabase:
        raise ValueError("Supabase not configured")
    
    try:
        # Use the available_symbols view for efficiency
        response = supabase.table('available_symbols') \
            .select('symbol') \
            .execute()
        
        if response.data:
            symbols = [row['symbol'] for row in response.data]
            return sorted(symbols)
        else:
            return []
        
    except Exception as e:
        print(f"❌ Error fetching symbols from view: {e}")
        # Fallback: query with high limit and deduplicate
        try:
            import pandas as pd
            # Fetch many rows to get all symbols
            response = supabase.table('historical_prices') \
                .select('symbol') \
                .limit(250000) \
                .execute()
            
            if response.data:
                df = pd.DataFrame(response.data)
                symbols = df['symbol'].unique().tolist()
                return sorted(symbols)
        except Exception as e2:
            print(f"❌ Fallback also failed: {e2}")
        
        return []

def get_data_summary() -> dict:
    """
    Get summary statistics about historical data
    
    Returns:
        Dict with statistics (total rows, symbols, date range, etc.)
    """
    
    if not supabase:
        return {"error": "Supabase not configured"}
    
    try:
        # Get count
        count_response = supabase.table('historical_prices') \
            .select('id', count='exact') \
            .limit(1) \
            .execute()
        
        # Get unique symbols count and date range
        stats_response = supabase.rpc('get_data_stats').execute()
        
        return {
            "total_rows": count_response.count,
            "status": "connected"
        }
        
    except Exception as e:
        return {"error": str(e)}
