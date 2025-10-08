# 🔧 Subscription Button Fix Guide

## Problem
When clicking "Subscribe Now" on the pricing page, nothing happens and you get redirected back to the page.

## Root Cause
The payment API service is not running. The Next.js frontend calls `/api/payment/checkout` which then tries to communicate with the payment API service (default: `http://localhost:3001`), but if it's not running, the request fails.

## Solution

### Option 1: Quick Fix - Run All Services Together (Recommended)

1. **Install payment API dependencies:**
```bash
cd payment-api
npm install
cd ..
```

2. **Set up environment variables for payment API:**
```bash
# Create .env file in payment-api directory
cd payment-api
cp .env.example .env
```

3. **Edit the `.env` file with your Stripe credentials:**
```bash
# Required Stripe keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Required: Create products/prices in Stripe first, then add their IDs here
STRIPE_PREMIUM_PRICE_ID=price_your_premium_monthly_id
STRIPE_PRO_PRICE_ID=price_your_pro_monthly_id
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_your_premium_yearly_id
STRIPE_PRO_YEARLY_PRICE_ID=price_your_pro_yearly_id

# Supabase credentials (from your Supabase project settings)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server settings
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

4. **Run all services:**
```bash
# From the root directory
bun run dev
```

This will start:
- Frontend (Next.js) on port 3000
- Payment API on port 3001
- CrewAI service on port 8001

### Option 2: Run Payment API Separately

If you want to run the payment API separately:

```bash
# Terminal 1 - Payment API
cd payment-api
npm run dev

# Terminal 2 - Frontend
cd frontend
bun run dev
```

## Setting Up Stripe Products & Prices

If you haven't created your Stripe products yet:

1. **Go to Stripe Dashboard:** https://dashboard.stripe.com/test/products
2. **Create Products:**
   - Click "Add product"
   - Name: "Premium"
   - Price: $29/month (recurring)
   - Copy the Price ID (starts with `price_`) → Use for `STRIPE_PREMIUM_PRICE_ID`
   
3. **Repeat for other plans:**
   - Premium Yearly: $290/year
   - Pro Monthly: $99/month
   - Pro Yearly: $990/year

## Environment Variables Checklist

### Payment API (.env in payment-api/)
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PREMIUM_PRICE_ID
- [ ] STRIPE_PRO_PRICE_ID
- [ ] STRIPE_PREMIUM_YEARLY_PRICE_ID
- [ ] STRIPE_PRO_YEARLY_PRICE_ID
- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] PORT (default: 3001)
- [ ] ALLOWED_ORIGINS

### Frontend (.env.local in root or frontend/)
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] PAYMENT_API_URL (default: http://localhost:3001)
- [ ] NEXT_PUBLIC_URL (e.g., http://localhost:3000)

## Testing the Fix

1. Start all services with `bun run dev`
2. Visit http://localhost:3000/pricing
3. Log in if not already logged in
4. Click "Subscribe Now" on Premium or Pro plan
5. You should be redirected to Stripe Checkout page

## Troubleshooting

### "Failed to create checkout session"
- Check that payment API is running: `curl http://localhost:3001/health`
- Check payment API logs for errors
- Verify all Stripe environment variables are set correctly

### "Invalid plan ID"
- Make sure your Stripe Price IDs are correct
- Check that you're using test mode keys with test mode prices

### "Not authenticated"
- Make sure you're logged in
- Check browser console for authentication errors
- Verify Supabase credentials are correct

### Payment API Not Starting
- Check if port 3001 is already in use: `lsof -i :3001`
- Check payment API logs for startup errors
- Verify all dependencies are installed: `cd payment-api && npm install`

## Quick Test Commands

```bash
# Test payment API is running
curl http://localhost:3001/health

# Test payment API with full info
curl http://localhost:3001/

# Check if frontend can reach payment API
# (Run from browser console on http://localhost:3000)
fetch('/api/payment/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ planId: 'premium' })
}).then(r => r.json()).then(console.log)
```

## What Changed

1. **Updated package.json** - Added `dev:payment` and `start:payment` scripts
2. **Improved error handling** - Better error messages in pricing page
3. **Added logging** - More detailed console logs for debugging

## Next Steps

Once everything is working locally:
1. Deploy payment API to Railway/Render
2. Update `PAYMENT_API_URL` in frontend environment variables
3. Set up Stripe webhooks for production
4. Switch to live Stripe keys (when ready for production)
