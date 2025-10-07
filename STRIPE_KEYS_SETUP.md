# 🔑 Stripe API Keys Setup

## ✅ Your Stripe Publishable Key (Already Added)

Your test publishable key has been added to:
- ✅ `frontend/.env.local`
- ✅ `frontend/.env.example`

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SFRxbIofnzlOYHG5ccHcbVitTxxxMna6aM9t5LjFyijanm4SAJMvbqhtpCImrfWL5hcLIleqUxxOXYYHJSPTKuz00Vye4VhfQ
```

---

## 🔐 Get Your Secret Key

Now you need to get your **Secret Key** from Stripe Dashboard:

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Find **Secret key** (starts with `sk_test_...`)
3. Click **Reveal test key**
4. Copy the key

### Add to Payment API

Create `payment-api/.env`:
```bash
cd payment-api
cp .env.example .env
```

Then edit `payment-api/.env` and add:
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
```

---

## 📦 Create Stripe Products

### Step 1: Go to Products Page
https://dashboard.stripe.com/test/products

### Step 2: Create Premium Plan

1. Click **"Add Product"**
2. Fill in:
   - **Name:** Premium
   - **Description:** 100 AI stock picks per month with advanced pattern detection
   - **Price:** $29.00
   - **Billing period:** Monthly
   - **Recurring:** Yes
3. Click **"Save product"**
4. **Copy the Price ID** (starts with `price_...`)
5. Add to `payment-api/.env`:
   ```bash
   STRIPE_PREMIUM_PRICE_ID=price_YOUR_PREMIUM_PRICE_ID
   ```

### Step 3: Create Pro Plan

1. Click **"Add Product"**
2. Fill in:
   - **Name:** Pro
   - **Description:** Unlimited AI stock picks with API access and priority support
   - **Price:** $99.00
   - **Billing period:** Monthly
   - **Recurring:** Yes
3. Click **"Save product"**
4. **Copy the Price ID** (starts with `price_...`)
5. Add to `payment-api/.env`:
   ```bash
   STRIPE_PRO_PRICE_ID=price_YOUR_PRO_PRICE_ID
   ```

### Step 4: Create Yearly Plans (Optional)

**Premium Yearly:**
- Name: Premium (Yearly)
- Price: $290.00
- Billing: Yearly
- Copy Price ID → `STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...`

**Pro Yearly:**
- Name: Pro (Yearly)
- Price: $990.00
- Billing: Yearly
- Copy Price ID → `STRIPE_PRO_YEARLY_PRICE_ID=price_...`

---

## 🎯 Complete payment-api/.env Template

After getting all your keys, your `payment-api/.env` should look like:

```bash
# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Stripe Price IDs
STRIPE_PREMIUM_PRICE_ID=price_YOUR_PREMIUM_MONTHLY_ID
STRIPE_PRO_PRICE_ID=price_YOUR_PRO_MONTHLY_ID
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_YOUR_PREMIUM_YEARLY_ID
STRIPE_PRO_YEARLY_PRICE_ID=price_YOUR_PRO_YEARLY_ID

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
```

---

## 🔔 Webhook Setup (Do After Deployment)

You'll set up webhooks after deploying to Railway:

1. Deploy payment-api to Railway first
2. Get your Railway URL (e.g., `https://payment-api.up.railway.app`)
3. Go to: https://dashboard.stripe.com/test/webhooks
4. Click **"Add endpoint"**
5. URL: `https://your-payment-api.up.railway.app/api/webhooks/stripe`
6. Select events:
   - ✅ checkout.session.completed
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ invoice.payment_succeeded
   - ✅ invoice.payment_failed
7. Click **"Add endpoint"**
8. Copy **Signing Secret** (starts with `whsec_...`)
9. Add to Railway environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
   ```

---

## ✅ Quick Checklist

- [x] Stripe publishable key added to frontend
- [ ] Get Stripe secret key from dashboard
- [ ] Add secret key to payment-api/.env
- [ ] Create Premium product in Stripe ($29/mo)
- [ ] Copy Premium price ID to payment-api/.env
- [ ] Create Pro product in Stripe ($99/mo)
- [ ] Copy Pro price ID to payment-api/.env
- [ ] Get Supabase URL and service role key
- [ ] Add Supabase credentials to both .env files
- [ ] Deploy payment-api to Railway
- [ ] Set up Stripe webhook with Railway URL
- [ ] Add webhook secret to Railway environment

---

## 🧪 Test Your Setup

Once everything is configured, test with Stripe test cards:

**Success:**
```
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
```

**Decline:**
```
Card: 4000 0000 0000 0002
```

---

## 📚 Need Help?

- Stripe Dashboard: https://dashboard.stripe.com/test
- Payment API Guide: `PAYMENT_API_GUIDE.md`
- Quick Start: `QUICK_START_PAYMENT.md`
- Railway Deployment: `RAILWAY_PAYMENT_DEPLOY.md`
