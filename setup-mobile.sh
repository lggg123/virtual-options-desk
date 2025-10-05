#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Flutter Mobile App${NC}"

# Check if Flutter is installed
if ! command -v flutter &> /dev/null
then
    echo -e "${RED}❌ Flutter is not installed!${NC}"
    echo "Please install Flutter from: https://flutter.dev/docs/get-started/install"
    exit 1
fi

echo -e "${GREEN}✓ Flutter is installed${NC}"
flutter --version

# Navigate to mobile directory
cd mobile

# Get Flutter dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
flutter pub get

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Check Flutter setup
echo -e "${BLUE}🔍 Checking Flutter setup...${NC}"
flutter doctor

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update API URLs in lib/config/app_config.dart"
echo "2. Run 'flutter devices' to see available devices"
echo "3. Run 'flutter run' to start the app"
echo ""
echo "For detailed instructions, see mobile/README.md"
