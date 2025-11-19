#!/bin/bash

# Quick Deployment Script for $2,000,000 Starter Money Update
# Run this after updating your Supabase database

echo "🚀 Deploying $2,000,000 Starter Money Update"
echo "==========================================="
echo ""

# Step 1: Verify we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from the project root."
    exit 1
fi

# Step 2: Reminder to update database
echo "⚠️  IMPORTANT: Before deploying, make sure you've run the SQL migration!"
echo ""
echo "   1. Go to your Supabase Dashboard → SQL Editor"
echo "   2. Run the script from: database/update_starter_money.sql"
echo ""
read -p "Have you updated the database? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please update the database first, then run this script again."
    exit 1
fi

# Step 3: Build frontend
echo ""
echo "📦 Building frontend..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build successful!"
echo ""

# Step 4: Show next steps
echo "✨ Build Complete!"
echo ""
echo "Next steps:"
echo "  1. Deploy to your hosting platform (Vercel/Railway/etc.)"
echo "  2. Test new user signup - verify $2,000,000 starting balance"
echo "  3. Check existing users show updated balance"
echo ""
echo "🎉 Update ready for deployment!"
