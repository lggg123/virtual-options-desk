# Get Supabase Service Role Key

## Why You Need This Key

The **anon key** you have is for **client-side** use (frontend apps). It respects Row Level Security (RLS) policies.

The **service role key** is for **server-side** use (backend APIs). It **bypasses RLS** and is required for:
- Writing subscription data from Stripe webhooks
- Admin operations on the database
- Server-to-server API calls

## How to Get Your Service Role Key

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project: `qcwtkyxvejcogbhbauey`

### Step 2: Navigate to API Settings
1. Click **Settings** (gear icon in sidebar)
2. Click **API** in the left menu

### Step 3: Copy Service Role Key
1. Scroll to **Project API keys** section
2. Find the key labeled **`service_role`** (marked as "secret" 🔒)
3. Click the **Copy** button or **Reveal** then copy
4. It will start with `eyJ...` (JWT token)

### Step 4: Update payment-api/.env
Replace the placeholder in `payment-api/.env`:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_actual_service_role_key_here
```

## Security Warning ⚠️

- **NEVER** commit the service role key to git
- **NEVER** expose it in frontend code
- **ONLY** use it in server-side code (payment-api)
- Add `*.env` to `.gitignore` (already done)

## Current Status

✅ SUPABASE_URL configured
✅ Anon key saved (for frontend use)
❌ Service role key needed (for payment-api)

After you add the service role key, you can start the payment API:

```bash
cd payment-api
npm run dev
```

It should start on port 3001 without Supabase connection errors.
