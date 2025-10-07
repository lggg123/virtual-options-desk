# 💳 Stripe Payment API - Complete Setup Guide

## Overview
High-performance Node.js/TypeScript payment API using Fastify and Stripe for subscription management.

**Tech Stack:**
- **Fastify** (10x faster than Express)
- **TypeScript** (Type safety)
- **Stripe** (Payment processing)
- **Supabase** (Database)
- **Railway** (Deployment)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd payment-api
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```env
PORT=3001
STRIPE_SECRET_KEY=sk_live_...  # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...  # Created after webhook setup
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Create Stripe Products & Prices

**In Stripe Dashboard (https://dashboard.stripe.com):**

1. Go to **Products** → **Add Product**

2. **Premium Plan (Monthly)**
   - Name: `Premium`
   - Price: `$29/month`
   - Billing: `Recurring`
   - Copy the **Price ID** → Add to `.env` as `STRIPE_PREMIUM_PRICE_ID`

3. **Pro Plan (Monthly)**
   - Name: `Pro`
   - Price: `$99/month`
   - Billing: `Recurring`
   - Copy the **Price ID** → Add to `.env` as `STRIPE_PRO_PRICE_ID`

4. **Premium Plan (Yearly)** (Optional)
   - Name: `Premium (Yearly)`
   - Price: `$290/year`
   - Billing: `Recurring - Yearly`
   - Copy the **Price ID** → Add to `.env` as `STRIPE_PREMIUM_YEARLY_PRICE_ID`

5. **Pro Plan (Yearly)** (Optional)
   - Name: `Pro (Yearly)`
   - Price: `$990/year`
   - Billing: `Recurring - Yearly`
   - Copy the **Price ID** → Add to `.env` as `STRIPE_PRO_YEARLY_PRICE_ID`

### 4. Set Up Supabase Database

Run `database/subscriptions_schema.sql` in **Supabase SQL Editor**:
```sql
-- Creates subscriptions table with RLS policies
-- Creates helper functions: has_active_subscription, get_user_plan
```

### 5. Run Locally
```bash
npm run dev
```

API will be available at `http://localhost:3001`

---

## 📡 API Endpoints

### GET `/health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "service": "Payment API",
  "version": "1.0.0",
  "timestamp": "2025-10-07T..."
}
```

### GET `/api/plans`
Get all available pricing plans

**Response:**
```json
{
  "plans": [
    {
      "id": "free",
      "name": "Free",
      "price": 0,
      "interval": "month",
      "features": ["10 AI stock picks/month", "Basic pattern detection", "Community support"]
    },
    {
      "id": "premium",
      "name": "Premium",
      "price": 29,
      "interval": "month",
      "features": ["100 AI stock picks/month", "Advanced pattern detection", ...]
    },
    {
      "id": "pro",
      "name": "Pro",
      "price": 99,
      "interval": "month",
      "features": ["Unlimited AI stock picks", ...]
    }
  ]
}
```

### POST `/api/checkout/create`
Create Stripe Checkout session

**Request:**
```json
{
  "planId": "premium",
  "userId": "uuid-of-user",
  "successUrl": "https://your-app.com/success",
  "cancelUrl": "https://your-app.com/pricing"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

### GET `/api/subscription/:userId`
Get user's subscription status

**Response:**
```json
{
  "plan": "premium",
  "status": "active",
  "currentPeriodEnd": "2025-11-07T...",
  "cancelAtPeriodEnd": false,
  "features": [...]
}
```

### POST `/api/portal/create`
Create Stripe Customer Portal session (for users to manage subscription)

**Request:**
```json
{
  "userId": "uuid-of-user",
  "returnUrl": "https://your-app.com/settings"
}
```

**Response:**
```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

### POST `/api/subscription/cancel`
Cancel subscription (at period end)

**Request:**
```json
{
  "userId": "uuid-of-user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription will cancel at period end"
}
```

### POST `/api/webhooks/stripe`
Stripe webhook handler (for Stripe to notify us of events)

**Handles:**
- `checkout.session.completed` - Subscription created
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed

---

## 🔧 Stripe Webhook Setup

### 1. Get Webhook URL (After Deployment)
Your Railway deployment URL: `https://payment-api.up.railway.app/api/webhooks/stripe`

### 2. Create Webhook in Stripe Dashboard

1. Go to **Developers** → **Webhooks** → **Add Endpoint**
2. URL: `https://payment-api.up.railway.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click **Add Endpoint**
5. Copy **Signing Secret** → Add to Railway environment as `STRIPE_WEBHOOK_SECRET`

### 3. Test Webhook (Local Development)

Use Stripe CLI:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# This will give you a webhook secret starting with whsec_
# Add this to your .env file
```

---

## 🚀 Deploy to Railway

### Option 1: Railway CLI
```bash
cd payment-api

# Login to Railway
railway login

# Create new project
railway init

# Add environment variables
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
railway variables set STRIPE_PREMIUM_PRICE_ID=price_...
railway variables set STRIPE_PRO_PRICE_ID=price_...
railway variables set SUPABASE_URL=https://...
railway variables set SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Deploy
railway up
```

### Option 2: Railway Dashboard

1. **Create New Project**
   - Connect GitHub repo
   - Select `virtual-options-desk` repository

2. **Settings → General**
   - Root Directory: `payment-api`
   - Watch Paths: `/payment-api/**`

3. **Settings → Variables**
   Add all environment variables from `.env.example`

4. **Settings → Networking**
   - Generate Domain
   - Copy the URL (e.g., `https://payment-api-production.up.railway.app`)

5. **Deploy**
   - Should auto-deploy on push to main
   - Check logs for successful startup

### Get Your Public URL
After deployment:
```
https://payment-api-production.up.railway.app
```

Test it:
```bash
curl https://payment-api-production.up.railway.app/health
```

---

## 🔗 Frontend Integration

### Next.js API Routes

Create `src/app/api/payment` directory with these routes:

#### 1. Create Checkout (`src/app/api/payment/checkout/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PAYMENT_API_URL = process.env.PAYMENT_API_URL!;

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();
    
    // Get authenticated user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Call payment API
    const response = await fetch(`${PAYMENT_API_URL}/api/checkout/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        userId: user.id,
        successUrl: `${process.env.NEXT_PUBLIC_URL}/success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      }),
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
```

#### 2. Get Subscription Status (`src/app/api/payment/subscription/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PAYMENT_API_URL = process.env.PAYMENT_API_URL!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const response = await fetch(`${PAYMENT_API_URL}/api/subscription/${user.id}`);
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 });
  }
}
```

#### 3. Manage Subscription (`src/app/api/payment/portal/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PAYMENT_API_URL = process.env.PAYMENT_API_URL!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const response = await fetch(`${PAYMENT_API_URL}/api/portal/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        returnUrl: `${process.env.NEXT_PUBLIC_URL}/settings`,
      }),
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create portal' }, { status: 500 });
  }
}
```

### React Component Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    const res = await fetch('/api/payment/subscription');
    const data = await res.json();
    setSubscription(data);
  }

  async function handleSubscribe(planId: string) {
    setLoading(true);
    
    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      
      const { url } = await res.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      setLoading(false);
    }
  }

  async function handleManageSubscription() {
    const res = await fetch('/api/payment/portal', { method: 'POST' });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div>
      {subscription?.plan !== 'free' && (
        <button onClick={handleManageSubscription}>
          Manage Subscription
        </button>
      )}
      
      <div className="pricing-cards">
        <PricingCard
          plan="premium"
          price={29}
          features={['100 picks/month', 'Advanced detection', ...]}
          onSubscribe={() => handleSubscribe('premium')}
          loading={loading}
          currentPlan={subscription?.plan}
        />
        
        <PricingCard
          plan="pro"
          price={99}
          features={['Unlimited picks', 'API access', ...]}
          onSubscribe={() => handleSubscribe('pro')}
          loading={loading}
          currentPlan={subscription?.plan}
        />
      </div>
    </div>
  );
}
```

---

## 🔒 Subscription Enforcement

### Middleware to Check Subscription

Create `src/middleware/checkSubscription.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function checkSubscription(request: NextRequest, requiredPlan: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Get user from session
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_id, status')
    .eq('user_id', user.id)
    .single();
  
  const planHierarchy = { free: 0, premium: 1, pro: 2 };
  const userPlanLevel = planHierarchy[sub?.plan_id || 'free'];
  const requiredPlanLevel = planHierarchy[requiredPlan];
  
  if (userPlanLevel < requiredPlanLevel) {
    return NextResponse.json(
      { error: 'Upgrade required', requiredPlan },
      { status: 403 }
    );
  }
  
  return null; // Authorized
}
```

### Use in API Routes

```typescript
// src/app/api/ml/screen/route.ts
import { checkSubscription } from '@/middleware/checkSubscription';

export async function POST(request: NextRequest) {
  // Check if user has Pro plan
  const authError = await checkSubscription(request, 'pro');
  if (authError) return authError;
  
  // Continue with ML screening...
}
```

---

## 🎯 Testing

### Test with Stripe Test Cards

Use these test card numbers in Stripe Checkout:

**Success:**
- `4242 4242 4242 4242` - Visa
- Any future expiry date (e.g., `12/34`)
- Any 3-digit CVC (e.g., `123`)

**Decline:**
- `4000 0000 0000 0002` - Card declined

**3D Secure:**
- `4000 0025 0000 3155` - Requires authentication

### Webhook Testing

```bash
# Use Stripe CLI to trigger test webhooks
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
```

---

## 📊 Monitoring

### Check Subscription Stats in Supabase

```sql
-- Active subscriptions count
SELECT plan_id, COUNT(*) as count
FROM active_subscriptions
GROUP BY plan_id;

-- Revenue calculation (monthly)
SELECT 
  SUM(CASE WHEN plan_id = 'premium' THEN 29 ELSE 99 END) as monthly_revenue
FROM active_subscriptions;

-- Churn rate
SELECT 
  COUNT(*) FILTER (WHERE canceled_at IS NOT NULL) * 100.0 / COUNT(*) as churn_rate
FROM subscriptions
WHERE created_at > NOW() - INTERVAL '30 days';
```

---

## 🚨 Important Notes

1. **Use Live Keys in Production**
   - Switch from `sk_test_` to `sk_live_` keys
   - Update webhook secret to live webhook

2. **Webhook Security**
   - Always verify webhook signatures
   - Use HTTPS only (Railway provides this)

3. **Error Handling**
   - Payment API logs all errors
   - Check Railway logs if issues occur

4. **Rate Limiting**
   - Built-in: 100 requests per 15 minutes per IP
   - Adjust in `src/index.ts` if needed

5. **CORS**
   - Configure `ALLOWED_ORIGINS` in environment variables
   - Add your frontend URL

---

## 📚 Next Steps

1. ✅ Deploy Payment API to Railway
2. ✅ Set up Stripe products and prices
3. ✅ Configure webhooks in Stripe Dashboard
4. ✅ Run Supabase SQL schema
5. ✅ Add frontend integration
6. ✅ Test checkout flow
7. ✅ Enable subscription enforcement in ML/Pattern APIs

---

## 🆘 Troubleshooting

### "Webhook signature verification failed"
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Ensure using correct endpoint URL in Stripe

### "No subscription found"
- Verify webhook fired after checkout
- Check Supabase `subscriptions` table for entry
- Look at Railway logs for webhook errors

### "Checkout session expired"
- Sessions expire after 24 hours
- Generate a new checkout link

Need help? Check Railway logs: `railway logs --service payment-api`
