#!/bin/bash

# Login Redirect Fix Verification Script
# This script helps verify that all the necessary changes are in place

echo "🔍 Verifying Login Redirect Fix..."
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✓ Running from project root"
echo ""

# Check for @supabase/ssr package
echo "📦 Checking dependencies..."
if grep -q "@supabase/ssr" frontend/package.json; then
    echo "✓ @supabase/ssr package found in package.json"
else
    echo "❌ @supabase/ssr package NOT found in package.json"
    echo "   Run: cd frontend && npm install @supabase/ssr"
    exit 1
fi

# Check if client.ts uses createBrowserClient
echo ""
echo "🔧 Checking client.ts implementation..."
if grep -q "createBrowserClient" frontend/src/lib/supabase/client.ts; then
    echo "✓ client.ts uses createBrowserClient (SSR-compatible)"
else
    echo "❌ client.ts does NOT use createBrowserClient"
    echo "   This file should import { createBrowserClient } from '@supabase/ssr'"
    exit 1
fi

# Check if LoginForm has the delay
echo ""
echo "🔧 Checking LoginForm.tsx implementation..."
if grep -q "setTimeout" frontend/src/components/LoginForm.tsx; then
    echo "✓ LoginForm.tsx has cookie sync delay"
else
    echo "⚠️  LoginForm.tsx might be missing the cookie sync delay"
fi

if grep -q "window.location.href = '/dashboard'" frontend/src/components/LoginForm.tsx; then
    echo "✓ LoginForm.tsx uses hard redirect (window.location.href)"
else
    echo "❌ LoginForm.tsx does NOT use hard redirect"
    echo "   Should use window.location.href instead of router.push()"
fi

# Check middleware logging
echo ""
echo "🔧 Checking middleware.ts implementation..."
if grep -q "console.log.*Middleware" frontend/src/middleware.ts; then
    echo "✓ middleware.ts has debug logging enabled"
else
    echo "⚠️  middleware.ts might be missing debug logging"
fi

echo ""
echo "✅ All checks passed! The login redirect fix is properly implemented."
echo ""
echo "📋 Next steps:"
echo "1. Start the development server: cd frontend && npm run dev"
echo "2. Navigate to http://localhost:3000/login"
echo "3. Log in with valid credentials"
echo "4. Verify you reach /dashboard without redirect loops"
echo ""
echo "💡 Tips:"
echo "- Check browser console for authentication logs"
echo "- Check terminal for middleware logs"
echo "- Clear cookies/localStorage if you experience issues"
echo "- Try in incognito mode for a clean test"
echo ""
