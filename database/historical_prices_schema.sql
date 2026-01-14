-- ============================================
-- Historical Stock Data Migration Schema
-- ============================================

-- Historical stock prices table
CREATE TABLE IF NOT EXISTS historical_prices (
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
  
  -- Ensure no duplicate symbol-date combinations
  CONSTRAINT unique_symbol_date UNIQUE(symbol, date)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_historical_prices_symbol 
  ON historical_prices(symbol);

CREATE INDEX IF NOT EXISTS idx_historical_prices_date 
  ON historical_prices(date DESC);

CREATE INDEX IF NOT EXISTS idx_historical_prices_symbol_date 
  ON historical_prices(symbol, date DESC);

-- Enable Row Level Security
ALTER TABLE historical_prices ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
DROP POLICY IF EXISTS "Allow public read access" ON historical_prices;
CREATE POLICY "Allow public read access" ON historical_prices
  FOR SELECT USING (true);

-- Policy: Allow service role to insert/update
DROP POLICY IF EXISTS "Allow service role write access" ON historical_prices;
CREATE POLICY "Allow service role write access" ON historical_prices
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- Pre-calculated Features Table (Optional)
-- ============================================

CREATE TABLE IF NOT EXISTS stock_features (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  calculated_at DATE NOT NULL,
  
  -- Technical indicators
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
  data_quality_score DECIMAL(4, 2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_symbol_calculated_date UNIQUE(symbol, calculated_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_features_symbol 
  ON stock_features(symbol);

CREATE INDEX IF NOT EXISTS idx_stock_features_date 
  ON stock_features(calculated_at DESC);

-- Enable RLS
ALTER TABLE stock_features ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public read features" ON stock_features;
CREATE POLICY "Allow public read features" ON stock_features
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role write features" ON stock_features;
CREATE POLICY "Allow service role write features" ON stock_features
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- Views for Common Queries
-- ============================================

-- Latest prices for each symbol
CREATE OR REPLACE VIEW latest_prices AS
SELECT DISTINCT ON (symbol)
  symbol,
  date,
  open,
  high,
  low,
  close,
  adjusted_close,
  volume
FROM historical_prices
ORDER BY symbol, date DESC;

-- All unique symbols
CREATE OR REPLACE VIEW available_symbols AS
SELECT DISTINCT symbol
FROM historical_prices
ORDER BY symbol;

-- Grant access to views
GRANT SELECT ON latest_prices TO anon, authenticated;
GRANT SELECT ON available_symbols TO anon, authenticated;

COMMENT ON TABLE historical_prices IS 'Historical daily stock price data for ML training and predictions';
COMMENT ON TABLE stock_features IS 'Pre-calculated technical indicators and features for faster ML inference';
COMMENT ON VIEW latest_prices IS 'Most recent price data for each symbol';
COMMENT ON VIEW available_symbols IS 'List of all unique stock symbols in the database';
