#!/bin/bash

# Payment System Installation Script
# This script installs dependencies for both payment-api and frontend

set -e  # Exit on error

echo "🚀 Installing Payment System Dependencies..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Install payment-api dependencies
echo -e "${BLUE}📦 Installing payment-api dependencies...${NC}"
cd "$SCRIPT_DIR/payment-api"
npm install
echo -e "${GREEN}✅ Payment API dependencies installed${NC}"
echo ""

# Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd "$SCRIPT_DIR/frontend"

# Check if using npm or bun
if command -v bun &> /dev/null; then
    echo "Using bun..."
    bun add lucide-react
else
    echo "Using npm..."
    npm install lucide-react
fi

echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
echo ""

# Summary
echo -e "${GREEN}🎉 Installation Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Set up environment variables (.env files)"
echo "2. Deploy payment-api to Railway"
echo "3. Create Stripe products and get price IDs"
echo "4. Configure Stripe webhooks"
echo "5. Deploy frontend to Vercel"
echo ""
echo "📚 See SETUP_COMPLETE.md for detailed instructions"
