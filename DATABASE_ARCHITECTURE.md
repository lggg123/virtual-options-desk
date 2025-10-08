# 🗄️ Database Architecture Overview

## Current Setup (Two Databases)

Your application uses **TWO separate databases**, which is the **correct and recommended approach**:

```
┌──────────────────────────────────────────────────────────────┐
│                    YOUR APPLICATION                           │
│                                                               │
│  ┌─────────────────────┐         ┌─────────────────────┐   │
│  │   Next.js Frontend  │         │   Payment API       │   │
│  │   (Vercel)          │         │   (Railway)         │   │
│  │                     │         │                     │   │
│  │  • Dashboard        │         │  • Stripe Checkout  │   │
│  │  • Trading          │         │  • Webhooks         │   │
│  │  • Portfolio        │         │  • Subscriptions    │   │
│  └──────────┬──────────┘         └──────────┬──────────┘   │
│             │                               │               │
└─────────────┼───────────────────────────────┼───────────────┘
              │                               │
              │                               │
              ▼                               ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│  SUPABASE DATABASE           │  │  PAYMENT API DATABASE        │
│  (PostgreSQL)                │  │  (Separate PostgreSQL)       │
│                              │  │                              │
│  auth.users ─────────────────┼──┼─► user_id (link)            │
│  ├─ id (UUID)                │  │                              │
│  ├─ email                    │  │  subscriptions               │
│  ├─ email_confirmed_at       │  │  ├─ id                       │
│  └─ created_at               │  │  ├─ user_id (UUID) ◄───┐    │
│                              │  │  ├─ stripe_subscription_id   │
│  user_accounts               │  │  ├─ plan (premium/pro)       │
│  ├─ id                       │  │  ├─ status (active/...)      │
│  ├─ user_id (UUID) ◄─────────┼──┼──┘                           │
│  ├─ cash_balance ($100k)     │  │                              │
│  ├─ portfolio_value          │  │  customers                   │
│  ├─ total_pnl                │  │  ├─ stripe_customer_id       │
│  └─ total_pnl_percent        │  │  ├─ user_id (UUID)           │
│                              │  │  └─ email                    │
│  user_positions              │  │                              │
│  ├─ id                       │  │  payments                    │
│  ├─ user_id (UUID)           │  │  ├─ id                       │
│  ├─ symbol (AAPL, TSLA)      │  │  ├─ user_id (UUID)           │
│  ├─ type (Call/Put)          │  │  ├─ amount                   │
│  ├─ strike                   │  │  ├─ status                   │
│  ├─ expiry                   │  │  └─ created_at               │
│  ├─ quantity                 │  │                              │
│  └─ Greeks (delta, theta...) │  └──────────────────────────────┘
│                              │
│  user_trades                 │
│  ├─ id                       │
│  ├─ user_id (UUID)           │
│  ├─ symbol                   │
│  ├─ action (Buy/Sell)        │
│  ├─ price                    │
│  └─ created_at               │
│                              │
└──────────────────────────────┘
```

---

## Why Two Databases? (Advantages)

### ✅ **1. Separation of Concerns**

```
Trading Data                    Payment Data
   ↓                               ↓
Supabase DB                    Payment API DB
   ↓                               ↓
Can change independently       Can change independently
```

**Benefits:**
- Virtual trading logic separate from payment logic
- Easier to maintain and debug
- Clear boundaries between services

---

### ✅ **2. Security & Compliance**

```
┌─────────────────────────────┐
│   Supabase DB (Trading)     │
│                             │
│   Security Level: NORMAL    │
│   • Row Level Security      │
│   • User data isolation     │
│   • Public read (prices)    │
└─────────────────────────────┘

┌─────────────────────────────┐
│   Payment DB (Billing)      │
│                             │
│   Security Level: HIGH      │
│   • PCI Compliance          │
│   • Stripe data only        │
│   • No public access        │
│   • Encrypted at rest       │
└─────────────────────────────┘
```

**Benefits:**
- Payment data isolated (PCI DSS compliance)
- Different access controls
- Reduced attack surface

---

### ✅ **3. Scalability**

```
User Growth:
├─ Trading DB grows FAST (positions, trades, prices)
└─ Payment DB grows SLOWLY (only subscriptions)

Scaling Strategy:
├─ Scale Trading DB horizontally (more storage)
└─ Payment DB stays small (minimal resources)
```

**Benefits:**
- Independent scaling
- Cost optimization
- Better performance

---

### ✅ **4. Backup & Recovery**

```
Disaster Recovery:
├─ Trading DB: Restore to 5 min ago (frequent backups)
└─ Payment DB: Restore to 1 hour ago (less frequent)

Data Loss:
├─ Trading data lost? → Users retry trades
└─ Payment data lost? → CRITICAL (need frequent backups)
```

**Benefits:**
- Different backup strategies
- Faster recovery times
- Risk mitigation

---

## How They Connect (The Link)

### Common User ID (UUID from Supabase Auth)

```typescript
// When user signs up:
const { data: { user } } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// user.id is a UUID: "a1b2c3d4-e5f6-..."

// Stored in BOTH databases:
// 1. Supabase DB: user_accounts.user_id = "a1b2c3d4-e5f6-..."
// 2. Payment DB: subscriptions.user_id = "a1b2c3d4-e5f6-..."
```

### Example: Checking User's Subscription + Portfolio

```typescript
// Frontend calls two APIs:

// 1. Get trading data (Supabase)
const account = await fetch('/api/account');
// Returns: { cash_balance: 100000, portfolio_value: 100000 }

// 2. Get subscription (Payment API)
const subscription = await fetch('/api/payment/subscription');
// Returns: { plan: 'premium', status: 'active' }

// Both use the SAME user_id internally!
```

---

## Data Flow Example: New User Signup

```
1. User submits signup form
   ↓
2. Supabase Auth creates user
   ├─ Generates: user_id = "abc-123"
   ├─ Stores: auth.users table
   └─ Sends: confirmation email
   ↓
3. User clicks confirmation link
   ↓
4. Trigger fires in Supabase
   ├─ Creates: user_accounts record
   ├─ Sets: cash_balance = 100000
   └─ Sets: user_id = "abc-123"
   ↓
5. User subscribes to Premium
   ↓
6. Payment API receives webhook
   ├─ Creates: subscriptions record
   ├─ Sets: user_id = "abc-123"
   └─ Sets: plan = "premium"
   ↓
7. Dashboard loads
   ├─ Fetches: account data (Supabase)
   └─ Fetches: subscription data (Payment API)
   ↓
8. Shows unified view:
   "Premium Plan • $100,000 Balance"
```

---

## Alternative: Single Database (Not Recommended)

If you wanted everything in Supabase:

```
┌──────────────────────────────────────┐
│  SUPABASE DATABASE (Everything)      │
│                                      │
│  auth.users                          │
│  user_accounts                       │
│  user_positions                      │
│  user_trades                         │
│  subscriptions ← Added               │
│  customers ← Added                   │
│  payments ← Added                    │
│                                      │
│  ⚠️ Issues:                          │
│  • Payment API needs Supabase client │
│  • Mixed concerns in one DB          │
│  • Harder to isolate payment data   │
│  • More complex RLS policies        │
└──────────────────────────────────────┘
```

**Why NOT to do this:**
- ❌ Payment API becomes dependent on Supabase
- ❌ Harder to switch payment providers later
- ❌ More complex security model
- ❌ Payment data mixed with trading data

---

## Your Current Setup: Perfect! ✅

```
✅ Two separate databases
✅ Linked by user_id (UUID)
✅ Clean separation of concerns
✅ Independent scaling
✅ Better security
✅ Easier maintenance

DON'T CHANGE ANYTHING!
```

---

## Environment Variables Summary

### Frontend (.env.local)
```bash
# Supabase (Trading Database)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Payment API
PAYMENT_API_URL=https://payment-api.railway.app
NEXT_PUBLIC_URL=https://your-app.vercel.app
```

### Payment API (.env)
```bash
# Payment Database (Separate)
DATABASE_URL=postgresql://user:pass@host/payment_db

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (for auth verification only)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Summary

### Your Architecture ✅

```
Frontend (Next.js)
    ↓
    ├─→ Supabase DB (Trading)
    │   • User accounts
    │   • Positions
    │   • Trades
    │
    └─→ Payment API → Payment DB (Billing)
        • Subscriptions
        • Stripe data
```

### What Links Them? 🔗

```
user_id (UUID from Supabase Auth)
```

### Is This Good? 👍

**YES! This is industry best practice:**
- Used by: Stripe, AWS, Google Cloud, Microsoft
- Pattern: Microservices with separate data stores
- Result: Scalable, secure, maintainable

**Keep your current setup!** 🎉

---

**Last Updated:** October 8, 2025  
**Status:** ✅ Architecture confirmed and documented  
**Recommendation:** No changes needed to database setup
