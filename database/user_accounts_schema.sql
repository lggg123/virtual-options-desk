-- User Portfolio/Account Schema
-- This stores virtual trading account data for each user

CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cash_balance DECIMAL(15, 2) DEFAULT 2000000.00 NOT NULL,
  portfolio_value DECIMAL(15, 2) DEFAULT 2000000.00 NOT NULL,
  total_pnl DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  total_pnl_percent DECIMAL(8, 4) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Positions (Options Positions)
CREATE TABLE IF NOT EXISTS user_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('Call', 'Put')),
  strike DECIMAL(10, 2) NOT NULL,
  expiry DATE NOT NULL,
  quantity INTEGER NOT NULL,
  avg_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) DEFAULT 0.00,
  pnl DECIMAL(15, 2) DEFAULT 0.00,
  pnl_percent DECIMAL(8, 4) DEFAULT 0.00,
  delta DECIMAL(8, 4) DEFAULT 0.00,
  theta DECIMAL(8, 4) DEFAULT 0.00,
  gamma DECIMAL(8, 4) DEFAULT 0.00,
  vega DECIMAL(8, 4) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade History
CREATE TABLE IF NOT EXISTS user_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('Call', 'Put')),
  action VARCHAR(10) NOT NULL CHECK (action IN ('Buy', 'Sell')),
  strike DECIMAL(10, 2) NOT NULL,
  expiry DATE NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(15, 2) NOT NULL,
  fees DECIMAL(10, 2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'filled' CHECK (status IN ('pending', 'filled', 'cancelled', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_positions_user_id ON user_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_positions_symbol ON user_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_user_trades_user_id ON user_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trades_created_at ON user_trades(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own data
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own account" ON user_accounts;
DROP POLICY IF EXISTS "Users can update own account" ON user_accounts;
DROP POLICY IF EXISTS "Service role can insert accounts" ON user_accounts;
DROP POLICY IF EXISTS "Users can view own positions" ON user_positions;
DROP POLICY IF EXISTS "Users can insert own positions" ON user_positions;
DROP POLICY IF EXISTS "Users can update own positions" ON user_positions;
DROP POLICY IF EXISTS "Users can delete own positions" ON user_positions;
DROP POLICY IF EXISTS "Users can view own trades" ON user_trades;
DROP POLICY IF EXISTS "Users can insert own trades" ON user_trades;

-- Create policies
CREATE POLICY "Users can view own account" ON user_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own account" ON user_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- CRITICAL: Allow service role and triggers to INSERT (needed for auto-account creation)
CREATE POLICY "Service role can insert accounts" ON user_accounts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own positions" ON user_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions" ON user_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions" ON user_positions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own positions" ON user_positions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trades" ON user_trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON user_trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create account on user signup
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
    -- Log error but don't block user creation
    RAISE LOG 'Error in create_user_account trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create account when user signs up
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_account();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_accounts_updated_at ON user_accounts;
DROP TRIGGER IF EXISTS update_user_positions_updated_at ON user_positions;

CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_positions_updated_at
  BEFORE UPDATE ON user_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
