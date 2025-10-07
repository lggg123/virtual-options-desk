-- Subscriptions Table for Payment API
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User reference
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Stripe identifiers
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Plan info
    plan_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    
    -- Subscription period
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment tracking
    last_payment_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

-- Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (webhook handlers)
CREATE POLICY "Service role can insert subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update subscriptions" ON subscriptions
    FOR UPDATE USING (auth.role() = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- View for current active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
    s.*,
    p.email as user_email
FROM subscriptions s
JOIN auth.users p ON s.user_id = p.id
WHERE s.status = 'active' 
  AND s.current_period_end > NOW()
  AND s.cancel_at_period_end = FALSE;

-- Helper function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_sub BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM subscriptions
        WHERE user_id = check_user_id
        AND status = 'active'
        AND current_period_end > NOW()
    ) INTO has_sub;
    
    RETURN has_sub;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's plan
CREATE OR REPLACE FUNCTION get_user_plan(check_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    user_plan VARCHAR(50);
BEGIN
    SELECT plan_id INTO user_plan
    FROM subscriptions
    WHERE user_id = check_user_id
    AND status = 'active'
    AND current_period_end > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN COALESCE(user_plan, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE subscriptions IS 'Stripe subscription data for payment tracking';
COMMENT ON FUNCTION has_active_subscription IS 'Check if user has an active paid subscription';
COMMENT ON FUNCTION get_user_plan IS 'Get user''s current plan (defaults to free if no active subscription)';
