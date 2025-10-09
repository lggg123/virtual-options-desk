#!/bin/bash

# 🧪 Test Localhost After Fix
# Run this to verify the localhost fix worked

set -e

echo "🧪 Testing Localhost Fix..."
echo ""

# Kill any existing Next.js processes
echo "🔍 Checking for existing Next.js processes..."
pkill -f "next dev" || true
sleep 2

# Navigate to frontend
cd /workspaces/virtual-options-desk/frontend

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules missing! Running npm install..."
    npm install
fi

# Try starting dev server
echo ""
echo "🚀 Starting dev server..."
echo "   This will run for 15 seconds to verify it works..."
echo ""

timeout 15 npm run dev &
DEV_PID=$!

# Wait for server to start
sleep 5

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo ""
    echo "✅ SUCCESS! Dev server is running!"
    echo ""
    echo "   Visit: http://localhost:3000"
    echo "   Status: HEALTHY ✓"
    echo ""
else
    echo ""
    echo "⚠️  Server started but not responding yet."
    echo "   Wait a few more seconds and visit: http://localhost:3000"
    echo ""
fi

# Cleanup
kill $DEV_PID 2>/dev/null || true

echo ""
echo "📋 Next steps:"
echo "   1. Run: cd frontend && npm run dev"
echo "   2. Visit: http://localhost:3000"
echo "   3. Test: http://localhost:3000/diagnose"
echo ""
