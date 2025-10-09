#!/bin/bash

# 🚀 Quick Deploy to Vercel
# This script deploys the frontend to Vercel with all necessary checks

set -e

echo "🔍 Checking prerequisites..."

# Check if in correct directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: Must run from project root (/workspaces/virtual-options-desk)"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install --prefix frontend
fi

# Check if build works
echo "🔨 Testing build..."
cd frontend
npm run build || {
    echo "❌ Build failed! Fix errors before deploying."
    exit 1
}
echo "✅ Build successful!"

# Environment variables check
echo ""
echo "🔑 Environment Variables Needed:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - PAYMENT_API_URL"
echo "   - STRIPE_SECRET_KEY"
echo "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo ""

read -p "Have you set these in Vercel dashboard? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Set environment variables first:"
    echo "   vercel env add VARIABLE_NAME"
    exit 1
fi

# Deploy
echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Visit your deployment URL"
echo "   2. Test login functionality"
echo "   3. Test /diagnose page"
echo "   4. Test subscription button"
echo ""
