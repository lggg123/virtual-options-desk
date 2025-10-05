-- Virtual Options Desk - Supabase Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== MONTHLY SCREENS ====================

CREATE TABLE monthly_screens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    universe_size INTEGER NOT NULL,
    picks_generated INTEGER NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_monthly_screens_run_date ON monthly_screens(run_date DESC);

-- ==================== STOCK PICKS ====================

CREATE TABLE stock_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screen_id UUID REFERENCES monthly_screens(id) ON DELETE CASCADE,
    
    -- Stock info
    symbol VARCHAR(10) NOT NULL,
    company_name VARCHAR(200),
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap NUMERIC,
    
    -- Scores & Rankings
    ai_score NUMERIC NOT NULL,
    rank INTEGER NOT NULL,
    confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),
    risk_score NUMERIC CHECK (risk_score BETWEEN 0 AND 100),
    predicted_return NUMERIC,
    
    -- Categorization
    category VARCHAR(50),
    
    -- Model breakdowns
    xgboost_score NUMERIC,
    random_forest_score NUMERIC,
    lightgbm_score NUMERIC,
    lstm_score NUMERIC,
    
    -- Factor scores
    factor_scores JSONB DEFAULT '{}',
    
    -- Performance tracking
    actual_return_1w NUMERIC,
    actual_return_1m NUMERIC,
    actual_return_3m NUMERIC,
    is_winner BOOLEAN,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_picks_symbol ON stock_picks(symbol);
CREATE INDEX idx_stock_picks_screen_id ON stock_picks(screen_id);
CREATE INDEX idx_stock_picks_rank ON stock_picks(rank);
CREATE INDEX idx_stock_picks_category ON stock_picks(category);
CREATE INDEX idx_stock_picks_symbol_screen ON stock_picks(symbol, screen_id);

-- ==================== STOCK FACTORS ====================

CREATE TABLE stock_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pick_id UUID REFERENCES stock_picks(id) ON DELETE CASCADE,
    
    -- Fundamental factors
    pe_ratio NUMERIC,
    pb_ratio NUMERIC,
    ps_ratio NUMERIC,
    ev_ebitda NUMERIC,
    peg_ratio NUMERIC,
    roe NUMERIC,
    roa NUMERIC,
    roic NUMERIC,
    revenue_growth_yoy NUMERIC,
    earnings_growth_yoy NUMERIC,
    debt_to_equity NUMERIC,
    current_ratio NUMERIC,
    
    -- Technical factors
    rsi_14 NUMERIC,
    macd NUMERIC,
    adx NUMERIC,
    price_vs_sma50 NUMERIC,
    price_vs_sma200 NUMERIC,
    atr_ratio NUMERIC,
    volume_ratio NUMERIC,
    return_20d NUMERIC,
    
    -- Sentiment factors
    news_sentiment NUMERIC,
    analyst_rating NUMERIC,
    put_call_ratio NUMERIC,
    short_interest_ratio NUMERIC,
    
    -- Market factors
    beta NUMERIC,
    market_cap_category INTEGER,
    sector_momentum NUMERIC,
    
    -- All factors (flexible storage)
    all_factors JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_factors_pick_id ON stock_factors(pick_id);

-- ==================== PERFORMANCE TRACKING ====================

CREATE TABLE performance_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screen_id UUID REFERENCES monthly_screens(id) ON DELETE CASCADE,
    
    -- Aggregate metrics
    avg_return_1m NUMERIC,
    avg_return_3m NUMERIC,
    win_rate NUMERIC,
    sharpe_ratio NUMERIC,
    max_drawdown NUMERIC,
    
    -- By category
    growth_return NUMERIC,
    value_return NUMERIC,
    momentum_return NUMERIC,
    quality_return NUMERIC,
    
    -- Model accuracy
    model_rmse NUMERIC,
    model_mae NUMERIC,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_performance_tracking_screen_id ON performance_tracking(screen_id);

-- ==================== CANDLESTICK PATTERNS ====================

CREATE TABLE candlestick_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    
    -- Pattern details
    confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),
    direction VARCHAR(10) CHECK (direction IN ('bullish', 'bearish', 'neutral')),
    strength INTEGER CHECK (strength BETWEEN 1 AND 5),
    
    -- Context
    price_at_detection NUMERIC,
    volume_at_detection NUMERIC,
    rsi_at_detection NUMERIC,
    
    -- Outcomes (updated later)
    price_change_1h NUMERIC,
    price_change_1d NUMERIC,
    pattern_success BOOLEAN,
    
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_candlestick_patterns_symbol ON candlestick_patterns(symbol);
CREATE INDEX idx_candlestick_patterns_detected_at ON candlestick_patterns(detected_at DESC);
CREATE INDEX idx_candlestick_patterns_type ON candlestick_patterns(pattern_type);
CREATE INDEX idx_candlestick_patterns_symbol_time ON candlestick_patterns(symbol, detected_at DESC);

-- ==================== FUNCTIONS & TRIGGERS ====================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_monthly_screens_updated_at
    BEFORE UPDATE ON monthly_screens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_picks_updated_at
    BEFORE UPDATE ON stock_picks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE monthly_screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE candlestick_patterns ENABLE ROW LEVEL SECURITY;

-- Public read access (adjust for production)
CREATE POLICY "Public read access for monthly_screens"
    ON monthly_screens FOR SELECT
    USING (true);

CREATE POLICY "Public read access for stock_picks"
    ON stock_picks FOR SELECT
    USING (true);

CREATE POLICY "Public read access for stock_factors"
    ON stock_factors FOR SELECT
    USING (true);

CREATE POLICY "Public read access for performance_tracking"
    ON performance_tracking FOR SELECT
    USING (true);

CREATE POLICY "Public read access for candlestick_patterns"
    ON candlestick_patterns FOR SELECT
    USING (true);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access on monthly_screens"
    ON monthly_screens FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on stock_picks"
    ON stock_picks FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on stock_factors"
    ON stock_factors FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on performance_tracking"
    ON performance_tracking FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on candlestick_patterns"
    ON candlestick_patterns FOR ALL
    USING (auth.role() = 'service_role');

-- ==================== VIEWS FOR COMMON QUERIES ====================

-- Latest screen with top picks
CREATE OR REPLACE VIEW latest_screen_summary AS
SELECT 
    ms.id,
    ms.run_date,
    ms.universe_size,
    ms.picks_generated,
    ms.model_version,
    COUNT(CASE WHEN sp.category = 'growth' THEN 1 END) as growth_count,
    COUNT(CASE WHEN sp.category = 'value' THEN 1 END) as value_count,
    COUNT(CASE WHEN sp.category = 'momentum' THEN 1 END) as momentum_count,
    COUNT(CASE WHEN sp.category = 'quality' THEN 1 END) as quality_count
FROM monthly_screens ms
LEFT JOIN stock_picks sp ON ms.id = sp.screen_id
WHERE ms.run_date = (SELECT MAX(run_date) FROM monthly_screens)
GROUP BY ms.id, ms.run_date, ms.universe_size, ms.picks_generated, ms.model_version;

-- Top picks with all details
CREATE OR REPLACE VIEW top_picks_detailed AS
SELECT 
    sp.symbol,
    sp.company_name,
    sp.rank,
    sp.ai_score,
    sp.confidence,
    sp.risk_score,
    sp.predicted_return,
    sp.category,
    sp.xgboost_score,
    sp.random_forest_score,
    sp.lightgbm_score,
    sp.lstm_score,
    sp.factor_scores,
    sp.actual_return_1m,
    ms.run_date as screen_date
FROM stock_picks sp
JOIN monthly_screens ms ON sp.screen_id = ms.id
WHERE ms.run_date = (SELECT MAX(run_date) FROM monthly_screens)
ORDER BY sp.rank;

-- ==================== SAMPLE DATA (Optional) ====================

-- Insert sample monthly screen
-- INSERT INTO monthly_screens (universe_size, picks_generated, model_version, metadata)
-- VALUES (5000, 1000, '1.0.0', '{"training_date": "2025-10-01", "cv_score": 0.82}');

-- ==================== USEFUL QUERIES ====================

-- Get latest screen
-- SELECT * FROM monthly_screens ORDER BY run_date DESC LIMIT 1;

-- Get top 100 picks from latest screen
-- SELECT * FROM top_picks_detailed LIMIT 100;

-- Get picks by category
-- SELECT * FROM stock_picks 
-- WHERE screen_id = (SELECT id FROM monthly_screens ORDER BY run_date DESC LIMIT 1)
-- AND category = 'growth' 
-- ORDER BY rank LIMIT 50;

-- Get recent patterns for a symbol
-- SELECT * FROM candlestick_patterns 
-- WHERE symbol = 'AAPL' 
-- AND detected_at >= NOW() - INTERVAL '7 days'
-- ORDER BY detected_at DESC;
