# 🔍 Subscription Button Debug Guide

## Problem
The subscription button shows a blank error or doesn't work properly.

## Debug Steps

### Step 1: Use the Debug Page

I've created a special debug page to help identify the exact issue:

1. **Visit the debug page:**
   ```
   http://localhost:3000/debug-subscription
   ```
   (Or your deployed URL: https://your-app.vercel.app/debug-subscription)

2. **Make sure you're logged in first**
   - If not logged in, click the login link
   - Log in with your credentials
   - Return to the debug page

3. **Run each test in order:**
   - Click "1. Test Environment Variables"
   - Click "2. Test Payment API Health"
   - Click "3. Test Direct Payment API Connection"
   - Click "4. Test Full Checkout Flow"

4. **Check the logs** (black console area)
   - Look for any ❌ red errors
   - Copy the full error message

### Step 2: Common Issues and Solutions

#### Issue 1: "Not authenticated" or 401 Error

**Symptoms:**
- Error says "Not authenticated"
- Status code 401

**Solutions:**
```bash
# Make sure you're logged in
# Clear browser cookies and localStorage:
# - Open DevTools (F12)
# - Application tab → Clear Storage → Clear site data
# - Log in again

# If still failing, check your Supabase client setup
```

**Fix Applied:**
- ✅ Updated `/src/app/api/payment/checkout/route.ts` to use proper cookie-based auth
- ✅ This matches the login fix we did earlier

#### Issue 2: "Payment API unreachable" or Connection Error

**Symptoms:**
- Error about connecting to payment API
- "Failed to fetch" or "Network error"
- ECONNREFUSED

**Solutions:**

**For Local Development:**
```bash
# Make sure payment API is running
cd payment-api
npm run dev

# In another terminal, check if it's up:
curl http://localhost:3001/health

# Should respond with: {"status":"ok",...}
```

**For Production/Deployment:**
```bash
# Check your environment variables:
# - PAYMENT_API_URL should point to your deployed payment API
# - Example: https://your-payment-api.railway.app
```

#### Issue 3: "Invalid plan ID" or Stripe Error

**Symptoms:**
- Error mentions "Invalid plan ID"
- Error from Stripe about price IDs

**Solutions:**
```bash
# Check your payment API environment variables:
cd payment-api
cat .env

# Make sure these are set:
# STRIPE_SECRET_KEY=sk_test_... or sk_live_...
# STRIPE_PREMIUM_PRICE_ID=price_...
# STRIPE_PRO_PRICE_ID=price_...
# STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...
# STRIPE_PRO_YEARLY_PRICE_ID=price_...

# Verify these Price IDs exist in your Stripe dashboard:
# https://dashboard.stripe.com/test/products
```

#### Issue 4: "No URL in response" or Blank Error

**Symptoms:**
- Checkout API succeeds but no redirect happens
- Empty or blank error message
- Console shows "No checkout URL"

**Solutions:**
- This means the payment API returned success but didn't include a Stripe URL
- Check payment API logs for errors
- Verify Stripe keys are valid
- Make sure Stripe products/prices are created

### Step 3: Check Server Logs

**Local Development:**
Check the terminal where you ran `bun run dev`:
```bash
# Look for lines like:
# "Checkout request received for plan: premium"
# "Payment API URL: http://localhost:3001"
# "User authenticated: <user-id>"
# "Calling payment API: ..."
# "Payment API error: ..." ← Look for this!
```

**Production (Vercel/Railway):**
- Go to your deployment dashboard
- Check "Logs" or "Deployments" section
- Look for errors from `/api/payment/checkout`

### Step 4: Verify Environment Variables

**Frontend (.env.local or Vercel Environment Variables):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_URL=https://your-frontend.vercel.app
PAYMENT_API_URL=https://your-payment-api.railway.app  # Or http://localhost:3001 for local
```

**Payment API (.env in payment-api/):**
```bash
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PREMIUM_PRICE_ID=price_your_id
STRIPE_PRO_PRICE_ID=price_your_id
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_your_id
STRIPE_PRO_YEARLY_PRICE_ID=price_your_id
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
```

## Quick Diagnostic Commands

### Test Payment API (Local):
```bash
# Health check
curl http://localhost:3001/health

# Full info
curl http://localhost:3001/

# Test checkout (replace USER_ID):
curl -X POST http://localhost:3001/api/checkout/create \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "premium",
    "userId": "YOUR_USER_ID_HERE",
    "successUrl": "http://localhost:3000/success",
    "cancelUrl": "http://localhost:3000/pricing"
  }'
```

### Test Frontend API Route:
```bash
# Test from browser console (while logged in):
fetch('/api/payment/health')
  .then(r => r.json())
  .then(console.log)

# Test checkout:
fetch('/api/payment/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ planId: 'premium' })
}).then(r => r.json()).then(console.log)
```

## What I Fixed

### 1. Updated Checkout Route (✅ Done)
**File:** `/src/app/api/payment/checkout/route.ts`

**Changes:**
- ✅ Uses `cookies()` for proper server-side auth
- ✅ Added extensive logging
- ✅ Better error messages with details
- ✅ Matches the authentication pattern from login fix

### 2. Created Debug Page (✅ Done)
**URL:** `/debug-subscription`

**Features:**
- Test authentication status
- Test environment variables
- Test payment API connectivity
- Test full checkout flow
- Real-time logging in browser

### 3. Added Health Check Endpoint (✅ Done)
**URL:** `/api/payment/health`

**Purpose:**
- Quick way to check if payment API is reachable
- Shows connection status
- Returns payment API response

## How to Report Issues

If you're still having problems, please provide:

1. **Screenshot of debug page after running all tests**
2. **Error messages from the console** (press F12 → Console tab)
3. **Environment you're testing:**
   - Local development or production?
   - Which browser?
4. **Terminal output** from `bun run dev` when you click subscribe

## Next Steps After Debug

Once you visit `/debug-subscription` and run the tests:

1. **Share the error logs** with me
2. **I'll identify the exact issue** from the logs
3. **We'll implement the proper fix** for your specific problem

The debug page will tell us exactly what's failing:
- ❌ Authentication issue → We'll fix the auth flow
- ❌ Payment API unreachable → We'll fix the connection
- ❌ Stripe configuration → We'll fix the Stripe setup
- ❌ Something else → We'll see it in the logs!

## Files Changed

1. `/src/app/debug-subscription/page.tsx` - Debug interface (NEW)
2. `/src/app/api/payment/health/route.ts` - Health check endpoint (NEW)
3. `/src/app/api/payment/checkout/route.ts` - Better auth and logging (UPDATED)

---

**Ready to Debug!** 

Visit: http://localhost:3000/debug-subscription (or your deployed URL)

Run the tests and let me know what errors you see! 🔍
