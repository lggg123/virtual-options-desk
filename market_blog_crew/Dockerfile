FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# Create output directory
RUN mkdir -p /app/output

# Expose port
EXPOSE 8000

# Set environment variables
ENV FLASK_ENV=production
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Run the Flask API
CMD ["python", "api.py"]
