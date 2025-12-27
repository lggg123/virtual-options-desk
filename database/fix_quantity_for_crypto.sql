-- Fix quantity columns to support fractional amounts for crypto/CFD trading
-- Run this in Supabase SQL Editor

-- Update trades table: change quantity from INTEGER to NUMERIC
ALTER TABLE public.trades
ALTER COLUMN quantity TYPE NUMERIC USING quantity::NUMERIC;

-- Update positions table: change quantity from INTEGER to NUMERIC
ALTER TABLE public.positions
ALTER COLUMN quantity TYPE NUMERIC USING quantity::NUMERIC;

-- Verify the changes
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('trades', 'positions')
AND column_name = 'quantity'
AND table_schema = 'public';
