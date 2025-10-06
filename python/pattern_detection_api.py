"""
FastAPI service for AI Candlestick Pattern Detection
Exposes pattern detection endpoints for Flutter app
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
from datetime import datetime
import sys
import os

# Add parent directory to path for local imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    # Try production import first
    from pattern_detector import PatternDetector, DetectedPattern
except ImportError:
    # Fall back to development import
    from python.pattern_detector import PatternDetector, DetectedPattern

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
async def detect_patterns(request: PatternDetectionRequest):
    """
    Detect candlestick patterns in historical data
    
    - **symbol**: Stock symbol (e.g., "AAPL")
    - **timeframe**: Candlestick timeframe (e.g., "1d", "4h")
    - **candles**: List of OHLCV candles
    - **context**: Optional context (RSI, MACD, etc.)
    """
    try:
        start_time = datetime.now()
        
        # Convert to DataFrame
        df = candles_to_dataframe(request.candles)
        
        # Detect patterns
        patterns = detector.detect_patterns(df, request.context)
        
        # Calculate detection time
        detection_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Convert to response
        pattern_responses = [pattern_to_response(p) for p in patterns]
        
        return DetectionResult(
            symbol=request.symbol,
            timeframe=request.timeframe,
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
