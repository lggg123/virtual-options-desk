"""
FastAPI service for AI Candlestick Pattern Detection
Exposes pattern detection endpoints for Flutter app and Svelte chart app
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
from datetime import datetime, timedelta
import asyncio
import json
import sys
import os
import yfinance as yf

# Import pattern detector - works when running from python/ directory (Railway)
from pattern_detector import PatternDetector, DetectedPattern
from subscription_middleware import (
    check_plan_access,
    check_usage_limit,
    increment_usage,
    get_user_subscription,
    auth_middleware
)

app = FastAPI(
    title="AI Candlestick Pattern Detection API",
    description="Real-time pattern detection for candlestick charts",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add authentication middleware
app.middleware("http")(auth_middleware)

# Global pattern detector instance
detector = PatternDetector(use_ml=False)  # Set to True when ML model is trained

# ==================== REQUEST/RESPONSE MODELS ====================

class Candle(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float

class PatternDetectionRequest(BaseModel):
    symbol: str
    timeframe: str = "1d"
    candles: List[Candle]
    context: Optional[Dict[str, float]] = None

class PatternResponse(BaseModel):
    pattern_type: str
    confidence: float
    direction: str
    strength: int
    start_index: int
    end_index: int
    price_at_detection: float
    context: Dict[str, float]
    timestamp: str

class DetectionResult(BaseModel):
    symbol: str
    timeframe: str
    patterns: List[PatternResponse]
    total_patterns: int
    detection_time_ms: float

class RealtimeDetectionRequest(BaseModel):
    symbol: str
    new_candle: Candle
    recent_candles: List[Candle]
    context: Optional[Dict[str, float]] = None

# ==================== HELPER FUNCTIONS ====================

def candles_to_dataframe(candles: List[Candle]) -> pd.DataFrame:
    """Convert Candle list to DataFrame"""
    data = []
    for candle in candles:
        data.append({
            'timestamp': pd.to_datetime(candle.timestamp),
            'open': candle.open,
            'high': candle.high,
            'low': candle.low,
            'close': candle.close,
            'volume': candle.volume
        })
    return pd.DataFrame(data)

def pattern_to_response(pattern: DetectedPattern) -> PatternResponse:
    """Convert DetectedPattern to PatternResponse"""
    return PatternResponse(
        pattern_type=pattern.pattern_type,
        confidence=pattern.confidence,
        direction=pattern.direction,
        strength=pattern.strength,
        start_index=pattern.start_index,
        end_index=pattern.end_index,
        price_at_detection=pattern.price_at_detection,
        context=pattern.context,
        timestamp=pattern.timestamp.isoformat()
    )

# ==================== API ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "AI Candlestick Pattern Detection",
        "version": "1.0.0",
        "status": "online",
        "ml_enabled": detector.use_ml,
        "patterns_supported": detector.pattern_types
    }

@app.post("/detect", response_model=DetectionResult)
async def detect_patterns(request_data: PatternDetectionRequest, request: Request, subscription: dict = None):
    """
    Detect candlestick patterns in historical data
    
    - **symbol**: Stock symbol (e.g., "AAPL")
    - **timeframe**: Candlestick timeframe (e.g., "1d", "4h")
    - **candles**: List of OHLCV candles
    - **context**: Optional context (RSI, MACD, etc.)
    
    **Subscription Required**: All plans (Free: 10/month, Premium: 100/month, Pro: unlimited)
    """
    try:
        # Get user_id from request state (set by auth_middleware) or query params
        user_id = getattr(request.state, 'user_id', None) or request.query_params.get('user_id')
        
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Authentication required. Please provide user_id or Authorization header."
            )
        
        # Check usage limit
        usage_check = await check_usage_limit(user_id, 'picks_per_month')
        if not usage_check['allowed']:
            raise HTTPException(
                status_code=403,
                detail={
                    'error': 'Monthly usage limit reached',
                    'usage': usage_check['usage'],
                    'limit': usage_check['limit'],
                    'upgrade_url': '/pricing'
                }
            )
        
        start_time = datetime.now()
        
        # Convert to DataFrame
        df = candles_to_dataframe(request_data.candles)
        
        # Detect patterns
        patterns = detector.detect_patterns(df, request_data.context)
        
        # Increment usage counter
        await increment_usage(user_id, 'picks')
        
        # Calculate detection time
        detection_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Convert to response
        pattern_responses = [pattern_to_response(p) for p in patterns]
        
        return DetectionResult(
            symbol=request_data.symbol,
            timeframe=request_data.timeframe,
            patterns=pattern_responses,
            total_patterns=len(pattern_responses),
            detection_time_ms=detection_time
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pattern detection failed: {str(e)}")

@app.post("/detect/realtime", response_model=Optional[PatternResponse])
async def detect_realtime(request: RealtimeDetectionRequest):
    """
    Real-time pattern detection for streaming data
    
    - **symbol**: Stock symbol
    - **new_candle**: Most recent candle
    - **recent_candles**: Last 20 candles for context
    - **context**: Optional technical indicators
    """
    try:
        # Convert to DataFrame
        recent_df = candles_to_dataframe(request.recent_candles)
        
        # Convert new candle to dict
        new_candle_dict = {
            'timestamp': pd.to_datetime(request.new_candle.timestamp),
            'open': request.new_candle.open,
            'high': request.new_candle.high,
            'low': request.new_candle.low,
            'close': request.new_candle.close,
            'volume': request.new_candle.volume
        }
        
        # Detect pattern
        pattern = detector.detect_realtime(
            new_candle_dict,
            recent_df,
            request.context
        )
        
        if pattern:
            return pattern_to_response(pattern)
        return None
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Realtime detection failed: {str(e)}")

@app.get("/subscription/status")
async def get_subscription_status(request: Request):
    """
    Get user's subscription status and usage limits
    
    Returns plan details, usage stats, and feature access
    """
    try:
        # Get user_id from request
        user_id = getattr(request.state, 'user_id', None) or request.query_params.get('user_id')
        
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Authentication required. Please provide user_id or Authorization header."
            )
        
        # Get subscription details
        subscription = await get_user_subscription(user_id)
        
        # Get usage stats
        usage = await check_usage_limit(user_id, 'picks_per_month')
        
        return {
            "user_id": user_id,
            "plan": subscription['plan_id'],
            "status": subscription['status'],
            "features": subscription['features'],
            "usage": {
                "picks_used": usage['usage'],
                "picks_limit": usage['limit'],
                "picks_remaining": usage['remaining'],
                "unlimited": usage.get('unlimited', False)
            },
            "upgrade_available": subscription['plan_id'] != 'pro'
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get subscription status: {str(e)}")

@app.get("/patterns/types")
async def get_pattern_types():
    """Get list of all supported pattern types"""
    return {
        "patterns": detector.pattern_types,
        "total": len(detector.pattern_types),
        "descriptions": {
            "doji": "Indecision pattern, open ≈ close",
            "hammer": "Bullish reversal, long lower shadow",
            "shooting_star": "Bearish reversal, long upper shadow",
            "bullish_engulfing": "Bullish reversal, engulfs previous bearish candle",
            "bearish_engulfing": "Bearish reversal, engulfs previous bullish candle",
            "morning_star": "Strong bullish reversal, 3-candle pattern",
            "evening_star": "Strong bearish reversal, 3-candle pattern",
            "three_white_soldiers": "Strong bullish continuation",
            "three_black_crows": "Strong bearish continuation",
            "harami": "Potential reversal, small candle inside larger one"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "ml_available": detector.use_ml
    }

# ==================== BATCH PROCESSING ====================

@app.post("/detect/batch")
async def detect_batch(requests: List[PatternDetectionRequest]):
    """
    Batch pattern detection for multiple symbols
    
    Useful for scanning multiple stocks at once
    """
    results = []
    
    for request in requests:
        try:
            result = await detect_patterns(request)
            results.append(result)
        except Exception as e:
            results.append({
                "symbol": request.symbol,
                "error": str(e),
                "patterns": [],
                "total_patterns": 0
            })
    
    return {
        "total_processed": len(requests),
        "results": results
    }

# ==================== STATISTICS ====================

@app.get("/stats")
async def get_statistics():
    """Get service statistics"""
    return {
        "service": "Pattern Detection API",
        "ml_enabled": detector.use_ml,
        "patterns_tracked": len(detector.pattern_types),
        "uptime": "N/A",  # Implement uptime tracking if needed
        "version": "1.0.0"
    }

# ==================== SVELTE CHART APP ENDPOINTS ====================

@app.get("/api/picks/top/{count}")
async def get_top_picks(count: int = 100, category: Optional[str] = None):
    """Get top stock picks - for Svelte chart app"""
    # Popular stocks with good liquidity
    symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD", "NFLX", "DIS"]
    picks = []
    
    for symbol in symbols[:min(count, len(symbols))]:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            history = ticker.history(period="1d")
            
            if not history.empty:
                current_price = float(history['Close'].iloc[-1])
                prev_close = float(info.get('previousClose', current_price))
                change = current_price - prev_close
                
                picks.append({
                    "symbol": symbol,
                    "name": info.get('shortName', symbol),
                    "price": round(current_price, 2),
                    "change": round(change, 2),
                    "volume": int(history['Volume'].iloc[-1]) if 'Volume' in history else 0
                })
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            continue
    
    return picks

@app.get("/api/stock/{symbol}")
async def get_stock_details(symbol: str):
    """Get detailed stock information - for Svelte chart app"""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        history = ticker.history(period="1d")
        
        if history.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {symbol}")
        
        current_price = float(history['Close'].iloc[-1])
        prev_close = float(info.get('previousClose', current_price))
        change = current_price - prev_close
        change_percent = (change / prev_close * 100) if prev_close else 0
        
        return {
            "symbol": symbol,
            "name": info.get('shortName', symbol),
            "price": round(current_price, 2),
            "change": round(change, 2),
            "changePercent": round(change_percent, 2),
            "volume": int(history['Volume'].iloc[-1]) if 'Volume' in history else 0,
            "marketCap": info.get('marketCap', 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stock details: {str(e)}")

@app.get("/api/patterns/{symbol}")
async def get_pattern_history(symbol: str, timeframe: str = "1d", days: int = 7):
    """Get historical patterns for a symbol - for Svelte chart app"""
    try:
        # Fetch historical data
        period = f"{days}d"
        ticker = yf.Ticker(symbol)
        history = ticker.history(period=period)
        
        if history.empty:
            return []
        
        # Convert to candles
        candles = []
        for idx, row in history.iterrows():
            candles.append(Candle(
                timestamp=idx.isoformat(),
                open=float(row['Open']),
                high=float(row['High']),
                low=float(row['Low']),
                close=float(row['Close']),
                volume=float(row['Volume'])
            ))
        
        # Detect patterns
        df = candles_to_dataframe(candles)
        detected_patterns = detector.detect_patterns(df)
        
        # Convert to response format
        patterns_response = []
        for pattern in detected_patterns:
            patterns_response.append({
                "pattern_type": pattern.pattern_type,
                "direction": pattern.direction,
                "confidence": round(pattern.confidence, 2),
                "strength": pattern.strength,
                "timestamp": pattern.timestamp.isoformat() if isinstance(pattern.timestamp, datetime) else pattern.timestamp
            })
        
        return patterns_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting patterns: {str(e)}")

# ==================== WEBSOCKET ENDPOINTS ====================

def get_update_interval(timeframe: str) -> int:
    """Get update interval in seconds based on timeframe"""
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

def get_yfinance_interval(timeframe: str) -> str:
    """Convert timeframe to yfinance interval"""
    mapping = {
        "1m": "1m",
        "5m": "5m",
        "15m": "15m",
        "1h": "1h",
        "4h": "1h",
        "1d": "1d",
        "1w": "1wk"
    }
    return mapping.get(timeframe, "1d")

def get_yfinance_period(timeframe: str, limit: int = 100) -> str:
    """Get appropriate period for fetching historical data"""
    if timeframe in ["1m", "5m", "15m"]:
        return "7d"  # Max for intraday
    elif timeframe in ["1h", "4h"]:
        return "60d"
    elif timeframe == "1d":
        return "1y"
    else:  # 1w
        return "5y"

async def fetch_historical_data(symbol: str, timeframe: str, limit: int = 100) -> List[Dict]:
    """Fetch historical candle data from Yahoo Finance"""
    try:
        ticker = yf.Ticker(symbol)
        period = get_yfinance_period(timeframe, limit)
        interval = get_yfinance_interval(timeframe)
        
        history = ticker.history(period=period, interval=interval)
        
        if history.empty:
            return []
        
        # Take last N candles
        history = history.tail(limit)
        
        candles = []
        for idx, row in history.iterrows():
            candles.append({
                "timestamp": idx.isoformat(),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": int(row['Volume'])
            })
        
        return candles
    except Exception as e:
        print(f"Error fetching historical data for {symbol}: {e}")
        return []

async def fetch_latest_candle(symbol: str, timeframe: str) -> Optional[Dict]:
    """Fetch the latest candle data"""
    try:
        ticker = yf.Ticker(symbol)
        interval = get_yfinance_interval(timeframe)
        
        # Get very recent data
        history = ticker.history(period="1d", interval=interval)
        
        if history.empty:
            return None
        
        row = history.iloc[-1]
        idx = history.index[-1]
        
        return {
            "timestamp": idx.isoformat(),
            "open": float(row['Open']),
            "high": float(row['High']),
            "low": float(row['Low']),
            "close": float(row['Close']),
            "volume": int(row['Volume'])
        }
    except Exception as e:
        print(f"Error fetching latest candle for {symbol}: {e}")
        return None

@app.websocket("/ws/live/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str, timeframe: str = "1d"):
    """WebSocket endpoint for real-time chart data - for Svelte chart app"""
    await websocket.accept()
    print(f"📊 Client connected for {symbol} ({timeframe})")
    
    try:
        # Send historical data first
        historical_data = await fetch_historical_data(symbol, timeframe, limit=100)
        await websocket.send_json({
            "type": "historical",
            "data": historical_data
        })
        
        # Send live updates
        update_interval = get_update_interval(timeframe)
        last_candle = None
        
        while True:
            # Fetch latest candle
            candle = await fetch_latest_candle(symbol, timeframe)
            
            if candle and candle != last_candle:
                # Send candle update
                await websocket.send_json({
                    "type": "candle_update",
                    "data": candle
                })
                
                # Detect patterns on recent data
                if historical_data:
                    recent_candles = historical_data[-20:] + [candle]  # Last 20 + new one
                    
                    # Convert to DataFrame
                    candles_list = [Candle(**c) for c in recent_candles]
                    df = candles_to_dataframe(candles_list)
                    
                    # Detect patterns
                    patterns = detector.detect_patterns(df)
                    
                    # Send pattern if detected in latest candles
                    for pattern in patterns[-3:]:  # Only send most recent patterns
                        await websocket.send_json({
                            "type": "pattern_detected",
                            "data": {
                                "pattern_type": pattern.pattern_type,
                                "direction": pattern.direction,
                                "confidence": round(pattern.confidence, 2),
                                "strength": pattern.strength,
                                "timestamp": candle["timestamp"]
                            }
                        })
                
                last_candle = candle
                
                # Update historical data
                if len(historical_data) >= 100:
                    historical_data.pop(0)
                historical_data.append(candle)
            
            # Send heartbeat
            await websocket.send_json({"type": "heartbeat"})
            
            # Wait for next update
            await asyncio.sleep(update_interval)
            
    except WebSocketDisconnect:
        print(f"🔴 Client disconnected from {symbol}")
    except Exception as e:
        print(f"❌ WebSocket error for {symbol}: {e}")
        try:
            await websocket.close()
        except:
            pass

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Pattern Detection API on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
