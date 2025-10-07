# 🔗 Complete Integration Guide

## Overview
This guide covers integrating the Payment API with your Next.js frontend and enforcing subscriptions across all backend services.

---

## 📋 Table of Contents
1. [Frontend Setup](#frontend-setup)
2. [Environment Variables](#environment-variables)
3. [Supabase Schema Setup](#supabase-schema-setup)
4. [Frontend API Routes](#frontend-api-routes)
5. [Pricing Page Component](#pricing-page-component)
6. [Subscription Enforcement](#subscription-enforcement)
7. [Testing the Integration](#testing-the-integration)

---

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
cd /workspaces/virtual-options-desk
npm install @supabase/supabase-js lucide-react
```

### 2. Update Environment Variables

Create/update `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Payment API
PAYMENT_API_URL=https://payment-api-production.up.railway.app

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE

# App URL
NEXT_PUBLIC_URL=https://your-app.vercel.app
```

---

## 🗄️ Supabase Schema Setup

### 1. Run Subscription Schema

Go to **Supabase Dashboard** → **SQL Editor** → Run this:

```sql
-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON public.subscriptions(stripe_subscription_id);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own subscription
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can write (for webhooks)
CREATE POLICY "Service role can write subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Helper function: Check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > NOW())
      AND cancel_at_period_end = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get user's plan
CREATE OR REPLACE FUNCTION public.get_user_plan(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT plan_id FROM public.subscriptions
    WHERE user_id = user_uuid
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > NOW())
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for active subscriptions
CREATE OR REPLACE VIEW public.active_subscriptions AS
SELECT * FROM public.subscriptions
WHERE status IN ('active', 'trialing')
  AND (current_period_end IS NULL OR current_period_end > NOW())
  AND cancel_at_period_end = FALSE;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### 2. Create Usage Tracking Table (Optional)

```sql
-- Track monthly usage per user
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL, -- 'picks', 'api_calls', etc.
  count INTEGER DEFAULT 0,
  month TEXT NOT NULL, -- Format: '2025-10'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_type, month)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_user_month ON public.usage_tracking(user_id, month);

-- RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON public.usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can write usage"
  ON public.usage_tracking
  FOR ALL
  USING (auth.role() = 'service_role');
```

---

## 🚀 Frontend API Routes (Already Created)

The following API routes have been created in `src/app/api/payment/`:

### 1. `/api/payment/checkout` (POST)
Creates Stripe checkout session

### 2. `/api/payment/subscription` (GET)
Gets user's subscription status

### 3. `/api/payment/portal` (POST)
Creates Stripe billing portal session

---

## 🎨 Pricing Page (Already Created)

The pricing page component has been created at:
- `src/app/pricing/page.tsx`

Features:
- ✅ 3 pricing tiers (Free, Premium, Pro)
- ✅ Monthly/Yearly toggle with 17% savings
- ✅ Current subscription banner
- ✅ Stripe checkout integration
- ✅ Beautiful gradient design
- ✅ FAQ section
- ✅ Trust badges

---

## 🔒 Subscription Enforcement

### Backend APIs (Python)

The subscription middleware has been created at:
- `python/subscription_middleware.py`

#### Pattern Detection API Integration

Already updated in `python/pattern_detection_api.py`:
- ✅ Imports subscription middleware
- ✅ Checks usage limits before detection
- ✅ Increments usage counter
- ✅ Returns subscription status endpoint

#### ML Screening API Integration

Update `python/ml_api.py`:

```python
from fastapi import FastAPI, Request
from subscription_middleware import (
    check_plan_access,
    check_usage_limit,
    increment_usage,
    get_user_subscription
)

# Add to your ML screening endpoint
@app.post("/screen")
async def screen_stocks(request: Request, data: ScreeningRequest):
    # Get user_id
    user_id = getattr(request.state, 'user_id', None) or request.query_params.get('user_id')
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Check if user has Pro plan (ML screening requires Pro)
    subscription = await get_user_subscription(user_id)
    if subscription['plan_id'] != 'pro':
        raise HTTPException(
            status_code=403,
            detail={
                'error': 'ML screening requires Pro plan',
                'required_plan': 'pro',
                'upgrade_url': '/pricing'
            }
        )
    
    # Your ML screening logic here...
    results = perform_ml_screening(data)
    
    return results
```

### Frontend Protection

#### Protect Routes with Middleware

Create `src/middleware.ts`:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedRoutes = ['/dashboard', '/settings', '/ml-screening'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/ml-screening/:path*'],
};
```

#### Check Subscription in Components

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProtectedFeature() {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const res = await fetch('/api/payment/subscription');
      const data = await res.json();

      // Check if user has Premium or Pro plan
      if (data.plan === 'premium' || data.plan === 'pro') {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Failed to check subscription:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Premium Feature
        </h2>
        <p className="text-gray-300 mb-6">
          This feature requires a Premium or Pro subscription.
        </p>
        <button
          onClick={() => router.push('/pricing')}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Upgrade Now
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Your protected feature content */}
    </div>
  );
}
```

---

## 🧪 Testing the Integration

### 1. Test Stripe Checkout Flow

```bash
# Use Stripe test card
# Card number: 4242 4242 4242 4242
# Expiry: Any future date (e.g., 12/34)
# CVC: Any 3 digits (e.g., 123)
```

**Steps:**
1. Go to `/pricing`
2. Click "Subscribe Now" on Premium plan
3. Fill in Stripe test card details
4. Complete checkout
5. Should redirect to `/success`
6. Check Supabase `subscriptions` table for new entry

### 2. Test Subscription Status

```bash
# Get subscription status
curl -X GET https://your-app.vercel.app/api/payment/subscription \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT"
```

### 3. Test Pattern Detection with Subscription

```bash
# Call pattern detection API
curl -X POST https://pattern-api.up.railway.app/detect?user_id=YOUR_USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "timeframe": "1d",
    "candles": [...]
  }'
```

### 4. Test Subscription Limit

```bash
# Check subscription status endpoint
curl https://pattern-api.up.railway.app/subscription/status?user_id=YOUR_USER_ID
```

Expected response:
```json
{
  "user_id": "...",
  "plan": "premium",
  "status": "active",
  "features": {
    "picks_per_month": 100,
    "pattern_detection": true,
    "ml_screening": true
  },
  "usage": {
    "picks_used": 5,
    "picks_limit": 100,
    "picks_remaining": 95
  }
}
```

### 5. Test Billing Portal

1. Go to `/pricing`
2. If subscribed, click "Manage Subscription"
3. Should redirect to Stripe billing portal
4. Test updating payment method, canceling subscription

---

## ✅ Integration Checklist

### Backend (Railway)

- [ ] Payment API deployed to Railway
- [ ] Pattern Detection API updated with subscription middleware
- [ ] ML Screening API updated with subscription enforcement
- [ ] Environment variables set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

### Supabase

- [ ] `subscriptions` table created
- [ ] RLS policies enabled
- [ ] Helper functions created
- [ ] `usage_tracking` table created (optional)

### Stripe

- [ ] Products created (Premium, Pro)
- [ ] Price IDs copied to Railway environment
- [ ] Webhook endpoint created
- [ ] Webhook secret copied to Railway
- [ ] Test mode enabled for testing

### Frontend (Next.js)

- [ ] API routes created (`/api/payment/*`)
- [ ] Pricing page component created
- [ ] Success page created
- [ ] Environment variables set
- [ ] Middleware for protected routes (optional)

### Testing

- [ ] Checkout flow tested with test card
- [ ] Subscription status displays correctly
- [ ] Pattern detection enforces limits
- [ ] ML screening requires Pro plan
- [ ] Billing portal works
- [ ] Webhook updates subscription in Supabase

---

## 🎉 What's Next?

1. **Deploy Frontend to Vercel**
   - Push code to GitHub
   - Connect to Vercel
   - Set environment variables
   - Deploy

2. **Test End-to-End**
   - Complete checkout flow
   - Verify subscription status
   - Test API calls with subscription
   - Check usage limits

3. **Switch to Production**
   - Use live Stripe keys
   - Update webhook to live mode
   - Test with real card
   - Monitor Stripe Dashboard

4. **Add Features**
   - Email notifications
   - Usage analytics dashboard
   - Team/multi-user subscriptions
   - Promo codes

---

## 📚 Additional Resources

- [Payment API Guide](./PAYMENT_API_GUIDE.md)
- [Railway Deployment Guide](./RAILWAY_PAYMENT_DEPLOY.md)
- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 🆘 Common Issues

### "Authentication required"
- Make sure user is logged in
- Pass `user_id` as query parameter or in Authorization header

### "Monthly usage limit reached"
- Check `usage_tracking` table
- Verify subscription plan allows more usage
- User needs to upgrade plan

### "Webhook signature verification failed"
- Verify `STRIPE_WEBHOOK_SECRET` in Railway matches Stripe Dashboard
- Check webhook endpoint URL is correct

### "Subscription not found"
- Wait a few seconds after checkout for webhook to fire
- Check Railway logs for webhook errors
- Verify Supabase service role key is correct

Need more help? Check the troubleshooting sections in PAYMENT_API_GUIDE.md
