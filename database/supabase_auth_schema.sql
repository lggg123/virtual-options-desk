-- ==================== USER AUTHENTICATION & PROFILES ====================
-- Note: Supabase provides auth.users table automatically
-- This creates a public profiles table for additional user data

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    trading_experience TEXT CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
    risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    preferred_strategies TEXT[], -- Array of strategy preferences
    
    -- Account settings
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==================== PORTFOLIOS ====================

CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL DEFAULT 'Main Portfolio',
    description TEXT,
    
    -- Portfolio value
    cash_balance NUMERIC DEFAULT 2000000.00, -- Starting balance
    total_value NUMERIC DEFAULT 2000000.00,
    unrealized_pl NUMERIC DEFAULT 0,
    realized_pl NUMERIC DEFAULT 0,
    
    -- Settings
    is_default BOOLEAN DEFAULT true,
    currency TEXT DEFAULT 'USD',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on portfolios
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Users can only see their own portfolios
CREATE POLICY "Users can view own portfolios"
    ON public.portfolios FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios"
    ON public.portfolios FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios"
    ON public.portfolios FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios"
    ON public.portfolios FOR DELETE
    USING (auth.uid() = user_id);

-- Create default portfolio for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_portfolio()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.portfolios (user_id, name, is_default)
    VALUES (NEW.id, 'Main Portfolio', true);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_portfolio();

-- ==================== POSITIONS (Options & Stocks) ====================

CREATE TABLE IF NOT EXISTS public.positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Position details
    symbol TEXT NOT NULL,
    position_type TEXT NOT NULL CHECK (position_type IN ('stock', 'call', 'put', 'spread')),
    
    -- Options-specific fields
    strike_price NUMERIC,
    expiration_date DATE,
    option_type TEXT CHECK (option_type IN ('call', 'put')),
    
    -- Position size
    quantity INTEGER NOT NULL,
    entry_price NUMERIC NOT NULL,
    current_price NUMERIC,
    
    -- P&L tracking
    cost_basis NUMERIC NOT NULL, -- quantity * entry_price
    market_value NUMERIC,
    unrealized_pl NUMERIC,
    unrealized_pl_percent NUMERIC,
    
    -- Greeks (for options)
    delta NUMERIC,
    gamma NUMERIC,
    theta NUMERIC,
    vega NUMERIC,
    implied_volatility NUMERIC,
    
    -- Trade info
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'expired')),
    
    -- Notes
    strategy TEXT,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_positions_user_id ON public.positions(user_id);
CREATE INDEX idx_positions_portfolio_id ON public.positions(portfolio_id);
CREATE INDEX idx_positions_symbol ON public.positions(symbol);
CREATE INDEX idx_positions_status ON public.positions(status);
CREATE INDEX idx_positions_user_status ON public.positions(user_id, status);

-- Enable RLS on positions
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own positions"
    ON public.positions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions"
    ON public.positions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions"
    ON public.positions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own positions"
    ON public.positions FOR DELETE
    USING (auth.uid() = user_id);

-- ==================== TRADE HISTORY ====================

CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
    
    -- Trade details
    symbol TEXT NOT NULL,
    trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
    position_type TEXT NOT NULL CHECK (position_type IN ('stock', 'call', 'put', 'spread')),
    
    -- Options details
    strike_price NUMERIC,
    expiration_date DATE,
    option_type TEXT CHECK (option_type IN ('call', 'put')),
    
    -- Execution
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    total_cost NUMERIC NOT NULL, -- quantity * price + fees
    fees NUMERIC DEFAULT 0,
    
    -- P&L (for closing trades)
    realized_pl NUMERIC,
    realized_pl_percent NUMERIC,
    
    -- Metadata
    strategy TEXT,
    notes TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_portfolio_id ON public.trades(portfolio_id);
CREATE INDEX idx_trades_symbol ON public.trades(symbol);
CREATE INDEX idx_trades_executed_at ON public.trades(executed_at DESC);

-- Enable RLS on trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
    ON public.trades FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
    ON public.trades FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==================== WATCHLISTS ====================

CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL DEFAULT 'My Watchlist',
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    symbol TEXT NOT NULL,
    notes TEXT,
    target_price NUMERIC,
    alert_price NUMERIC,
    
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(watchlist_id, symbol)
);

-- Enable RLS
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlists"
    ON public.watchlists FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlists"
    ON public.watchlists FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own watchlist items"
    ON public.watchlist_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own watchlist items"
    ON public.watchlist_items FOR ALL
    USING (auth.uid() = user_id);

-- ==================== ALERTS ====================

CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'percent_change')),
    target_value NUMERIC NOT NULL,
    
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts"
    ON public.price_alerts FOR ALL
    USING (auth.uid() = user_id);

-- ==================== TRIGGERS ====================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON public.portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
    BEFORE UPDATE ON public.positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlists_updated_at
    BEFORE UPDATE ON public.watchlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== USEFUL VIEWS ====================

-- User portfolio summary
CREATE OR REPLACE VIEW user_portfolio_summary AS
SELECT 
    p.id as portfolio_id,
    p.user_id,
    p.name as portfolio_name,
    p.cash_balance,
    p.total_value,
    p.unrealized_pl,
    p.realized_pl,
    COUNT(pos.id) as total_positions,
    SUM(CASE WHEN pos.status = 'open' THEN 1 ELSE 0 END) as open_positions
FROM public.portfolios p
LEFT JOIN public.positions pos ON p.id = pos.portfolio_id
GROUP BY p.id, p.user_id, p.name, p.cash_balance, p.total_value, p.unrealized_pl, p.realized_pl;

-- ==================== INDEXES ====================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX idx_watchlist_items_user_id ON public.watchlist_items(user_id);
CREATE INDEX idx_watchlist_items_symbol ON public.watchlist_items(symbol);
CREATE INDEX idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX idx_price_alerts_active ON public.price_alerts(is_active) WHERE is_active = true;

-- ==================== COMPLETED ====================
-- ✅ User authentication with Supabase Auth
-- ✅ User profiles table
-- ✅ Portfolios (multi-portfolio support)
-- ✅ Positions (stocks & options with Greeks)
-- ✅ Trade history
-- ✅ Watchlists
-- ✅ Price alerts
-- ✅ Row Level Security (RLS) on all tables
-- ✅ Auto-create profile & default portfolio on signup
-- ✅ Proper indexes for performance
