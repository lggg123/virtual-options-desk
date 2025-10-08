# 🔧 Supabase URL Configuration - Quick Fix

## Problem
Email confirmation links are redirecting to `localhost` instead of your production domain `https://www.marketstockpick.com`.

## Solution
Update your Supabase Authentication settings to use the correct production URLs.

---

## Step-by-Step Fix

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your project

### 2. Update Site URL
1. Navigate to: **Authentication** → **URL Configuration**
2. Find **Site URL** field
3. Change from `http://localhost:3000` to:
   ```
   https://www.marketstockpick.com
   ```
4. Click **Save**

### 3. Update Redirect URLs
1. In the same **URL Configuration** section
2. Find **Redirect URLs** field
3. Add these URLs (comma-separated):
   ```
   https://www.marketstockpick.com/auth/callback,
   https://www.marketstockpick.com/dashboard,
   https://www.marketstockpick.com/login,
   https://www.marketstockpick.com/signup,
   http://localhost:3000/auth/callback,
   http://localhost:3000/dashboard,
   http://localhost:3000/login,
   http://localhost:3000/signup
   ```
4. Click **Save**

### 4. Verify Email Template Variables
The email templates use `{{ .ConfirmationURL }}` which automatically uses the Site URL you configured.

**No changes needed to email templates!** They will automatically use `https://www.marketstockpick.com` once you update the Site URL setting.

---

## What This Fixes

✅ **Before Fix:**
- Click email confirmation link
- Redirects to: `http://localhost:3000/auth/callback`
- ❌ Doesn't work in production

✅ **After Fix:**
- Click email confirmation link  
- Redirects to: `https://www.marketstockpick.com/auth/callback`
- ✅ Works in production!

---

## Environment Variables to Check

Make sure your frontend has these environment variables set correctly in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Test After Configuration

1. **Sign up with a real email:**
   ```
   https://www.marketstockpick.com/signup
   ```

2. **Check your email inbox**
   - Click the "Confirm Email Address" button

3. **Verify redirect:**
   - Should redirect to: `https://www.marketstockpick.com/auth/callback`
   - NOT `localhost`

4. **Verify dashboard access:**
   - Should auto-redirect to: `https://www.marketstockpick.com/dashboard`
   - Should be logged in
   - Should see $100,000 balance

---

## Common Issues

### Issue: Still redirecting to localhost
**Solution:** 
- Clear browser cache and cookies
- Wait 5 minutes for Supabase settings to propagate
- Try signing up with a new email address

### Issue: "Invalid redirect URL" error
**Solution:**
- Double-check the Redirect URLs list in Supabase
- Make sure there are no typos
- Ensure you clicked **Save** after adding URLs

### Issue: Email not arriving
**Solution:**
- Check spam/junk folder
- Verify email is enabled in Supabase (Authentication → Providers → Email)
- Check "Confirm email" toggle is ON

---

## Summary

**What to Change in Supabase:**
1. ✅ Site URL → `https://www.marketstockpick.com`
2. ✅ Redirect URLs → Add production URLs (see above)
3. ✅ Save changes

**What NOT to Change:**
- ❌ Email templates (they automatically use Site URL)
- ❌ Callback page code (already correct)
- ❌ Environment variables (if already set correctly)

---

**This fix takes 2 minutes and resolves the localhost redirect issue immediately!** ✅

**Last Updated:** October 8, 2025
