#!/bin/bash

# Verify all API routes exist in frontend before deleting root /src

set -e

echo "🔍 Verifying API Routes Migration..."
echo ""

FRONTEND_DIR="/workspaces/virtual-options-desk/frontend/src/app/api"
ALL_GOOD=true

# Check ML routes
echo "Checking ML API routes..."
if [ -f "$FRONTEND_DIR/ml/predict/route.ts" ]; then
  echo "  ✅ ml/predict/route.ts"
else
  echo "  ❌ ml/predict/route.ts MISSING"
  ALL_GOOD=false
fi

if [ -f "$FRONTEND_DIR/ml/screen/route.ts" ]; then
  echo "  ✅ ml/screen/route.ts"
else
  echo "  ❌ ml/screen/route.ts MISSING"
  ALL_GOOD=false
fi

if [ -f "$FRONTEND_DIR/ml/features/route.ts" ]; then
  echo "  ✅ ml/features/route.ts"
else
  echo "  ❌ ml/features/route.ts MISSING"
  ALL_GOOD=false
fi

if [ -f "$FRONTEND_DIR/ml/train/route.ts" ]; then
  echo "  ✅ ml/train/route.ts"
else
  echo "  ❌ ml/train/route.ts MISSING"
  ALL_GOOD=false
fi

# Check Pattern routes
echo ""
echo "Checking Pattern API routes..."
if [ -f "$FRONTEND_DIR/patterns/detect/route.ts" ]; then
  echo "  ✅ patterns/detect/route.ts"
else
  echo "  ❌ patterns/detect/route.ts MISSING"
  ALL_GOOD=false
fi

if [ -f "$FRONTEND_DIR/patterns/realtime/route.ts" ]; then
  echo "  ✅ patterns/realtime/route.ts"
else
  echo "  ❌ patterns/realtime/route.ts MISSING"
  ALL_GOOD=false
fi

if [ -f "$FRONTEND_DIR/patterns/types/route.ts" ]; then
  echo "  ✅ patterns/types/route.ts"
else
  echo "  ❌ patterns/types/route.ts MISSING"
  ALL_GOOD=false
fi

# Check Payment routes
echo ""
echo "Checking Payment API routes..."
if [ -f "$FRONTEND_DIR/payment/checkout/route.ts" ]; then
  echo "  ✅ payment/checkout/route.ts"
else
  echo "  ❌ payment/checkout/route.ts MISSING"
  ALL_GOOD=false
fi

if [ -f "$FRONTEND_DIR/payment/subscription/route.ts" ]; then
  echo "  ✅ payment/subscription/route.ts"
else
  echo "  ❌ payment/subscription/route.ts MISSING"
  ALL_GOOD=false
fi

if [ -f "$FRONTEND_DIR/payment/portal/route.ts" ]; then
  echo "  ✅ payment/portal/route.ts"
else
  echo "  ❌ payment/portal/route.ts MISSING"
  ALL_GOOD=false
fi

# Check Pages
echo ""
echo "Checking Pages..."
if [ -f "/workspaces/virtual-options-desk/frontend/src/app/pricing/page.tsx" ]; then
  echo "  ✅ pricing/page.tsx"
else
  echo "  ❌ pricing/page.tsx MISSING"
  ALL_GOOD=false
fi

if [ -f "/workspaces/virtual-options-desk/frontend/src/app/success/page.tsx" ]; then
  echo "  ✅ success/page.tsx"
else
  echo "  ❌ success/page.tsx MISSING"
  ALL_GOOD=false
fi

echo ""
echo "================================"

if [ "$ALL_GOOD" = true ]; then
  echo "✅ All routes verified!"
  echo ""
  echo "Safe to delete root /src folder:"
  echo "  rm -rf /workspaces/virtual-options-desk/src"
  echo ""
  exit 0
else
  echo "❌ Some routes are missing!"
  echo "Do NOT delete root /src folder yet."
  echo ""
  exit 1
fi
