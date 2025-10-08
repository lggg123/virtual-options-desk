# Troubleshooting User Signup Issues

## Problem
Users can't sign up - getting "Database error saving new user" even though `user_accounts` table exists.

## Diagnostic Steps

### Step 1: Verify Tables Exist
Run this in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_accounts', 'user_positions', 'user_trades');
```

**Expected:** Should show all 3 tables.

---

### Step 2: Check Trigger is Working
Run this to verify the trigger exists:

```sql
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Expected:** Should show the trigger `on_auth_user_created` on `auth.users`.

---

### Step 3: Check Function Exists
```sql
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'create_user_account';
```

**Expected:** Should show `create_user_account` function with `SECURITY DEFINER`.

---

### Step 4: Test Trigger Manually
Try to insert a test user account manually:

```sql
-- First, check if you have any users without accounts
SELECT 
  u.id,
  u.email,
  u.created_at,
  ua.id as account_id
FROM auth.users u
LEFT JOIN user_accounts ua ON u.id = ua.user_id
ORDER BY u.created_at DESC
LIMIT 10;
```

If you see users without `account_id`, create accounts for them:

```sql
-- Create accounts for existing users who don't have one
INSERT INTO user_accounts (user_id, cash_balance, portfolio_value, total_pnl, total_pnl_percent)
SELECT u.id, 100000.00, 100000.00, 0.00, 0.00
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_accounts WHERE user_id = u.id
);
```

---

### Step 5: Check RLS Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_accounts';
```

**Expected:** Should show policies for SELECT and UPDATE.

---

### Step 6: Add Missing INSERT Policy for Service Role

The issue might be that RLS is blocking the trigger from inserting! Add this policy:

```sql
-- Allow service role and triggers to INSERT into user_accounts
CREATE POLICY "Service role can insert accounts" ON user_accounts
  FOR INSERT 
  WITH CHECK (true);
```

---

### Step 7: Grant Proper Permissions

Make sure the trigger function has proper permissions:

```sql
-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions on user_accounts table
GRANT ALL ON user_accounts TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON user_accounts TO authenticated;

-- Grant permissions on sequences (for UUID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
```

---

### Step 8: Test the Trigger Directly

Try creating a test entry in auth.users to see if trigger fires:

```sql
-- Check how many accounts exist
SELECT COUNT(*) FROM user_accounts;

-- Check how many users exist
SELECT COUNT(*) FROM auth.users;

-- If counts don't match, trigger isn't working
```

---

### Step 9: Recreate the Trigger (If needed)

If the trigger isn't working, drop and recreate it:

```sql
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_account();

-- Recreate function with better error handling
CREATE OR REPLACE FUNCTION create_user_account()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_accounts (user_id, cash_balance, portfolio_value, total_pnl, total_pnl_percent)
  VALUES (NEW.id, 100000.00, 100000.00, 0.00, 0.00);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_user_account trigger: %', SQLERRM;
    RETURN NEW; -- Don't block user creation even if account creation fails
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_account();
```

---

### Step 10: Check Supabase Logs

After recreating the trigger, try signing up and check Supabase logs for:
- Any error messages from the trigger
- Whether the INSERT into user_accounts happened
- Whether RLS blocked the insert

---

## Most Common Issues

1. **RLS Blocking Inserts**: The trigger runs with the service role, but RLS might be blocking it. Solution: Add the "Service role can insert accounts" policy.

2. **Missing Permissions**: The function needs SECURITY DEFINER and proper grants. Solution: Run the GRANT statements above.

3. **Trigger Not Firing**: The trigger might not be on the correct table. Solution: Verify it's on `auth.users`, not `public.users`.

4. **Duplicate User Attempts**: If a user already exists, trying to create another account will fail due to UNIQUE constraint on `user_id`. Solution: Check for existing accounts before inserting.

---

## Quick Fix Script

Run this complete script to fix all common issues:

```sql
-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cash_balance DECIMAL(15, 2) DEFAULT 100000.00 NOT NULL,
  portfolio_value DECIMAL(15, 2) DEFAULT 100000.00 NOT NULL,
  total_pnl DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  total_pnl_percent DECIMAL(8, 4) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies
DROP POLICY IF EXISTS "Users can view own account" ON user_accounts;
DROP POLICY IF EXISTS "Users can update own account" ON user_accounts;
DROP POLICY IF EXISTS "Service role can insert accounts" ON user_accounts;

-- 4. Create new policies
CREATE POLICY "Users can view own account" ON user_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own account" ON user_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- THIS IS THE KEY POLICY - allows trigger to insert
CREATE POLICY "Service role can insert accounts" ON user_accounts
  FOR INSERT WITH CHECK (true);

-- 5. Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_account();

CREATE OR REPLACE FUNCTION create_user_account()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_accounts (user_id, cash_balance, portfolio_value, total_pnl, total_pnl_percent)
  VALUES (NEW.id, 100000.00, 100000.00, 0.00, 0.00);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_user_account trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_account();

-- 6. Grant permissions
GRANT ALL ON user_accounts TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON user_accounts TO authenticated;

-- 7. Create accounts for existing users
INSERT INTO user_accounts (user_id, cash_balance, portfolio_value, total_pnl, total_pnl_percent)
SELECT u.id, 100000.00, 100000.00, 0.00, 0.00
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_accounts WHERE user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;
```

---

## Testing

After running the fix script, test signup:

1. Go to your signup page
2. Try creating a new user
3. Check Supabase logs immediately
4. If successful, verify the account was created:

```sql
SELECT u.email, ua.cash_balance, ua.created_at
FROM auth.users u
JOIN user_accounts ua ON u.id = ua.user_id
ORDER BY u.created_at DESC
LIMIT 5;
```

---

## If Still Failing

Check these:

1. **Environment Variables**: Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in your frontend
2. **API Route**: Check `/frontend/src/app/api/account/route.ts` is using the service role client
3. **Supabase Client**: Make sure you're using the admin client, not the regular client

The trigger should handle account creation automatically, but your API route also has fallback logic to create accounts if they don't exist.
