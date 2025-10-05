#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Virtual Options Desk ML Service${NC}\n"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Python 3 is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python 3 found${NC}"

# Check if required packages are installed
echo -e "${BLUE}📦 Checking ML dependencies...${NC}"

python3 -c "import xgboost, lightgbm, sklearn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Installing ML dependencies...${NC}"
    pip install -r python/requirements-ml.txt
fi

echo -e "${GREEN}✓ Dependencies ready${NC}\n"

# Start ML API service
echo -e "${BLUE}🚀 Starting ML API on http://localhost:8002${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"

cd python
python3 ml_api.py
