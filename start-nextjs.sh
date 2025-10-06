#!/bin/bash
# Start Next.js Web App
# Port: 3000

echo "🚀 Starting Next.js Web App..."
echo ""

cd "$(dirname "$0")/frontend" || exit 1

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    if command -v bun &> /dev/null; then
        bun install
    else
        npm install
    fi
fi

# Start the dev server
echo "✅ Starting Next.js on http://0.0.0.0:3000"
echo ""

if command -v bun &> /dev/null; then
    bun run dev
else
    npm run dev
fi
