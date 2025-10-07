#!/bin/bash
# Startup script for Pattern Detection API
set -e

# Export PORT for uvicorn to use
export PORT="${PORT:-8000}"

echo "=== Pattern Detection API Startup ==="
echo "PORT environment variable: ${PORT}"
echo "Starting uvicorn..."

exec uvicorn pattern_detection_api:app --host 0.0.0.0 --port "${PORT}"
