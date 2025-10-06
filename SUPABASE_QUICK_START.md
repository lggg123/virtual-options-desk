# 🔐 Supabase Authentication Setup - Quick Start

## ⚡ 10-Minute Setup

### Step 1: Create Supabase Project (2 min)

1. **Go to**: https://supabase.com/dashboard
2. **Click**: "New Project"
3. **Fill in**:
   - Name: `virtual-options-desk`
   - Password: *(strong password - save it!)*
   - Region: Closest to you
4. **Wait**: ~2 minutes for provisioning

### Step 2: Run Database Schemas (5 min)

#### a) Enable UUID Extension
SQL Editor → New Query:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
Click **Run**

#### b) Create Auth Tables
1. **Copy all of**: `database/supabase_auth_schema.sql`
2. **Paste into**: SQL Editor → New Query
3. **Click**: Run

✅ Creates:
- User profiles
- Portfolios ($100k starting balance)
- Positions (stocks & options)
- Trades history
- Watchlists
- Price alerts
- Auto-signup triggers

#### c) Optional: Market Data Tables
1. **Copy all of**: `database/supabase_schema.sql`
2. **Paste into**: SQL Editor → New Query  
3. **Click**: Run

✅ Creates ML stock picks & pattern detection tables

### Step 3: Get API Credentials (1 min)

Settings → API → Copy these:

```
Project URL: https://xxxxx.supabase.co
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Add to Environment Variables (2 min)

**Local (`frontend/.env.local`)**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

**Vercel (Dashboard → Settings → Environment Variables)**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Step 5: Test It! (2 min)

1. **Signup**: http://localhost:3000/signup
2. **Enter**: email & password
3. **Check**: Supabase → Authentication → Users
4. **Check**: Table Editor → `profiles` (auto-created!)
5. **Check**: Table Editor → `portfolios` ($100k balance!)
6. **Login**: http://localhost:3000/login
7. ✅ **Success**: Redirected to `/dashboard`

## What Just Happened?

When you signed up:
1. ✅ User created in `auth.users`
2. ✅ Profile auto-created in `profiles`
3. ✅ Default portfolio created with $100k
4. ✅ Row Level Security enabled (you only see your data)

## Quick Verification

```sql
-- See your profile
SELECT * FROM profiles;

-- See your portfolio  
SELECT * FROM portfolios;

-- Check portfolio summary
SELECT * FROM user_portfolio_summary;
```

## Troubleshooting

**❌ "relation 'profiles' does not exist"**
→ Run `supabase_auth_schema.sql` in SQL Editor

**❌ No profile after signup**
→ Check SQL Editor for errors, trigger may have failed

**❌ Can't login**
→ Authentication → Providers → Ensure Email is enabled

**❌ RLS policy violation**
→ Make sure you're logged in (auth.uid() must exist)

## Database Tables Created

**User Management**:
- `profiles` - User profile data
- `portfolios` - Multiple portfolios per user ($100k default)

**Trading**:
- `positions` - Current stock/options positions
- `trades` - Trade history with P&L

**Tools**:
- `watchlists` + `watchlist_items` - Track stocks
- `price_alerts` - Price notifications

**Market Data** (optional):
- `monthly_screens` - ML stock picks
- `stock_picks` - Top recommendations
- `candlestick_patterns` - Pattern detection

## Security

🔒 **Row Level Security (RLS)**:
- ✅ Users only see their own data
- ✅ No cross-user data access
- ✅ Service role bypasses RLS (backend only!)

🔑 **API Keys**:
- **anon key**: Frontend (safe to expose)
- **service_role key**: Backend only (NEVER expose!)

## Ready to Deploy!

✅ Database configured  
✅ Authentication working  
✅ RLS protecting data  
✅ Auto-signup triggers active  

**Now**: Deploy to Vercel and add same env vars!

---

**Files Created**:
- `database/supabase_auth_schema.sql` - Run this for authentication
- `database/supabase_schema.sql` - Run this for market data (optional)

**Total Time**: ~10 minutes 🚀
