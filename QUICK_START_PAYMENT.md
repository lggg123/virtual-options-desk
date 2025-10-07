# 🚀 Quick Start - Payment System

## Installation (2 minutes)

```bash
# Make installation script executable
chmod +x install-payment-system.sh

# Run installation
./install-payment-system.sh
```

## Manual Installation

```bash
# Payment API
cd payment-api && npm install

# Frontend
cd ../frontend && npm install lucide-react
```

---

## 🔑 Environment Setup

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
PAYMENT_API_URL=https://payment-api.up.railway.app
NEXT_PUBLIC_URL=https://your-app.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Payment API (.env)
```bash
PORT=3001
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

## 🎯 Stripe Setup (5 minutes)

### 1. Create Products
```
Dashboard → Products → Add Product

Premium:
  - Name: Premium
  - Price: $29/month
  - Copy Price ID

Pro:
  - Name: Pro
  - Price: $99/month
  - Copy Price ID
```

### 2. Setup Webhooks
```
Dashboard → Developers → Webhooks → Add Endpoint

URL: https://your-payment-api.up.railway.app/api/webhooks/stripe

Events:
  ✓ checkout.session.completed
  ✓ customer.subscription.updated
  ✓ customer.subscription.deleted
  ✓ invoice.payment_succeeded
  ✓ invoice.payment_failed

Copy Signing Secret → STRIPE_WEBHOOK_SECRET
```

---

## 🗄️ Supabase Setup (2 minutes)

```sql
-- Go to SQL Editor and run:
-- Copy/paste from database/subscriptions_schema.sql

-- Verify tables created:
SELECT * FROM subscriptions LIMIT 1;
SELECT * FROM usage_tracking LIMIT 1;
```

---

## 🚂 Railway Deployment (5 minutes)

```bash
cd payment-api
railway login
railway init
railway link

# Set all environment variables
railway variables set STRIPE_SECRET_KEY=sk_test_...
railway variables set SUPABASE_URL=https://...
# ... (see RAILWAY_PAYMENT_DEPLOY.md for full list)

# Deploy
railway up

# Get public URL
railway domain
```

---

## ✅ Test Stripe Checkout

### Test Card Numbers
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155

Expiry: Any future date (12/34)
CVC: Any 3 digits (123)
```

### Test Flow
1. Go to `/pricing`
2. Click "Subscribe Now"
3. Use test card above
4. Complete checkout
5. Should redirect to `/success`
6. Check Supabase for subscription entry

---

## 🧪 API Testing

```bash
# Health check
curl https://payment-api.up.railway.app/health

# Get plans
curl https://payment-api.up.railway.app/api/plans

# Get subscription (with auth)
curl https://your-app.vercel.app/api/payment/subscription \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## 📁 File Locations

```
payment-api/
  src/index.ts          → Main API code
  package.json          → Dependencies
  .env                  → Environment vars

frontend/src/app/
  pricing/page.tsx      → Pricing page
  success/page.tsx      → Success page
  api/payment/          → API routes

python/
  subscription_middleware.py  → Subscription enforcement

database/
  subscriptions_schema.sql    → Database schema
```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Module not found | `cd frontend && npm install lucide-react` |
| Webhook failed | Check STRIPE_WEBHOOK_SECRET matches |
| Auth error | User must be logged in via Supabase |
| DB connection | Verify SUPABASE_SERVICE_ROLE_KEY |

---

## 📚 Full Documentation

- **SETUP_COMPLETE.md** - Complete setup guide
- **PAYMENT_API_GUIDE.md** - API documentation
- **RAILWAY_PAYMENT_DEPLOY.md** - Deployment guide
- **INTEGRATION_GUIDE.md** - Integration examples

---

## 🎉 Quick Win

**Get running in 15 minutes:**
1. Run `./install-payment-system.sh` (2 min)
2. Set up .env files (2 min)
3. Create Stripe products (3 min)
4. Deploy to Railway (5 min)
5. Set up Supabase schema (2 min)
6. Test checkout flow (1 min)

Done! 🚀
