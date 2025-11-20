#!/bin/bash

# Manual blog post generation script
# This triggers the cron endpoint to generate a blog post immediately

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
  echo "✓ Loaded environment variables from .env"
  echo ""
fi

# Set your environment variables
CRON_SECRET="${CRON_SECRET:-your-cron-secret-here}"
API_URL="${API_URL:-http://localhost:3000}"

echo "🚀 Triggering blog generation..."
echo "API URL: ${API_URL}/api/cron/generate-daily-blog"
echo ""

# Make the request
curl -X POST "${API_URL}/api/cron/generate-daily-blog" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "✅ Blog generation request completed!"
