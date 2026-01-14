#!/usr/bin/env python3
"""
Migrate Historical Stock Data from CSV to Supabase

This script:
1. Loads historical_stock_data.csv
2. Uploads data to Supabase historical_prices table in batches
3. Shows progress and handles errors gracefully

Usage:
    python migrate_historical_data.py

Environment Variables Required:
    SUPABASE_URL - Your Supabase project URL
    SUPABASE_SERVICE_KEY - Service role key (not anon key)
"""

import pandas as pd
import os
import sys
from typing import List, Dict
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Error: supabase package not installed")
    print("Run: pip install supabase")
    sys.exit(1)

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
CSV_PATH = '../data/historical_stock_data.csv'
BATCH_SIZE = 1000  # Rows per batch
TABLE_NAME = 'historical_prices'

def validate_env():
    """Validate required environment variables"""
    if not SUPABASE_URL:
        print("❌ Error: SUPABASE_URL environment variable not set")
        return False
    
    if not SUPABASE_SERVICE_KEY:
        print("❌ Error: SUPABASE_SERVICE_KEY environment variable not set")
        print("Note: Use service_role key, not anon key")
        return False
    
    return True

def load_csv() -> pd.DataFrame:
    """Load and validate CSV data"""
    print(f"📂 Loading CSV from {CSV_PATH}...")
    
    if not os.path.exists(CSV_PATH):
        print(f"❌ Error: CSV file not found: {CSV_PATH}")
        sys.exit(1)
    
    df = pd.read_csv(CSV_PATH)
    
    # Validate required columns
    required_cols = ['date', 'symbol', 'open', 'high', 'low', 'close', 'volume']
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    if missing_cols:
        print(f"❌ Error: Missing required columns: {missing_cols}")
        sys.exit(1)
    
    print(f"   ✅ Loaded {len(df):,} rows")
    print(f"   ✅ Found {df['symbol'].nunique()} unique symbols")
    print(f"   ✅ Date range: {df['date'].min()} to {df['date'].max()}")
    
    return df

def prepare_batch(batch_df: pd.DataFrame) -> List[Dict]:
    """Convert DataFrame batch to list of dicts for Supabase"""
    records = []
    
    for _, row in batch_df.iterrows():
        record = {
            'symbol': str(row['symbol']),
            'date': str(row['date']),
            'open': float(row['open']) if pd.notna(row['open']) else None,
            'high': float(row['high']) if pd.notna(row['high']) else None,
            'low': float(row['low']) if pd.notna(row['low']) else None,
            'close': float(row['close']) if pd.notna(row['close']) else None,
            'adjusted_close': float(row['adjusted_close']) if 'adjusted_close' in row and pd.notna(row['adjusted_close']) else None,
            'volume': int(row['volume']) if pd.notna(row['volume']) else None,
        }
        records.append(record)
    
    return records

def migrate_data(df: pd.DataFrame, supabase: Client):
    """Upload data to Supabase in batches"""
    total_rows = len(df)
    total_batches = (total_rows // BATCH_SIZE) + (1 if total_rows % BATCH_SIZE > 0 else 0)
    
    print(f"\n📤 Uploading {total_rows:,} rows in {total_batches} batches...")
    print(f"   Batch size: {BATCH_SIZE}")
    
    success_count = 0
    error_count = 0
    
    for i in range(0, total_rows, BATCH_SIZE):
        batch_num = (i // BATCH_SIZE) + 1
        batch_df = df.iloc[i:i+BATCH_SIZE]
        
        try:
            # Prepare records
            records = prepare_batch(batch_df)
            
            # Upsert to Supabase (insert or update on conflict)
            response = supabase.table(TABLE_NAME).upsert(
                records,
                on_conflict='symbol,date'
            ).execute()
            
            success_count += len(records)
            
            # Progress indicator
            progress = (batch_num / total_batches) * 100
            print(f"   [{batch_num}/{total_batches}] {progress:.1f}% - Uploaded {success_count:,} rows", end='\r')
            
        except Exception as e:
            error_count += len(batch_df)
            print(f"\n   ⚠️  Error in batch {batch_num}: {str(e)[:100]}")
            continue
    
    print(f"\n\n✅ Migration complete!")
    print(f"   Success: {success_count:,} rows")
    if error_count > 0:
        print(f"   Errors:  {error_count:,} rows")
    
    return success_count, error_count

def verify_migration(supabase: Client, expected_count: int):
    """Verify data was uploaded successfully"""
    print("\n🔍 Verifying migration...")
    
    try:
        # Count rows
        response = supabase.table(TABLE_NAME).select('id', count='exact').limit(1).execute()
        actual_count = response.count
        
        print(f"   Expected: {expected_count:,} rows")
        print(f"   Actual:   {actual_count:,} rows")
        
        if actual_count >= expected_count * 0.99:  # Allow 1% variance
            print("   ✅ Verification passed!")
        else:
            print("   ⚠️  Row count mismatch")
        
        # Sample a few records
        sample = supabase.table(TABLE_NAME).select('*').limit(3).execute()
        print(f"\n   Sample records:")
        for record in sample.data:
            print(f"     {record['symbol']} on {record['date']}: ${record['close']}")
        
    except Exception as e:
        print(f"   ⚠️  Verification error: {e}")

def main():
    """Main migration flow"""
    print("=" * 70)
    print("📊 Historical Stock Data Migration to Supabase")
    print("=" * 70)
    print()
    
    # Validate environment
    if not validate_env():
        sys.exit(1)
    
    # Connect to Supabase
    print("🔌 Connecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("   ✅ Connected successfully")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        sys.exit(1)
    
    # Load CSV
    df = load_csv()
    
    # Start migration automatically
    print(f"\n⚠️  About to upload {len(df):,} rows to Supabase")
    print("Starting migration in 2 seconds... (Ctrl+C to cancel)")
    
    import time
    time.sleep(2)
    
    # Start migration
    start_time = datetime.now()
    success_count, error_count = migrate_data(df, supabase)
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    # Verify
    verify_migration(supabase, success_count)
    
    # Summary
    print("\n" + "=" * 70)
    print("📈 Migration Summary")
    print("=" * 70)
    print(f"Duration:     {duration:.1f} seconds")
    print(f"Rows/second:  {success_count / duration:.0f}")
    print(f"Success rate: {(success_count / len(df) * 100):.1f}%")
    print()
    print("Next steps:")
    print("  1. Verify data in Supabase dashboard")
    print("  2. Update ML service to use Supabase")
    print("  3. Test predictions with database data")
    print("=" * 70)

if __name__ == "__main__":
    main()
