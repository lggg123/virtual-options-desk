#!/bin/bash
# Startup script for CrewAI Service
# Reads PORT from environment or defaults to 8000

PORT=${PORT:-8000}
echo "Starting CrewAI Service on port $PORT"
uvicorn main:app --host 0.0.0.0 --port $PORT
