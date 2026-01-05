-- Fix quantity columns to support fractional amounts for crypto/CFD trading
-- Run this in Supabase SQL Editor

-- Update trades table: change quantity from INTEGER to NUMERIC
-- Use sufficient precision for crypto fractional quantities
ALTER TABLE public.trades
ALTER COLUMN quantity TYPE NUMERIC(28,8) USING quantity::NUMERIC(28,8);

-- Update positions table: change quantity from INTEGER to NUMERIC
ALTER TABLE public.positions
ALTER COLUMN quantity TYPE NUMERIC(28,8) USING quantity::NUMERIC(28,8);

-- Also update user-level position/trade tables if present
ALTER TABLE public.user_positions
ALTER COLUMN quantity TYPE NUMERIC(28,8) USING quantity::NUMERIC(28,8);

ALTER TABLE public.user_trades
ALTER COLUMN quantity TYPE NUMERIC(28,8) USING quantity::NUMERIC(28,8);

-- Verify the changes
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('trades', 'positions', 'user_positions', 'user_trades')
AND column_name = 'quantity'
AND table_schema = 'public';
