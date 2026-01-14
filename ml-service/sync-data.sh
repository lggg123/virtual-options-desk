#!/bin/bash

echo "📦 Syncing historical stock data to ml-service..."

# Copy historical data to ml-service directory
cp ../data/historical_stock_data.csv historical_stock_data.csv

if [ -f "historical_stock_data.csv" ]; then
    SIZE=$(ls -lh historical_stock_data.csv | awk '{print $5}')
    echo "✅ Data synced! File size: $SIZE"
    echo ""
    echo "This file will be deployed with the ML service to Railway."
else
    echo "❌ Failed to sync data file"
    exit 1
fi
