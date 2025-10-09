# Stripe Price ID Debugging Guide

## Current Issue
Getting error: `"No such price: 'price_1SFisiEqDmyzWO2oMb69eU01'"`

This means Stripe cannot find the price ID you provided.

## What We Added
The payment API now logs comprehensive debugging information on startup and during checkout.

## How to Debug

### Step 1: Check Railway Logs on Startup

After the payment API deploys, check the Railway logs for this section:

```
💳 Stripe Configuration
{
  "stripeConfigured": true/false,
  "stripeMode": "TEST" or "LIVE",
  "stripeKeyPrefix": "sk_test..." or "sk_live...",
  "priceIds": {
    "premium": "price_1SFi...",
    "pro": "price_1XYZ...",
    ...
  }
}
```

**Check:**
- ✅ `stripeConfigured` should be `true`
- ✅ `stripeMode` should match your intended environment (TEST or LIVE)
- ✅ All `priceIds` should start with `price_` (not `NOT SET` or `prod_`)

### Step 2: Verify Test vs Live Mode Match

**The #1 cause of "No such price" errors is mismatched environments:**

| If your Stripe Secret Key is... | Your Price IDs must be from... |
|----------------------------------|--------------------------------|
| `sk_test_...` | Stripe **Test** Dashboard |
| `sk_live_...` | Stripe **Live** Dashboard |

**To check in Stripe Dashboard:**
1. Look at the top left corner - it will say "TEST DATA" or "LIVE"
2. Make sure you're in the right mode when copying price IDs
3. Toggle between modes with the switch at the top left

### Step 3: Get the Correct Price IDs

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Make sure you're in the correct mode** (TEST or LIVE)
3. **Go to Products** → Click on your Premium/Pro product
4. **Look for the Pricing section**:
   ```
   Recurring
   $29.00 / month
   Price ID: price_1ABC2DEF3GHI4JKL  ← Copy this exact string
   ```
5. **Copy the Price ID exactly** (it starts with `price_`)

### Step 4: Update Railway Environment Variables

1. **Go to Railway** → Your payment API service → **Variables** tab
2. **Update these variables**:
   ```
   STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
   STRIPE_PREMIUM_PRICE_ID=price_...
   STRIPE_PRO_PRICE_ID=price_...
   STRIPE_PREMIUM_YEARLY_PRICE_ID=price_... (optional)
   STRIPE_PRO_YEARLY_PRICE_ID=price_... (optional)
   ```
3. **Make sure:**
   - No extra spaces before/after values
   - All from the same Stripe environment (all test or all live)
   - Price IDs start with `price_` not `prod_`
4. **Save** and **Redeploy** the service

### Step 5: Check Logs During Checkout

When you try to subscribe again, the payment API will now log:

```
About to create Stripe checkout with price ID
{
  "stripePriceId": "price_1SFisiEqDmyzWO2oMb69eU01",
  "priceIdType": "string",
  "priceIdLength": 28,
  "trimmedPriceId": "price_1SFisiEqDmyzWO2oMb69eU01"
}
```

**Check:**
- ✅ `stripePriceId` looks correct (starts with `price_`, no weird characters)
- ✅ `priceIdLength` is reasonable (usually 27-30 characters)
- ✅ No difference between `stripePriceId` and `trimmedPriceId` (means no whitespace)

### Step 6: If Still Getting Error

Check the error logs - they now include:

```json
{
  "error": "Failed to create checkout session",
  "details": "No such price: 'price_xxx'",
  "priceIdUsed": "price_xxx",
  "isTestMode": true/false
}
```

**Common Issues:**

1. **Wrong Stripe Account**
   - If you have multiple Stripe accounts, make sure the price ID is from the same account as your secret key

2. **Deleted Price**
   - The price might have been archived/deleted in Stripe
   - Create a new price in Stripe and use that ID

3. **Wrong API Version**
   - Very rare, but Stripe might have deprecated the price
   - Create a new price in Stripe

4. **Typo in Environment Variable**
   - Double-check for typos, extra spaces, or missing characters
   - Copy-paste directly from Stripe Dashboard

## Quick Checklist

- [ ] Railway logs show `stripeMode: "TEST"` or `"LIVE"`
- [ ] All price IDs start with `price_` not `prod_`
- [ ] Stripe secret key mode matches price ID mode (both test or both live)
- [ ] Price IDs copied from correct Stripe account
- [ ] No extra spaces in environment variables
- [ ] Payment API redeployed after updating variables
- [ ] Price exists in Stripe Dashboard (not archived)

## Test Command

You can also test the price ID directly with Stripe CLI:

```bash
stripe prices retrieve price_1SFisiEqDmyzWO2oMb69eU01
```

This will tell you immediately if the price exists in your Stripe account.

## Next Steps

1. **Deploy the payment API** (should autodeploy from this push)
2. **Check Railway logs** for startup configuration
3. **Update environment variables** if needed
4. **Try subscribing again** and check the detailed error logs
5. **Share the logs** if still having issues (mask sensitive data!)
