# Payment System Environment Variables Setup

## Required Environment Variables

### Frontend (Next.js on Vercel)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Payment API URL
PAYMENT_API_URL=https://your-payment-api.up.railway.app

# Frontend URL (for redirects)
NEXT_PUBLIC_URL=https://your-frontend.vercel.app
```

### Payment API (Node.js on Railway)

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PREMIUM_PRICE_ID=price_... # Monthly Premium price
STRIPE_PRO_PRICE_ID=price_...     # Monthly Pro price
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_... # Yearly Premium price
STRIPE_PRO_YEARLY_PRICE_ID=price_...     # Yearly Pro price

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CORS
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000

# Server
PORT=3001
NODE_ENV=production
```

---

## Setup Steps

### 1. Get Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or log in
3. Navigate to **Developers** → **API Keys**
4. Copy:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)

### 2. Create Stripe Products and Prices

1. In Stripe Dashboard, go to **Products**
2. Click **+ Add Product**

#### Premium Plan (Monthly)
- **Name**: Premium Monthly
- **Price**: $29
- **Billing Period**: Monthly
- **Recurring**: Yes
- Copy the **Price ID** (starts with `price_`) → use for `STRIPE_PREMIUM_PRICE_ID`

#### Pro Plan (Monthly)
- **Name**: Pro Monthly
- **Price**: $99
- **Billing Period**: Monthly
- **Recurring**: Yes
- Copy the **Price ID** → use for `STRIPE_PRO_PRICE_ID`

#### Premium Plan (Yearly)
- **Name**: Premium Yearly
- **Price**: $290 (10 months price = 2 months free)
- **Billing Period**: Yearly
- **Recurring**: Yes
- Copy the **Price ID** → use for `STRIPE_PREMIUM_YEARLY_PRICE_ID`

#### Pro Plan (Yearly)
- **Name**: Pro Yearly
- **Price**: $990 (10 months price = 2 months free)
- **Billing Period**: Yearly
- **Recurring**: Yes
- Copy the **Price ID** → use for `STRIPE_PRO_YEARLY_PRICE_ID`

### 3. Setup Stripe Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. **Endpoint URL**: `https://your-payment-api.up.railway.app/api/webhook/stripe`
4. **Events to send**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`) → use for `STRIPE_WEBHOOK_SECRET`

### 4. Get Supabase Keys

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 5. Add Environment Variables to Railway (Payment API)

1. Go to [Railway Dashboard](https://railway.app/)
2. Select your **payment-api** service
3. Go to **Variables** tab
4. Add all the Payment API environment variables listed above
5. Click **Deploy** to restart with new variables

### 6. Add Environment Variables to Vercel (Frontend)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all the Frontend environment variables listed above
5. Redeploy the project

---

## Testing the Payment Flow

### Test Mode (Development)

1. Use Stripe test keys (start with `sk_test_` and `pk_test_`)
2. Test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date and any CVC

### Live Mode (Production)

1. Switch to live keys in Stripe Dashboard
2. Update all environment variables with live keys
3. Redeploy both services

---

## Troubleshooting

### "Failed to create checkout session"

**Cause**: Payment API is not running or environment variables are missing

**Fix**:
1. Check Railway logs for the payment-api service
2. Verify all environment variables are set
3. Ensure `STRIPE_SECRET_KEY` is valid

### "Not authenticated"

**Cause**: User is not logged in or Supabase session expired

**Fix**:
1. Make sure user is logged in via Supabase Auth
2. Check browser console for auth errors
3. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

### Webhook not receiving events

**Cause**: Webhook endpoint is not accessible or signing secret is wrong

**Fix**:
1. Test the webhook URL: `https://your-payment-api.up.railway.app/api/webhook/stripe`
2. Verify `STRIPE_WEBHOOK_SECRET` matches the one in Stripe Dashboard
3. Check Railway logs for webhook errors

### "Invalid price ID"

**Cause**: Price IDs in environment variables don't match Stripe products

**Fix**:
1. Go to Stripe Dashboard → Products
2. Copy the correct Price IDs
3. Update environment variables
4. Redeploy

---

## Quick Setup Checklist

- [ ] Stripe account created
- [ ] Stripe test keys obtained
- [ ] 4 products created in Stripe (Premium/Pro, Monthly/Yearly)
- [ ] All 4 Price IDs copied
- [ ] Webhook endpoint created in Stripe
- [ ] Webhook signing secret copied
- [ ] Supabase keys obtained
- [ ] All environment variables added to Railway
- [ ] All environment variables added to Vercel
- [ ] Both services redeployed
- [ ] Test purchase with test card

---

## Environment Variable Summary

### Frontend (3 variables)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
PAYMENT_API_URL
NEXT_PUBLIC_URL
```

### Payment API (11 variables)
```
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PREMIUM_PRICE_ID
STRIPE_PRO_PRICE_ID
STRIPE_PREMIUM_YEARLY_PRICE_ID
STRIPE_PRO_YEARLY_PRICE_ID
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ALLOWED_ORIGINS
PORT (optional, defaults to 3001)
NODE_ENV (optional)
```

---

## Support

If you encounter issues:
1. Check Railway and Vercel logs
2. Verify all environment variables are set correctly
3. Test with Stripe test mode first
4. Check Stripe Dashboard for webhook delivery status
