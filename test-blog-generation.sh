#!/bin/bash

# Test Blog Generation Script
# This script tests the frontend's blog generation endpoint

echo "🧪 Testing Blog Generation Endpoint"
echo "===================================="
echo ""

# Configuration
FRONTEND_URL="http://localhost:3000"
CRON_SECRET="9c4a2f8b7d1e6a3c5b9f2e8d4a7c1f6b3e9a5c2d8f1b7e4a9c6f3d2e5b8a1c7f4"

echo "📡 Endpoint: ${FRONTEND_URL}/api/cron/generate-daily-blog"
echo "🔑 Using CRON_SECRET authentication"
echo ""

# Check if frontend is running
echo "🔍 Checking if frontend is running..."
if ! curl -s -f "${FRONTEND_URL}" > /dev/null 2>&1; then
    echo "❌ Frontend is not running on port 3000"
    echo ""
    echo "Please start the frontend first:"
    echo "  cd frontend && npm run dev"
    echo ""
    exit 1
fi

echo "✅ Frontend is running"
echo ""

# Make the request
echo "🚀 Triggering blog generation..."
echo ""

response=$(curl -X POST "${FRONTEND_URL}/api/cron/generate-daily-blog" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP_STATUS:%{http_code}" \
  -s 2>&1)

# Extract status code
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo "📥 Response:"
echo "$body" | jq . 2>/dev/null || echo "$body"
echo ""
echo "📊 HTTP Status: ${http_status}"
echo ""

# Interpret results
if [ "$http_status" = "200" ]; then
    echo "✅ SUCCESS! Blog post generated and saved to Supabase"
    echo ""
    echo "Next steps:"
    echo "  1. Check your Supabase dashboard for the new blog post"
    echo "  2. Visit your frontend to see the blog post displayed"
    echo "  3. The blog should be visible at: ${FRONTEND_URL}/blog"
elif [ "$http_status" = "401" ]; then
    echo "❌ UNAUTHORIZED - Check your CRON_SECRET in frontend/.env"
elif [ "$http_status" = "500" ]; then
    echo "❌ SERVER ERROR - Check the error message above"
    echo ""
    echo "Common issues:"
    echo "  - CrewAI service might be down (check Railway)"
    echo "  - API key might be invalid"
    echo "  - Supabase connection issue"
else
    echo "❌ UNEXPECTED STATUS: ${http_status}"
fi

echo ""
echo "===================================="
