-- ============================================
-- CLEANUP: Drop Historical Data Tables/Views
-- ============================================
-- Run this in the Supabase SQL Editor to remove the tables

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS latest_prices CASCADE;
DROP VIEW IF EXISTS available_symbols CASCADE;

-- Drop tables
DROP TABLE IF EXISTS stock_features CASCADE;
DROP TABLE IF EXISTS historical_prices CASCADE;

-- Verify cleanup
-- Run these to confirm everything is gone:
-- SELECT * FROM pg_tables WHERE tablename IN ('historical_prices', 'stock_features');
-- SELECT * FROM pg_views WHERE viewname IN ('latest_prices', 'available_symbols');
