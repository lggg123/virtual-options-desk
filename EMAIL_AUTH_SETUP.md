# 📧 Supabase Email Authentication Setup Guide

## Overview

This guide will help you set up **email confirmation** for user signups in your Supabase project. Users will receive a confirmation email with a link to verify their account.

---

## Part 1: Configure Supabase Email Templates

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates** (in the left sidebar)

### Step 2: Configure Email Confirmation Template

Click on **"Confirm signup"** template and replace the content with this custom template:

```html
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px 20px;
        text-align: center;
      }
      .header h1 {
        color: #ffffff;
        margin: 0;
        font-size: 28px;
        font-weight: 600;
      }
      .content {
        padding: 40px 30px;
      }
      .content h2 {
        color: #333;
        font-size: 22px;
        margin-top: 0;
      }
      .content p {
        color: #666;
        font-size: 16px;
        line-height: 1.8;
      }
      .button {
        display: inline-block;
        padding: 16px 32px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 16px;
        margin: 20px 0;
        text-align: center;
      }
      .button:hover {
        opacity: 0.9;
      }
      .footer {
        background: #f8f9fa;
        padding: 30px;
        text-align: center;
        border-top: 1px solid #e9ecef;
      }
      .footer p {
        color: #6c757d;
        font-size: 14px;
        margin: 5px 0;
      }
      .security-note {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .security-note p {
        color: #856404;
        margin: 0;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🚀 AI Stock Desk</h1>
      </div>
      <div class="content">
        <h2>Welcome! Confirm Your Email</h2>
        <p>Thanks for signing up for AI Stock Desk! We're excited to have you on board.</p>
        <p>To get started with AI-powered stock picks, market sentiment analysis, and virtual options trading, please confirm your email address by clicking the button below:</p>
        
        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button">
            Confirm Email Address
          </a>
        </div>
        
        <p>Once confirmed, you'll get instant access to:</p>
        <ul>
          <li>✅ <strong>$100,000 in virtual trading funds</strong></li>
          <li>📊 <strong>AI Stock Picks</strong> - Daily recommendations</li>
          <li>📈 <strong>Market Sentiment Analysis</strong> - Real-time insights</li>
          <li>💹 <strong>Virtual Options Trading</strong> - Risk-free practice</li>
        </ul>
        
        <div class="security-note">
          <p><strong>⚠️ Security Notice:</strong> If you didn't create an account with AI Stock Desk, please ignore this email or contact support if you're concerned.</p>
        </div>
        
        <p style="font-size: 14px; color: #999; margin-top: 30px;">
          This link will expire in 24 hours. If you need a new confirmation link, please try signing up again.
        </p>
      </div>
      <div class="footer">
        <p><strong>AI Stock Desk</strong></p>
        <p>AI-powered stock analysis, sentiment tracking, and virtual options trading</p>
        <p style="margin-top: 15px;">
          <a href="{{ .SiteURL }}" style="color: #667eea; text-decoration: none;">Visit Dashboard</a> •
          <a href="{{ .SiteURL }}/pricing" style="color: #667eea; text-decoration: none;">View Pricing</a>
        </p>
      </div>
    </div>
  </body>
</html>
```

**Important Variables:**
- `{{ .ConfirmationURL }}` - Auto-generated confirmation link
- `{{ .SiteURL }}` - Your site URL (set in Auth Settings)

---

### Step 3: Configure Site URL (Required)

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL:
   ```
   https://your-domain.vercel.app
   ```
   (Or for local dev: `http://localhost:3000`)

3. Add **Redirect URLs** (comma-separated):
   ```
   https://your-domain.vercel.app/auth/callback,
   https://your-domain.vercel.app/dashboard,
   http://localhost:3000/auth/callback,
   http://localhost:3000/dashboard
   ```

---

### Step 4: Optional - Customize Other Email Templates

You can also customize these templates with similar styling:

**Magic Link Template:**
```html
<!-- Same header/footer as above -->
<div class="content">
  <h2>Your Magic Login Link</h2>
  <p>Click the button below to sign in to your AI Stock Desk account:</p>
  <div style="text-align: center;">
    <a href="{{ .ConfirmationURL }}" class="button">Sign In to Dashboard</a>
  </div>
  <p style="font-size: 14px; color: #999;">This link expires in 1 hour.</p>
</div>
```

**Password Reset Template:**
```html
<div class="content">
  <h2>Reset Your Password</h2>
  <p>You requested to reset your password for AI Stock Desk. Click the button below to set a new password:</p>
  <div style="text-align: center;">
    <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
  </div>
  <div class="security-note">
    <p><strong>⚠️ Security Notice:</strong> If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
  </div>
</div>
```

---

## Part 2: Create Email Confirmation Callback Page

This page handles the redirect after users click the confirmation link in their email.

### Create the file: `/frontend/src/app/auth/callback/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the hash fragment from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Check for errors in URL
        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || error);
          return;
        }

        // Verify this is an email confirmation
        if (type === 'signup' || type === 'email_change' || accessToken) {
          // Get the current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            throw sessionError;
          }

          if (session) {
            setStatus('success');
            // Wait a moment to show success message, then redirect
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          } else {
            // Try to set the session from the URL
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken!,
              refresh_token: hashParams.get('refresh_token') || ''
            });

            if (setSessionError) {
              throw setSessionError;
            }

            setStatus('success');
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          }
        } else {
          setStatus('error');
          setErrorMessage('Invalid confirmation link');
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    };

    handleEmailConfirmation();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Confirming Your Email...'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address'}
            {status === 'success' && 'Your account is now active'}
            {status === 'error' && 'There was a problem confirming your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  ✅ Your email has been confirmed! You now have access to:
                  <ul className="mt-2 space-y-1 text-left">
                    <li>• $100,000 in virtual trading funds</li>
                    <li>• AI Stock Picks</li>
                    <li>• Market Sentiment Analysis</li>
                    <li>• Virtual Options Trading</li>
                  </ul>
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Redirecting you to the dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <Alert variant="destructive">
                <AlertDescription>
                  {errorMessage || 'Unable to confirm your email. The link may be expired or invalid.'}
                </AlertDescription>
              </Alert>
              <div className="flex flex-col w-full gap-2">
                <Button asChild className="w-full">
                  <Link href="/signup">Try Signing Up Again</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Part 3: Update Supabase Auth Settings

### Enable Email Confirmations

1. Go to **Authentication** → **Providers** → **Email**
2. Make sure these are enabled:
   - ✅ **Enable email provider**
   - ✅ **Confirm email** (toggle this ON)
3. Click **Save**

### Configure Email Rate Limiting (Optional but Recommended)

1. Go to **Authentication** → **Rate Limits**
2. Set reasonable limits:
   - Email sends per hour: 10
   - SMS sends per hour: 5
3. This prevents abuse

---

## Part 4: Testing the Email Flow

### Test Signup Flow

1. **Go to signup page:**
   ```
   http://localhost:3000/signup
   ```

2. **Enter email and password, submit form**
   - Should see: "Check your email for a confirmation link"

3. **Check your email inbox**
   - You should receive the branded confirmation email
   - Subject: "Confirm Your Signup"

4. **Click "Confirm Email Address" button**
   - Redirects to: `/auth/callback`
   - Shows: "Email Confirmed!" with green checkmark
   - Auto-redirects to dashboard after 2 seconds

5. **Verify dashboard access**
   - Should be logged in
   - Should see $100,000 starting balance

### Test Error Cases

**Expired Link:**
- Wait 24 hours (or manually expire in Supabase)
- Click old confirmation link
- Should show error: "Invalid or expired confirmation link"
- Provides buttons to sign up again or login

**Invalid Link:**
- Try accessing `/auth/callback` directly
- Should show error message
- Provides navigation options

---

## Part 5: Database Architecture Clarification

### Current Setup (Correct ✅)

You have **TWO separate databases:**

```
┌─────────────────────────────────────────┐
│  SUPABASE DATABASE                      │
│  (Virtual Options Trading)              │
│                                         │
│  Tables:                                │
│  • auth.users (managed by Supabase)    │
│  • user_accounts (your virtual $$$)    │
│  • user_positions (options positions)  │
│  • user_trades (trade history)         │
│                                         │
│  Used by: Frontend Next.js app         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  PAYMENT API DATABASE                   │
│  (Stripe Subscriptions)                 │
│                                         │
│  Tables:                                │
│  • subscriptions                        │
│  • customers                            │
│  • payments                             │
│                                         │
│  Used by: Payment API (Fastify)        │
└─────────────────────────────────────────┘
```

**This is FINE and actually RECOMMENDED!** ✅

### Why Separate Databases is Good:

1. **Separation of Concerns:**
   - Virtual trading data separate from payment data
   - Payment API can be deployed independently
   - Easier to backup/restore specific data

2. **Security:**
   - Payment data isolated (PCI compliance)
   - Different access controls
   - Reduces attack surface

3. **Scalability:**
   - Can scale databases independently
   - Payment DB stays small (only subscription data)
   - Trading DB can grow with user activity

4. **Link Between Databases:**
   Both databases use the **same `user_id`** (from Supabase Auth):
   ```typescript
   // Supabase DB: user_accounts.user_id
   // Payment DB: subscriptions.user_id
   // Both reference the same Supabase Auth user
   ```

### Alternative (If You Want Single Database):

If you prefer everything in Supabase:

1. **Option A:** Add payment tables to Supabase
   ```sql
   CREATE TABLE subscriptions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     stripe_subscription_id TEXT,
     plan TEXT,
     status TEXT,
     current_period_end TIMESTAMP
   );
   ```

2. **Option B:** Keep current setup (recommended)
   - Keep payment data in Payment API's database
   - Keep trading data in Supabase
   - Use `user_id` as the link between them

**Recommendation:** Keep your current setup! It's cleaner and more maintainable.

---

## Summary

### ✅ What You Need to Do:

1. **In Supabase Dashboard:**
   - Copy/paste the email confirmation template
   - Set Site URL to your domain
   - Add redirect URLs
   - Enable "Confirm email" in Email provider settings

2. **In Your Codebase:**
   - Create `/frontend/src/app/auth/callback/page.tsx` (code provided above)
   - Commit and deploy

3. **Test:**
   - Sign up with a real email
   - Check inbox for confirmation email
   - Click link and verify redirect to dashboard

### ✅ Database Architecture:

Your current setup with **two separate databases is correct**:
- Supabase DB: Trading data, user accounts, positions
- Payment API DB: Subscriptions, Stripe data
- Linked by `user_id` from Supabase Auth

**No changes needed!** ✅

---

**Last Updated:** October 8, 2025  
**Status:** Ready to implement  
**Next Steps:** Copy email template to Supabase, create callback page, test signup flow
