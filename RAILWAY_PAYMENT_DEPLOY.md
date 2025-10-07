# 🚂 Railway Payment API Deployment Guide

## Quick Deploy Steps

### 1. Create New Railway Service

**Option A: Railway Dashboard**
```
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select: lggg123/virtual-options-desk
4. Click "Add Service" → "GitHub Repo"
```

**Option B: Railway CLI**
```bash
cd /workspaces/virtual-options-desk/payment-api
railway login
railway init
railway link
```

### 2. Configure Service Settings

**In Railway Dashboard:**

**Settings → General**
- **Service Name:** `payment-api`
- **Root Directory:** `payment-api`
- **Watch Paths:** `/payment-api/**`

**Settings → Build**
- **Builder:** Dockerfile
- **Dockerfile Path:** `Dockerfile` (automatically detected)

**Settings → Deploy**
- **Start Command:** (leave empty - uses Dockerfile CMD)
- **Healthcheck Path:** `/health`
- **Healthcheck Timeout:** 10s

### 3. Add Environment Variables

**Settings → Variables**

Click "New Variable" and add each of these:

```bash
# Server Config
PORT=8080
NODE_ENV=production

# Stripe Keys (Get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# Stripe Price IDs (Create products first, then copy price IDs)
STRIPE_PREMIUM_PRICE_ID=price_1234567890
STRIPE_PRO_PRICE_ID=price_0987654321
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_1111111111
STRIPE_PRO_YEARLY_PRICE_ID=price_2222222222

# Supabase (Get from https://supabase.com/dashboard/project/_/settings/api)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi...

# CORS (Add your frontend URL)
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

**⚠️ IMPORTANT: Use TEST keys for initial testing**
```bash
# For testing, use test keys first:
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_TEST_SECRET
STRIPE_PREMIUM_PRICE_ID=price_test_12345
STRIPE_PRO_PRICE_ID=price_test_67890
```

### 4. Deploy

**Automatic Deploy:**
- Railway auto-deploys when you push to GitHub main branch
- Check "Deployments" tab for progress

**Manual Deploy:**
```bash
railway up
```

### 5. Get Your Public URL

**Settings → Networking**
- Click "Generate Domain"
- You'll get a URL like: `https://payment-api-production-xxxx.up.railway.app`
- Copy this URL - you'll need it for Stripe webhooks and frontend

### 6. Test Deployment

```bash
# Test health endpoint
curl https://payment-api-production-xxxx.up.railway.app/health

# Expected response:
# {"status":"healthy","service":"Payment API","version":"1.0.0"}
```

---

## 🎯 Create Stripe Products & Prices

### Step 1: Go to Stripe Dashboard
https://dashboard.stripe.com/test/products

### Step 2: Create Premium Monthly Plan

1. Click **"Add Product"**
2. **Product Information:**
   - Name: `Premium`
   - Description: `100 AI stock picks per month with advanced pattern detection`
3. **Pricing:**
   - Price: `$29.00`
   - Billing period: `Monthly`
   - Payment type: `Recurring`
4. Click **"Save product"**
5. **Copy the Price ID** (starts with `price_`) → Save this as `STRIPE_PREMIUM_PRICE_ID`

### Step 3: Create Pro Monthly Plan

1. Click **"Add Product"**
2. **Product Information:**
   - Name: `Pro`
   - Description: `Unlimited AI stock picks with API access and priority support`
3. **Pricing:**
   - Price: `$99.00`
   - Billing period: `Monthly`
   - Payment type: `Recurring`
4. Click **"Save product"**
5. **Copy the Price ID** → Save this as `STRIPE_PRO_PRICE_ID`

### Step 4: Create Yearly Plans (Optional)

**Premium Yearly:**
- Name: `Premium (Yearly - Save 2 months!)`
- Price: `$290.00` (instead of $348)
- Billing period: `Yearly`
- Copy Price ID → `STRIPE_PREMIUM_YEARLY_PRICE_ID`

**Pro Yearly:**
- Name: `Pro (Yearly - Save 2 months!)`
- Price: `$990.00` (instead of $1,188)
- Billing period: `Yearly`
- Copy Price ID → `STRIPE_PRO_YEARLY_PRICE_ID`

### Step 5: Update Railway Variables

Go back to Railway → Settings → Variables

Update these with your actual Stripe Price IDs:
```bash
STRIPE_PREMIUM_PRICE_ID=price_YOUR_ACTUAL_ID_HERE
STRIPE_PRO_PRICE_ID=price_YOUR_ACTUAL_ID_HERE
```

---

## 🔔 Configure Stripe Webhooks

### Step 1: Get Your Railway URL
From Railway Networking settings, copy your URL:
```
https://payment-api-production-xxxx.up.railway.app
```

### Step 2: Create Webhook in Stripe

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL:**
   ```
   https://payment-api-production-xxxx.up.railway.app/api/webhooks/stripe
   ```
4. **Events to send:**
   - Click "Select events"
   - Select these 5 events:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_succeeded`
     - ✅ `invoice.payment_failed`
5. Click **"Add endpoint"**

### Step 3: Get Webhook Signing Secret

1. Click on your newly created webhook endpoint
2. Click **"Reveal signing secret"**
3. Copy the secret (starts with `whsec_`)
4. Go to Railway → Settings → Variables
5. Update `STRIPE_WEBHOOK_SECRET` with this value

### Step 4: Test Webhook

1. In Stripe Dashboard, click "Send test webhook"
2. Select `checkout.session.completed`
3. Click "Send test webhook"
4. Check Railway logs to see if webhook was received:
   ```bash
   railway logs --service payment-api
   ```

---

## 🧪 Testing Your Deployment

### 1. Test Health Endpoint
```bash
curl https://your-payment-api.up.railway.app/health
```

### 2. Test Get Plans
```bash
curl https://your-payment-api.up.railway.app/api/plans
```

### 3. Test Checkout Creation
```bash
curl -X POST https://your-payment-api.up.railway.app/api/checkout/create \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "premium",
    "userId": "test-user-123",
    "successUrl": "https://your-app.com/success",
    "cancelUrl": "https://your-app.com/pricing"
  }'
```

### 4. Test Subscription Status
```bash
curl https://your-payment-api.up.railway.app/api/subscription/test-user-123
```

---

## 📊 Monitoring

### Check Logs
```bash
# Real-time logs
railway logs --service payment-api --follow

# Last 100 lines
railway logs --service payment-api --tail 100
```

### Monitor Metrics in Railway Dashboard
- **Deployments:** Build and deploy history
- **Metrics:** CPU, Memory, Network usage
- **Logs:** Application logs and errors

### Check Stripe Dashboard
- **Payments:** Monitor successful transactions
- **Customers:** See new subscribers
- **Webhooks:** Check webhook delivery status (should show 200 OK)

---

## 🔄 Update Environment Variables After Deployment

Once deployed, you'll need to update your frontend and other services:

### Frontend (Next.js on Vercel)
Add to Vercel environment variables:
```bash
PAYMENT_API_URL=https://payment-api-production-xxxx.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
```

### Pattern Detection API (Railway)
Add to Pattern Detection service:
```bash
PAYMENT_API_URL=https://payment-api-production-xxxx.up.railway.app
```

### ML Screening API (Railway)
Add to ML Screening service:
```bash
PAYMENT_API_URL=https://payment-api-production-xxxx.up.railway.app
```

---

## 🚨 Troubleshooting

### "Failed to fetch" errors
- Check CORS: Make sure your frontend URL is in `ALLOWED_ORIGINS`
- Verify Railway service is running (check Deployments tab)

### "Invalid Stripe signature"
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check webhook endpoint URL is correct

### "Supabase connection failed"
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check if subscriptions table exists (run schema from PAYMENT_API_GUIDE.md)

### Build failures
- Check Railway logs for error details
- Verify `package.json` has all dependencies
- Ensure Dockerfile is in payment-api directory

### Port binding errors
- Railway automatically sets PORT=8080
- Don't hardcode port in code (uses process.env.PORT)

---

## ✅ Deployment Checklist

- [ ] Railway service created with root directory `payment-api`
- [ ] All environment variables added (especially Stripe keys)
- [ ] Stripe products created (Premium + Pro)
- [ ] Price IDs copied to Railway variables
- [ ] Public domain generated in Railway
- [ ] Stripe webhook endpoint created with Railway URL
- [ ] Webhook signing secret copied to Railway
- [ ] Health endpoint returns 200 OK
- [ ] Supabase subscriptions schema deployed
- [ ] Test checkout flow with Stripe test card
- [ ] Frontend updated with payment API URL

---

## 🎉 Next Steps After Deployment

1. **Switch to Live Stripe Keys** (when ready for production):
   - Update `STRIPE_SECRET_KEY` to `sk_live_...`
   - Update `STRIPE_WEBHOOK_SECRET` to live webhook secret
   - Create live products in Stripe (not test mode)

2. **Add Frontend Integration**:
   - Follow examples in PAYMENT_API_GUIDE.md
   - Create pricing page component
   - Add subscription status checks

3. **Enable Subscription Enforcement**:
   - Add middleware to ML/Pattern APIs
   - Check user subscription before allowing premium features

4. **Monitor and Optimize**:
   - Watch Stripe Dashboard for subscriptions
   - Monitor Railway logs for errors
   - Track subscription conversion rates

---

Need help? Check:
- Railway logs: `railway logs --service payment-api`
- Stripe webhook logs: https://dashboard.stripe.com/webhooks
- Payment API Guide: PAYMENT_API_GUIDE.md
