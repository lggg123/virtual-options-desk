-- Complete Migration: Update starter money from $100,000 to $2,000,000
-- This updates BOTH existing users AND default values for new users
-- Run this script in your Supabase SQL editor

BEGIN;

-- ==================== PART 1: Update Existing Users ====================
DO $$ BEGIN RAISE NOTICE '🔄 Updating existing users...'; END $$;

-- Update user_accounts table (if it exists)
UPDATE user_accounts
SET 
  cash_balance = 2000000.00,
  portfolio_value = 2000000.00,
  updated_at = NOW()
WHERE 
  cash_balance = 100000.00 
  AND portfolio_value = 100000.00
  AND total_pnl = 0.00;

-- Update portfolios table
UPDATE portfolios
SET 
  cash_balance = 2000000.00,
  total_value = 2000000.00,
  updated_at = NOW()
WHERE 
  cash_balance = 100000.00 
  AND total_value = 100000.00
  AND unrealized_pl = 0
  AND realized_pl = 0;

DO $$ BEGIN RAISE NOTICE '✅ Existing users updated'; END $$;

-- ==================== PART 2: Update Table Defaults for New Users ====================
DO $$ BEGIN RAISE NOTICE '🔄 Updating default values for new users...'; END $$;

-- Update user_accounts table defaults
ALTER TABLE user_accounts 
  ALTER COLUMN cash_balance SET DEFAULT 2000000.00,
  ALTER COLUMN portfolio_value SET DEFAULT 2000000.00;

-- Update portfolios table defaults
ALTER TABLE portfolios 
  ALTER COLUMN cash_balance SET DEFAULT 2000000.00,
  ALTER COLUMN total_value SET DEFAULT 2000000.00;

DO $$ BEGIN RAISE NOTICE '✅ Default values updated'; END $$;

-- ==================== PART 3: Update Trigger Function ====================
DO $$ BEGIN RAISE NOTICE '🔄 Updating trigger functions...'; END $$;

-- Update create_user_account trigger function
CREATE OR REPLACE FUNCTION create_user_account()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_accounts (user_id, cash_balance, portfolio_value, total_pnl, total_pnl_percent)
  VALUES (NEW.id, 2000000.00, 2000000.00, 0.00, 0.00);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_user_account trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN RAISE NOTICE '✅ Trigger functions updated'; END $$;

-- ==================== PART 4: Verification ====================
DO $$ BEGIN RAISE NOTICE '📊 Verification Results:'; END $$;

-- Show updated users
DO $$
DECLARE
  user_accounts_count INTEGER;
  portfolios_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_accounts_count
  FROM user_accounts
  WHERE cash_balance = 2000000.00 AND portfolio_value = 2000000.00;
  
  SELECT COUNT(*) INTO portfolios_count
  FROM portfolios
  WHERE cash_balance = 2000000.00 AND total_value = 2000000.00;
  
  RAISE NOTICE '   user_accounts: % users with $2,000,000', user_accounts_count;
  RAISE NOTICE '   portfolios: % portfolios with $2,000,000', portfolios_count;
END $$;

-- Show table defaults
SELECT 
  table_name,
  column_name,
  column_default
FROM information_schema.columns
WHERE table_name IN ('user_accounts', 'portfolios')
  AND column_name IN ('cash_balance', 'total_value', 'portfolio_value')
ORDER BY table_name, column_name;

COMMIT;

DO $$ BEGIN RAISE NOTICE '✨ Migration complete! New users will now start with $2,000,000'; END $$;
