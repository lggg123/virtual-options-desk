#!/bin/bash

# Start AI Pattern Detection Service
# Port: 8003

echo "🔍 Starting AI Pattern Detection Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r python/requirements-ml.txt

# Start the service
echo "✅ Starting pattern detection API on port 8003..."
cd python && python pattern_detection_api.py

# Or use uvicorn directly:
# uvicorn python.pattern_detection_api:app --reload --host 0.0.0.0 --port 8003
