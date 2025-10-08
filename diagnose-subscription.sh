#!/bin/bash

# Quick diagnostic script for subscription button issue
echo "🔍 Subscription System Diagnostic"
echo "=================================="
echo ""

# Check if payment API is running
echo "1. Checking if payment API is running..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "   ✅ Payment API is running on port 3001"
    echo ""
    echo "   Payment API Status:"
    curl -s http://localhost:3001/ | head -20
    echo ""
else
    echo "   ❌ Payment API is NOT running on port 3001"
    echo "   → Start it with: cd payment-api && npm run dev"
    echo "   → Or start all services: bun run dev"
    echo ""
fi

# Check if frontend is running
echo "2. Checking if frontend is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running on port 3000"
else
    echo "   ❌ Frontend is NOT running on port 3000"
    echo "   → Start it with: cd frontend && bun run dev"
fi
echo ""

# Check for .env file in payment-api
echo "3. Checking payment API configuration..."
if [ -f "payment-api/.env" ]; then
    echo "   ✅ payment-api/.env file exists"
    
    # Check for required variables (without showing values)
    MISSING_VARS=()
    
    if ! grep -q "^STRIPE_SECRET_KEY=" payment-api/.env; then
        MISSING_VARS+=("STRIPE_SECRET_KEY")
    fi
    
    if ! grep -q "^STRIPE_PREMIUM_PRICE_ID=" payment-api/.env; then
        MISSING_VARS+=("STRIPE_PREMIUM_PRICE_ID")
    fi
    
    if ! grep -q "^STRIPE_PRO_PRICE_ID=" payment-api/.env; then
        MISSING_VARS+=("STRIPE_PRO_PRICE_ID")
    fi
    
    if ! grep -q "^SUPABASE_URL=" payment-api/.env; then
        MISSING_VARS+=("SUPABASE_URL")
    fi
    
    if ! grep -q "^SUPABASE_SERVICE_ROLE_KEY=" payment-api/.env; then
        MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY")
    fi
    
    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        echo "   ✅ All required environment variables are set"
    else
        echo "   ⚠️  Missing or empty variables:"
        for var in "${MISSING_VARS[@]}"; do
            echo "      - $var"
        done
        echo "   → Edit payment-api/.env to add these"
    fi
else
    echo "   ❌ payment-api/.env file not found"
    echo "   → Run: ./setup-payment.sh"
fi
echo ""

# Check Node.js version
echo "4. Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js is installed: $NODE_VERSION"
    
    # Extract major version
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 20 ]; then
        echo "   ⚠️  Warning: Node.js 20+ is recommended (you have $NODE_VERSION)"
    fi
else
    echo "   ❌ Node.js is not installed"
fi
echo ""

# Summary
echo "=================================="
echo "Summary:"
echo ""

# Count issues
ISSUES=0

if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    ISSUES=$((ISSUES + 1))
    echo "❌ Payment API is not running"
fi

if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    ISSUES=$((ISSUES + 1))
    echo "❌ Frontend is not running"
fi

if [ ! -f "payment-api/.env" ]; then
    ISSUES=$((ISSUES + 1))
    echo "❌ Payment API environment not configured"
fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ All systems appear to be operational!"
    echo ""
    echo "If the subscription button still doesn't work:"
    echo "1. Check browser console for errors"
    echo "2. Check payment API logs"
    echo "3. Verify you're logged in"
    echo "4. See SUBSCRIPTION_FIX_GUIDE.md for more troubleshooting"
else
    echo ""
    echo "Found $ISSUES issue(s). Please fix them and try again."
    echo ""
    echo "Quick fix:"
    echo "1. Run: ./setup-payment.sh"
    echo "2. Configure payment-api/.env with your Stripe credentials"
    echo "3. Run: bun run dev"
fi
echo ""
