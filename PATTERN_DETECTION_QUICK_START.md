# 🚀 Pattern Detection Quick Start

## ✅ Service Status

**Pattern Detection Service is LIVE on port 8003!**

```bash
# Health check
curl http://localhost:8003/health

# Get pattern types
curl http://localhost:8003/patterns/types
```

## 🎯 Quick Test

### Test Pattern Detection

```bash
curl -X POST http://localhost:8003/detect \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "timeframe": "1d",
    "candles": [
      {
        "timestamp": "2024-01-01T00:00:00Z",
        "open": 150.0,
        "high": 152.0,
        "low": 149.0,
        "close": 151.0,
        "volume": 50000000
      },
      {
        "timestamp": "2024-01-02T00:00:00Z",
        "open": 151.0,
        "high": 151.5,
        "low": 150.5,
        "close": 151.2,
        "volume": 45000000
      }
    ]
  }'
```

## 📂 Project Structure

```
/workspaces/virtual-options-desk/
├── python/
│   ├── pattern_detector.py        # Core detection logic (700+ lines)
│   └── pattern_detection_api.py   # FastAPI service (300+ lines)
├── src/app/api/patterns/          # Next.js API routes
│   ├── detect/route.ts
│   ├── realtime/route.ts
│   └── types/route.ts
├── mobile/lib/services/
│   └── supabase_service.dart      # Flutter integration
└── docs/
    └── PATTERN_DETECTION_GUIDE.md # Full documentation
```

## 🔧 Commands

### Start Service

```bash
# Option 1: Using startup script
./start-pattern-service.sh

# Option 2: Direct Python
python python/pattern_detection_api.py

# Option 3: Background (current)
nohup python python/pattern_detection_api.py > pattern_service.log 2>&1 &
```

### Check Service

```bash
# View logs
tail -f pattern_service.log

# Test endpoints
curl http://localhost:8003/health
curl http://localhost:8003/patterns/types

# Stop service
pkill -f pattern_detection_api
```

## 🎨 Supported Patterns

| Pattern | Direction | Confidence | Description |
|---------|-----------|------------|-------------|
| **Doji** | Neutral | 85% | Indecision, open ≈ close |
| **Hammer** | Bullish | 80% | Long lower shadow |
| **Shooting Star** | Bearish | 80% | Long upper shadow |
| **Bullish Engulfing** | Bullish | 85% | Engulfs previous bearish |
| **Bearish Engulfing** | Bearish | 85% | Engulfs previous bullish |
| **Morning Star** | Bullish | 90% | 3-candle reversal |
| **Evening Star** | Bearish | 90% | 3-candle reversal |
| **Three White Soldiers** | Bullish | 85% | Strong continuation |
| **Three Black Crows** | Bearish | 85% | Strong continuation |
| **Harami** | Reversal | 75% | Small inside large |

## 🔗 Integration Points

### Python Backend
- **Service URL**: `http://localhost:8003`
- **Endpoints**: `/detect`, `/detect/realtime`, `/patterns/types`

### Next.js Middleware
- **API Routes**: `/api/patterns/*`
- **Proxy to**: Pattern Detection Service (8003)

### Flutter Mobile
- **Service**: `SupabaseService`
- **Methods**: `detectPatterns()`, `detectRealtimePattern()`, `getPatternTypes()`

## 📊 Example Response

```json
{
  "symbol": "AAPL",
  "timeframe": "1d",
  "patterns": [
    {
      "pattern_type": "hammer",
      "confidence": 0.85,
      "direction": "bullish",
      "strength": 4,
      "start_index": 45,
      "end_index": 45,
      "price_at_detection": 151.0,
      "context": {"rsi": 65, "macd": 0.5},
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ],
  "total_patterns": 1,
  "detection_time_ms": 12.5
}
```

## 🐛 Troubleshooting

### Service Not Starting

**Check logs**:
```bash
tail -f pattern_service.log
```

**Common issues**:
1. Port 8003 already in use: `lsof -i :8003`
2. Missing dependencies: `pip install fastapi uvicorn pydantic opencv-python`
3. OpenCV system libs: `sudo apt-get install libgl1 libglib2.0-0`

### No Patterns Detected

- Need at least 20 candles for reliable detection
- Provide volume data for better accuracy
- Include technical indicators (RSI, MACD) in context

### Low Confidence

- Filter results: `patterns = [p for p in patterns if p.confidence > 0.8]`
- Increase historical data window
- Add context indicators

## 🚀 Next Steps

1. ✅ **Service Running** - Pattern detection API is live
2. ⬜ **Test Flutter Integration** - Call from mobile app
3. ⬜ **Add UI Overlays** - Display patterns on charts
4. ⬜ **Real-time Streaming** - WebSocket integration
5. ⬜ **ML Model Training** - Optional PyTorch CNN

## 📚 Documentation

- **Full Guide**: `/docs/PATTERN_DETECTION_GUIDE.md`
- **API Code**: `/python/pattern_detection_api.py`
- **Detector Core**: `/python/pattern_detector.py`

---

**Pattern Detection Service Status**: ✅ ONLINE @ http://localhost:8003
