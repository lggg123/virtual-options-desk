#!/bin/bash
# Startup script for ML API
set -e

# Export PORT for uvicorn to use
export PORT="${PORT:-8002}"

echo "=== ML API Startup ==="
echo "PORT environment variable: ${PORT}"

# Check if virtual environment exists and use it
if [ -d "/opt/venv" ]; then
    echo "Using virtual environment at /opt/venv"
    export PATH="/opt/venv/bin:$PATH"
    echo "Python version: $(python --version)"
    exec python -m uvicorn ml_api:app \
        --host 0.0.0.0 \
        --port "${PORT}" \
        --log-level info
else
    echo "Using system Python"
    echo "Python version: $(python3 --version)"
    exec python3 -m uvicorn ml_api:app \
        --host 0.0.0.0 \
        --port "${PORT}" \
        --log-level info
fi
