# 📊 Svelte Chart App Integration Guide

## Overview

This guide explains how to integrate the Svelte Chart App (https://svelte-chart-app.vercel.app/) with your deployed backend services on Render.

## Current Architecture

### Svelte Frontend (Deployed on Vercel)
- **URL**: https://svelte-chart-app.vercel.app/
- **Repo**: https://github.com/lggg123/Svelte-chart-app
- **Tech**: Svelte 5, Vite, Canvas API, WebSockets

### Backend Services (Deployed on Render)

#### 1. Pattern Detection API
- **Service**: `pattern-detection-api`
- **URL**: `https://pattern-detection-api-[YOUR-HASH].onrender.com`
- **Endpoint**: `/detect` (POST)
- **Purpose**: Detects candlestick patterns in price data

#### 2. ML Stock Screening API
- **Service**: `ml-stock-screening`
- **URL**: `https://ml-stock-screening-[YOUR-HASH].onrender.com`
- **Endpoints**: 
  - `/health` (GET)
  - `/train` (POST)
  - `/predict` (POST)
  - `/screen` (POST)
- **Purpose**: ML-powered stock predictions and screening

#### 3. Next.js Frontend (Vercel)
- **Service**: `virtual-options-desk`
- **URL**: `https://virtual-options-desk.vercel.app`
- **Has API routes** at `/api/*`

## Integration Options

### Option 1: Add WebSocket Endpoint to Pattern Detection API (Recommended)

The Svelte app expects WebSocket connections for real-time data. You need to add a WebSocket server to your Pattern Detection API.

**Steps:**

1. **Update Pattern Detection API** (`python/pattern_detection_api.py`):

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from datetime import datetime

app = FastAPI()

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket endpoint for real-time chart data
@app.websocket("/ws/live/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str, timeframe: str = "1d"):
    await websocket.accept()
    try:
        # Send historical data first
        historical_data = await get_historical_data(symbol, timeframe, limit=100)
        await websocket.send_json({
            "type": "historical",
            "data": historical_data
        })
        
        # Then send live updates
        while True:
            # Get latest candle
            candle = await get_latest_candle(symbol, timeframe)
            
            # Detect patterns
            pattern = await detect_pattern([candle])
            
            # Send candle update
            await websocket.send_json({
                "type": "candle_update",
                "data": candle
            })
            
            # Send pattern if detected
            if pattern:
                await websocket.send_json({
                    "type": "pattern_detected",
                    "data": pattern
                })
            
            # Wait based on timeframe
            await asyncio.sleep(get_update_interval(timeframe))
            
    except WebSocketDisconnect:
        print(f"Client disconnected from {symbol}")

# Helper functions
async def get_historical_data(symbol: str, timeframe: str, limit: int = 100):
    # Fetch from your data source (Alpha Vantage, etc.)
    # Return format:
    return [{
        "timestamp": "2025-10-06T12:00:00Z",
        "open": 150.25,
        "high": 151.50,
        "low": 149.75,
        "close": 151.00,
        "volume": 1000000
    }]

async def get_latest_candle(symbol: str, timeframe: str):
    # Fetch latest candle
    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "open": 151.00,
        "high": 151.75,
        "low": 150.50,
        "close": 151.25,
        "volume": 500000
    }

def get_update_interval(timeframe: str) -> int:
    intervals = {
        "1m": 60,
        "5m": 300,
        "15m": 900,
        "1h": 3600,
        "4h": 14400,
        "1d": 86400,
        "1w": 604800
    }
    return intervals.get(timeframe, 60)
```

2. **Add REST API endpoints** for Svelte app:

```python
@app.get("/api/picks/top/{count}")
async def get_top_picks(count: int = 100, category: str = None):
    # Return top stock picks from ML screening
    return [
        {
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "price": 150.25,
            "change": 2.5,
            "volume": 50000000
        }
    ]

@app.get("/api/stock/{symbol}")
async def get_stock_details(symbol: str):
    # Return stock details
    return {
        "symbol": symbol,
        "name": f"{symbol} Inc.",
        "price": 150.25,
        "change": 2.5,
        "changePercent": 1.68,
        "volume": 50000000,
        "marketCap": 2500000000000
    }

@app.get("/api/patterns/{symbol}")
async def get_pattern_history(symbol: str, timeframe: str = "1d", days: int = 7):
    # Return historical patterns detected
    return [
        {
            "pattern_type": "hammer",
            "direction": "bullish",
            "confidence": 0.85,
            "strength": 4,
            "timestamp": "2025-10-06T12:01:00Z"
        }
    ]
```

3. **Update Svelte App Environment Variables**:

In your Svelte Chart App Vercel deployment, set:

```env
VITE_API_URL=https://pattern-detection-api-[YOUR-HASH].onrender.com
VITE_WS_URL=wss://pattern-detection-api-[YOUR-HASH].onrender.com
```

### Option 2: Create a Separate WebSocket Service

Create a new Python service specifically for WebSocket connections:

1. Create `python/websocket_service.py`
2. Deploy as a new Render service: `websocket-live-data`
3. Connect to market data APIs
4. Stream real-time candles to Svelte app

### Option 3: Use Next.js as Proxy

Use your Next.js frontend to proxy WebSocket connections:

1. Add WebSocket support to Next.js API routes
2. Svelte app connects to Next.js
3. Next.js forwards to Python backend

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SVELTE CHART APP                          │
│                  (Vercel - Frontend)                         │
│                                                              │
│  • Canvas-based charts                                       │
│  • WebSocket client                                          │
│  • Real-time updates                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ WebSocket (WSS)
                   │ REST API (HTTPS)
                   ↓
┌─────────────────────────────────────────────────────────────┐
│              PATTERN DETECTION API                           │
│                 (Render - Backend)                           │
│                                                              │
│  • WebSocket server (/ws/live/:symbol)                      │
│  • REST endpoints (/api/*)                                   │
│  • Pattern detection                                         │
│  • Market data integration                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Calls
                   ↓
┌─────────────────────────────────────────────────────────────┐
│              ML STOCK SCREENING API                          │
│                 (Render - Backend)                           │
│                                                              │
│  • ML predictions                                            │
│  • Stock screening                                           │
│  • Model training                                            │
└─────────────────────────────────────────────────────────────┘
```

## Expected Message Formats

### Historical Data (Initial Load)
```json
{
  "type": "historical",
  "data": [
    {
      "timestamp": "2025-10-06T12:00:00Z",
      "open": 150.25,
      "high": 151.50,
      "low": 149.75,
      "close": 151.00,
      "volume": 1000000
    }
  ]
}
```

### Candle Update (Live)
```json
{
  "type": "candle_update",
  "data": {
    "timestamp": "2025-10-06T12:01:00Z",
    "open": 151.00,
    "high": 151.75,
    "low": 150.50,
    "close": 151.25,
    "volume": 500000
  }
}
```

### Pattern Detected
```json
{
  "type": "pattern_detected",
  "data": {
    "pattern_type": "hammer",
    "direction": "bullish",
    "confidence": 0.85,
    "strength": 4,
    "timestamp": "2025-10-06T12:01:00Z"
  }
}
```

## Market Data Sources

Your Pattern Detection API will need to fetch real-time market data from:

1. **Alpha Vantage** - Free tier: 100 requests/day
2. **Finnhub** - Free tier: 60 calls/minute
3. **Polygon.io** - Free tier: 5 API calls/minute
4. **Yahoo Finance** (via yfinance library)

## Next Steps

1. **Choose your integration approach** (Option 1 recommended)
2. **Add WebSocket support** to Pattern Detection API
3. **Deploy updates** to Render
4. **Update Svelte app** environment variables on Vercel
5. **Test the connection** 

## Testing Locally

1. Run Pattern Detection API locally:
   ```bash
   uvicorn python.pattern_detection_api:app --reload --port 8000
   ```

2. Update Svelte app `.env`:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_WS_URL=ws://localhost:8000
   ```

3. Run Svelte app:
   ```bash
   cd Svelte-chart-app
   npm run dev
   ```

4. Test WebSocket connection in browser console:
   ```javascript
   const ws = new WebSocket('ws://localhost:8000/ws/live/AAPL?timeframe=1d');
   ws.onmessage = (e) => console.log(JSON.parse(e.data));
   ```

## Production Deployment Checklist

- [ ] Add WebSocket endpoints to Pattern Detection API
- [ ] Add REST API endpoints for Svelte app
- [ ] Configure CORS for Vercel domain
- [ ] Set up market data API keys
- [ ] Deploy to Render
- [ ] Update Svelte app environment variables on Vercel
- [ ] Test WebSocket connections (wss://)
- [ ] Test REST API calls (https://)
- [ ] Monitor Render logs for errors
- [ ] Set up error handling and reconnection logic

## Support

- Pattern Detection API: [Render Dashboard](https://dashboard.render.com/)
- Svelte App: [Vercel Dashboard](https://vercel.com/)
- GitHub Issues: [Svelte Chart App Repo](https://github.com/lggg123/Svelte-chart-app/issues)

---

**Created**: October 6, 2025  
**Status**: Integration Guide Ready
