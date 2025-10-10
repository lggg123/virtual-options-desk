# Dockerfile for Pattern Detection API with ML Models
# This Dockerfile is in the python/ directory for Railway deployment
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy requirements first (for better caching)
COPY requirements-ml.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements-ml.txt

# Copy all application code (includes ml_models/ subdirectory)
COPY . /app

# Set environment
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port (Railway will set PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health').read()" || exit 1

# Start the application
CMD uvicorn pattern_detection_api:app --host 0.0.0.0 --port ${PORT:-8080}
