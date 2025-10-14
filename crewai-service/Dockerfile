# Dockerfile for CrewAI Service (for Nixpacks or direct Docker build)
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install setuptools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy requirements
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . ./

# Fetch the model file from the main branch of the repo (GitHub raw URL)
RUN mkdir -p python/ml_models && \
    curl -L -o python/ml_models/breakout_classifier_xgb_stockslist.pkl \
    https://raw.githubusercontent.com/lggg123/virtual-options-desk/main/python/ml_models/breakout_classifier_xgb_stockslist.pkl

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8080/health')" || exit 1

# Start the application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
