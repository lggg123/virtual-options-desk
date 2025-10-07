#!/bin/bash
# Startup script for Pattern Detection API
# Reads PORT from environment or defaults to 8000

PORT=${PORT:-8000}
echo "Starting Pattern Detection API on port $PORT"
uvicorn pattern_detection_api:app --host 0.0.0.0 --port $PORT
