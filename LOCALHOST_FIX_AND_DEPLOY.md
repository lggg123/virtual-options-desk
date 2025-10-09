# 🚀 Localhost Fix & Deployment Guide

## ✅ Localhost Issue - FIXED!

### Problem
The dev server kept shutting down with error:
```
FATAL: An unexpected Turbopack error occurred
[TurbopackInternalError]: Next.js package not found
```

### Root Causes
1. **Missing node_modules** - Dependencies weren't installed in `/frontend`
2. **Turbopack crash** - Experimental Turbopack had issues finding Next.js

### Solution Applied
1. ✅ Installed dependencies: `npm install --prefix /workspaces/virtual-options-desk/frontend`
2. ✅ Updated dev script: Changed from `next dev --turbopack` to `next dev`
3. ✅ Added fallback: `npm run dev:turbo` still available if Turbopack is needed

### How to Run Locally Now
```bash
cd /workspaces/virtual-options-desk/frontend
npm run dev
```

Server will start at: **http://localhost:3000** ✓

---

## 🚢 Deployment Guide

### Prerequisites
Before deploying, ensure these environment variables are set in your deployment platform:

#### Frontend Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Payment API
PAYMENT_API_URL=https://your-payment-api.railway.app

# Stripe (for API routes)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### Payment API Environment Variables
```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## Option 1: Deploy to Vercel (Recommended for Frontend)

### Why Vercel?
- ✅ Built for Next.js (same team)
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Edge network CDN
- ✅ Free tier available

### Steps

1. **Install Vercel CLI** (if not installed)
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy Frontend**
```bash
cd /workspaces/virtual-options-desk/frontend
vercel
```

Follow prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N** (first time)
- What's your project's name? `virtual-options-desk`
- In which directory is your code located? `./`
- Want to override settings? **N**

4. **Set Environment Variables**
```bash
# One-time setup
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add PAYMENT_API_URL
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

5. **Deploy to Production**
```bash
vercel --prod
```

---

## Option 2: Deploy to Railway (Good for Full Stack)

### Why Railway?
- ✅ Can run frontend + backend together
- ✅ Automatic deployments from GitHub
- ✅ Built-in databases
- ✅ Simple pricing

### Steps

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login**
```bash
railway login
```

3. **Initialize Project**
```bash
cd /workspaces/virtual-options-desk
railway init
```

4. **Create Services**

You need 3 separate Railway services:

#### Service 1: Frontend (Next.js)
```bash
railway add
# Select: Empty Service
# Name: frontend
```

Set Root Directory: `/frontend`
Set Build Command: `npm run build`
Set Start Command: `npm start`

#### Service 2: Payment API
```bash
railway add
# Select: Empty Service  
# Name: payment-api
```

Set Root Directory: `/payment-api`

#### Service 3: Pattern Detection (Python/FastAPI)
```bash
railway add
# Select: Empty Service
# Name: pattern-detection
```

Uses existing `railway.toml` config

5. **Set Environment Variables**

For each service, go to Railway dashboard → Service → Variables:

**Frontend Variables**: (see Prerequisites section above)
**Payment API Variables**: (see Prerequisites section above)

6. **Deploy**
```bash
railway up
```

7. **Link Custom Domain** (optional)
- Go to Railway dashboard
- Select service → Settings → Networking
- Generate domain or add custom domain

---

## Option 3: Quick Deploy with Git Push

### Setup (One-Time)

1. **Vercel GitHub Integration**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import from GitHub: `lggg123/virtual-options-desk`
   - Root Directory: `frontend`
   - Add environment variables
   - Deploy

2. **Railway GitHub Integration**
   - Go to https://railway.app
   - New Project → Deploy from GitHub repo
   - Select `lggg123/virtual-options-desk`
   - Create 3 services as above
   - Add environment variables

### After Setup
Just push to GitHub and it auto-deploys! ✨

```bash
git add -A
git commit -m "Your changes"
git push origin main
```

---

## 🧪 Testing Deployment

### 1. Test Frontend
Visit: `https://your-domain.vercel.app`

Check:
- ✅ Homepage loads
- ✅ Can login with Supabase
- ✅ `/diagnose` page works
- ✅ Navigation menu appears

### 2. Test Payment API
Visit: `https://your-payment-api.railway.app/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-09T..."
}
```

### 3. Test Subscription Flow
1. Login to your deployed app
2. Go to `/pricing` page
3. Click "Subscribe Now"
4. Should redirect to Stripe checkout
5. Complete test payment
6. Verify subscription in Supabase dashboard

### 4. Debug Page
Visit: `https://your-domain.vercel.app/diagnose`

Click all three buttons to verify:
- ✅ Payment API is reachable
- ✅ Checkout endpoint works
- ✅ Environment variables are set

---

## 🔧 Troubleshooting Deployment

### Issue: Payment API not reachable
**Check:**
- Is `PAYMENT_API_URL` set correctly? (with https://)
- Is payment API service running on Railway?
- Check Railway logs: `railway logs --service payment-api`

### Issue: Stripe errors
**Check:**
- Using production keys (starts with `pk_live_` not `pk_test_`)
- Webhook secret matches Stripe dashboard
- Payment API has correct `STRIPE_SECRET_KEY`

### Issue: Auth not working
**Check:**
- Supabase URL and keys are correct
- Supabase service role key is set (not just anon key)
- Added your domain to Supabase Auth → URL Configuration → Redirect URLs

### Issue: Build fails
**Check:**
- All dependencies in package.json
- TypeScript errors: `npm run lint`
- Build locally first: `npm run build`

---

## 📊 Deployment Checklist

Before deploying to production:

- [ ] All environment variables documented
- [ ] Stripe keys changed from test to live mode
- [ ] Supabase redirect URLs include production domain
- [ ] Payment webhook configured in Stripe dashboard
- [ ] Test database populated (or migration scripts ready)
- [ ] Health check endpoints working
- [ ] Error tracking configured (Sentry, LogRocket, etc.)
- [ ] Domain DNS configured (if using custom domain)
- [ ] SSL certificate active (should be automatic)

---

## 🎯 Recommended Deployment Strategy

For this project:

1. **Frontend** → Vercel (best for Next.js)
2. **Payment API** → Railway (needs persistent server)
3. **Pattern Detection** → Railway (Python service)
4. **Database** → Supabase (already hosted)

This gives you:
- ✅ Fast frontend on edge network
- ✅ Reliable backend APIs
- ✅ Simple deployment workflow
- ✅ Cost-effective (free tiers available)

---

## 🚀 Quick Deploy Commands

```bash
# Deploy frontend to Vercel
cd frontend && vercel --prod

# Deploy payment API to Railway
cd payment-api && railway up

# Or deploy everything from root
railway up --service frontend
railway up --service payment-api
railway up --service pattern-detection
```

---

## 📝 Next Steps

1. ✅ Localhost is fixed - test it now!
2. Deploy to Vercel/Railway
3. Test `/diagnose` page on production
4. Test subscription flow end-to-end
5. Monitor logs for any errors
6. Set up custom domain (optional)

Good luck! 🎉
