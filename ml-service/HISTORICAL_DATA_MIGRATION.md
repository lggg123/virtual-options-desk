# Historical Data Migration Plan

## Current Problem
- Using CSV for historical stock data (227K+ rows)
- Not scalable for multiple years of data
- Deployment challenges with large files
- No real-time updates

## Solution: Supabase Historical Data Table

### Architecture

```
┌─────────────────┐
│   Frontend      │
│  ML Screening   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  ML Service     │◄────►│   Supabase DB    │
│  Railway        │      │  historical_prices│
└─────────────────┘      └──────────────────┘
         │                        ▲
         │                        │
         ▼                        │
┌─────────────────┐              │
│  Feature Cache  │──────────────┘
│  (computed)     │
└─────────────────┘
```

### Phase 1: Database Schema (IMMEDIATE)

Create Supabase table for historical prices:

```sql
-- Historical stock prices table
CREATE TABLE historical_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  open DECIMAL(12, 4),
  high DECIMAL(12, 4),
  low DECIMAL(12, 4),
  close DECIMAL(12, 4),
  adjusted_close DECIMAL(12, 4),
  volume BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Composite unique constraint
  UNIQUE(symbol, date)
);

-- Index for fast symbol lookups
CREATE INDEX idx_historical_prices_symbol ON historical_prices(symbol);
CREATE INDEX idx_historical_prices_date ON historical_prices(date DESC);
CREATE INDEX idx_historical_prices_symbol_date ON historical_prices(symbol, date DESC);

-- Enable RLS (optional, for security)
ALTER TABLE historical_prices ENABLE ROW LEVEL SECURITY;

-- Policy to allow read access
CREATE POLICY "Allow public read access" ON historical_prices
  FOR SELECT USING (true);
```

### Phase 2: Calculated Features Table (OPTIMIZATION)

Pre-calculate technical indicators to avoid computation on every request:

```sql
-- Pre-calculated technical indicators
CREATE TABLE stock_features (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  calculated_at DATE NOT NULL,
  
  -- Technical indicators (from last N days)
  rsi_14 DECIMAL(8, 4),
  sma_20 DECIMAL(12, 4),
  sma_50 DECIMAL(12, 4),
  sma_200 DECIMAL(12, 4),
  volatility_20d DECIMAL(8, 4),
  volatility_60d DECIMAL(8, 4),
  momentum_20d DECIMAL(8, 4),
  momentum_60d DECIMAL(8, 4),
  macd DECIMAL(8, 4),
  bb_width DECIMAL(8, 4),
  volume_ratio DECIMAL(8, 4),
  
  -- Fundamental metrics
  market_cap_proxy DECIMAL(20, 2),
  price_52w_high DECIMAL(12, 4),
  price_52w_low DECIMAL(12, 4),
  price_from_52w_high DECIMAL(8, 4),
  
  -- Market factors
  relative_strength DECIMAL(8, 4),
  avg_volume BIGINT,
  
  -- Metadata
  data_quality_score DECIMAL(4, 2), -- 0-100
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(symbol, calculated_at)
);

CREATE INDEX idx_stock_features_symbol ON stock_features(symbol);
CREATE INDEX idx_stock_features_date ON stock_features(calculated_at DESC);
```

### Phase 3: Data Migration Script

Create a Python script to migrate CSV → Supabase:

```python
# ml-service/migrate_historical_data.py

import pandas as pd
from supabase import create_client
import os
from tqdm import tqdm

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

def migrate_csv_to_supabase():
    # Load CSV
    print("📂 Loading CSV...")
    df = pd.read_csv('../data/historical_stock_data.csv')
    
    # Connect to Supabase
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Batch insert (1000 rows at a time)
    BATCH_SIZE = 1000
    total_batches = len(df) // BATCH_SIZE + 1
    
    print(f"📤 Uploading {len(df)} rows in {total_batches} batches...")
    
    for i in tqdm(range(0, len(df), BATCH_SIZE)):
        batch = df.iloc[i:i+BATCH_SIZE]
        records = batch.to_dict('records')
        
        try:
            supabase.table('historical_prices').upsert(
                records,
                on_conflict='symbol,date'
            ).execute()
        except Exception as e:
            print(f"❌ Error in batch {i//BATCH_SIZE}: {e}")
    
    print("✅ Migration complete!")

if __name__ == "__main__":
    migrate_csv_to_supabase()
```

### Phase 4: Update ML API to Use Supabase

Modify `ml_api.py` to fetch from database:

```python
# Add to ml_api.py
from supabase import create_client
import os

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

async def fetch_historical_data(symbols: List[str], days: int = 365):
    """Fetch historical data from Supabase"""
    from datetime import datetime, timedelta
    
    start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    # Fetch data for all symbols
    response = supabase.table('historical_prices') \
        .select('*') \
        .in_('symbol', symbols) \
        .gte('date', start_date) \
        .order('date', desc=False) \
        .execute()
    
    # Convert to DataFrame
    df = pd.DataFrame(response.data)
    return df
```

### Phase 5: Feature Calculation Service (OPTIONAL)

Create a background job that pre-calculates features:

```python
# ml-service/feature_calculator.py

"""
Daily cron job to calculate features for all stocks
Runs at market close (4:30 PM ET)
"""

async def calculate_daily_features():
    # Get all unique symbols
    symbols = await get_all_symbols()
    
    for symbol in symbols:
        # Fetch last 365 days
        df = await fetch_historical_data([symbol], days=365)
        
        if len(df) < 60:
            continue
        
        # Calculate features
        features = calculate_all_features(df)
        
        # Store in stock_features table
        await store_features(symbol, features)
```

## Implementation Timeline

### Week 1: Database Setup
- [ ] Create `historical_prices` table in Supabase
- [ ] Run migration script to upload CSV data
- [ ] Verify data integrity

### Week 2: API Integration
- [ ] Update `ml_api.py` to fetch from Supabase
- [ ] Add caching layer (Redis or in-memory)
- [ ] Test predictions with database data
- [ ] Deploy to Railway

### Week 3: Feature Pre-calculation
- [ ] Create `stock_features` table
- [ ] Build feature calculation pipeline
- [ ] Set up daily cron job
- [ ] Update prediction endpoint to use pre-calculated features

### Week 4: Data Expansion
- [ ] Fetch 3-5 years of historical data (vs current 1 year)
- [ ] Retrain models with extended data
- [ ] Monitor performance improvements

## Benefits

✅ **Scalability**: Store unlimited years of data  
✅ **Real-time**: Add new data daily via API  
✅ **Fast**: Pre-calculated features = instant predictions  
✅ **Deployment**: No large files in git  
✅ **Query Power**: Filter by date range, symbol, etc.  
✅ **Data Quality**: Validation, deduplication, integrity checks  

## Cost Considerations

**Supabase Storage:**
- 1M rows ≈ 500MB
- 5 years × 500 stocks × 1260 days = 3.15M rows ≈ 1.5GB
- Falls within Supabase free tier (500MB) to Pro tier ($25/mo for 8GB)

**Alternative: TimescaleDB**
- Better for time-series data
- Can self-host or use Timescale Cloud

## Next Steps

1. Create the Supabase tables (copy SQL above)
2. Run migration script to upload CSV data
3. Update ML service environment variables
4. Test the new database-backed predictions
5. Remove CSV dependency

Would you like me to start with Phase 1 (create the SQL schema)?
