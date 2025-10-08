#!/bin/bash

# Payment API Setup Script
# This script helps set up the payment API for local development

set -e

echo "🔧 Payment API Setup"
echo "===================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if payment-api directory exists
if [ ! -d "payment-api" ]; then
    echo "❌ Error: payment-api directory not found"
    exit 1
fi

echo "📦 Installing payment API dependencies..."
cd payment-api
npm install
echo "✅ Dependencies installed"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists in payment-api/"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
        echo "✅ Setup complete (skipped .env creation)"
        echo ""
        echo "To start the payment API:"
        echo "  cd payment-api && npm run dev"
        echo ""
        echo "Or start all services:"
        echo "  bun run dev"
        cd ..
        exit 0
    fi
fi

echo "📝 Creating .env file..."
cp .env.example .env

echo ""
echo "✅ Created .env file from template"
echo ""
echo "⚠️  IMPORTANT: You need to configure the following:"
echo ""
echo "1. Get your Stripe test keys from: https://dashboard.stripe.com/test/apikeys"
echo "   - STRIPE_SECRET_KEY (starts with sk_test_)"
echo "   - STRIPE_PUBLISHABLE_KEY (starts with pk_test_)"
echo ""
echo "2. Create products in Stripe: https://dashboard.stripe.com/test/products"
echo "   - Premium: \$29/month → Copy Price ID to STRIPE_PREMIUM_PRICE_ID"
echo "   - Pro: \$99/month → Copy Price ID to STRIPE_PRO_PRICE_ID"
echo "   - Premium Yearly: \$290/year → Copy Price ID to STRIPE_PREMIUM_YEARLY_PRICE_ID"
echo "   - Pro Yearly: \$990/year → Copy Price ID to STRIPE_PRO_YEARLY_PRICE_ID"
echo ""
echo "3. Get Supabase credentials from your project settings:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "4. Edit the .env file: nano payment-api/.env"
echo ""

# Prompt to open editor
read -p "Do you want to edit the .env file now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v code &> /dev/null; then
        code .env
    elif command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        echo "No suitable editor found. Please edit payment-api/.env manually."
    fi
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with Stripe and Supabase credentials"
echo "2. Test payment API: cd payment-api && npm run dev"
echo "3. Or start all services: bun run dev"
echo ""
echo "For detailed instructions, see: SUBSCRIPTION_FIX_GUIDE.md"
