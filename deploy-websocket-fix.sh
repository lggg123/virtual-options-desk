#!/bin/bash

# Quick script to deploy WebSocket fixes to Railway

echo "🚀 Deploying WebSocket 1006 Fix to Railway"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in git repo
if [ ! -d .git ]; then
    echo "❌ Not in a git repository!"
    echo "Please run from the root of virtual-options-desk"
    exit 1
fi

# Show what will be committed
echo "📋 Changes to be deployed:"
echo ""
git status python/ --short

echo ""
echo "Files modified:"
echo "  ✓ python/pattern_detection_api.py (Enhanced WebSocket logging)"
echo "  ✓ python/start.sh (Added WebSocket support flags)"
echo "  ✓ python/railway.json (Railway config)"
echo "  ✓ python/railway.toml (Railway settings)"
echo ""

# Ask for confirmation
read -p "Deploy these changes to Railway? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🔧 Staging changes..."
git add python/pattern_detection_api.py
git add python/start.sh
git add python/railway.json
git add python/railway.toml

echo "📝 Committing..."
git commit -m "Fix WebSocket 1006 error - add Railway WebSocket config and enhanced logging"

echo "🚀 Pushing to trigger Railway deployment..."
git push origin main

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Changes pushed successfully!"
echo ""
echo "⏳ Railway is now deploying (takes 2-5 minutes)..."
echo ""
echo "📊 Monitor deployment:"
echo "   https://railway.app/dashboard"
echo ""
echo "🧪 After deployment completes, test:"
echo "   1. Check Railway logs for: ✅ WebSocket ACCEPTED"
echo "   2. Visit: https://svelte-chart-app.vercel.app/"
echo "   3. Should show: 🟢 Live"
echo ""
echo "📖 Full guide: WEBSOCKET_1006_FIX.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
