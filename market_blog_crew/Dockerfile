FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

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

# Set Google credentials path (actual secret written at runtime)
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/service-account.json

# Run the Flask API with Gunicorn and longer timeout
RUN pip install gunicorn
CMD ["gunicorn", "api:app", "--bind", "0.0.0.0:8000", "--timeout", "1200"]
