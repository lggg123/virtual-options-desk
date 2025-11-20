#!/bin/bash

# Manual blog post generation script
# This triggers the cron endpoint to generate a blog post immediately

# Set your environment variables
CRON_SECRET="${CRON_SECRET:-your-cron-secret-here}"
API_URL="${API_URL:-http://localhost:3000}"

echo "🚀 Triggering blog generation..."
echo "API URL: ${API_URL}/api/cron/generate-daily-blog"

# Make the request
curl -X POST "${API_URL}/api/cron/generate-daily-blog" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "✅ Blog generation request completed!"
