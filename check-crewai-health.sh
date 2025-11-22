#!/bin/bash
# Check if CrewAI service is healthy and ready

CREWAI_URL="https://exquisite-analysis-production-45b7.up.railway.app"

echo "🔍 Checking CrewAI service health..."
echo ""

response=$(curl -s -w "\n%{http_code}" "${CREWAI_URL}/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo "✅ Service is healthy!"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    echo "🎉 You can now run blog generation:"
    echo "   cd frontend && node ../run-blog-generation.js"
else
    echo "❌ Service returned status: $http_code"
    echo "$body"
    echo ""
    echo "⏳ Railway is probably still deploying. Wait 2-3 minutes and try again."
fi
