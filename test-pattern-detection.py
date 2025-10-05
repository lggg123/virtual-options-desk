#!/usr/bin/env python3
"""
Test script for AI Candlestick Pattern Detection
Tests the pattern detection service with sample candlestick data
"""

import requests
import json
from datetime import datetime, timedelta

# Service URL
BASE_URL = "http://localhost:8003"

def test_health():
    """Test service health"""
    print("🏥 Testing service health...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {json.dumps(response.json(), indent=2)}\n")
    return response.status_code == 200

def test_pattern_types():
    """Test pattern types endpoint"""
    print("📋 Testing pattern types...")
    response = requests.get(f"{BASE_URL}/patterns/types")
    data = response.json()
    print(f"   Total patterns: {data['total']}")
    print(f"   Patterns: {', '.join(data['patterns'])}\n")
    return data

def generate_hammer_pattern():
    """Generate sample data with hammer pattern"""
    base_time = datetime.now() - timedelta(days=50)
    candles = []
    
    # Downtrend
    for i in range(45):
        timestamp = base_time + timedelta(days=i)
        open_price = 150 - i * 0.5
        candles.append({
            "timestamp": timestamp.isoformat() + "Z",
            "open": open_price,
            "high": open_price + 1,
            "low": open_price - 1.5,
            "close": open_price - 0.5,
            "volume": 1000000 + i * 10000
        })
    
    # Hammer pattern - long lower shadow, small body at top
    timestamp = base_time + timedelta(days=45)
    candles.append({
        "timestamp": timestamp.isoformat() + "Z",
        "open": 127.5,
        "high": 128.0,
        "low": 123.0,  # Long lower shadow
        "close": 127.8,  # Small body at top
        "volume": 2500000  # High volume
    })
    
    return candles

def generate_doji_pattern():
    """Generate sample data with doji pattern"""
    base_time = datetime.now() - timedelta(days=50)
    candles = []
    
    # Trend
    for i in range(45):
        timestamp = base_time + timedelta(days=i)
        open_price = 150 + (i % 10) * 0.3
        candles.append({
            "timestamp": timestamp.isoformat() + "Z",
            "open": open_price,
            "high": open_price + 1.5,
            "low": open_price - 1.5,
            "close": open_price + 0.5,
            "volume": 1000000
        })
    
    # Doji - open ≈ close
    timestamp = base_time + timedelta(days=45)
    candles.append({
        "timestamp": timestamp.isoformat() + "Z",
        "open": 152.0,
        "high": 154.0,
        "low": 150.0,
        "close": 152.1,  # Nearly same as open
        "volume": 1800000
    })
    
    return candles

def generate_engulfing_pattern():
    """Generate sample data with bullish engulfing"""
    base_time = datetime.now() - timedelta(days=50)
    candles = []
    
    # Downtrend
    for i in range(43):
        timestamp = base_time + timedelta(days=i)
        open_price = 160 - i * 0.7
        candles.append({
            "timestamp": timestamp.isoformat() + "Z",
            "open": open_price,
            "high": open_price + 0.8,
            "low": open_price - 1.2,
            "close": open_price - 0.6,
            "volume": 1000000
        })
    
    # Small bearish candle
    timestamp = base_time + timedelta(days=43)
    candles.append({
        "timestamp": timestamp.isoformat() + "Z",
        "open": 131.0,
        "high": 131.5,
        "low": 129.5,
        "close": 130.0,
        "volume": 900000
    })
    
    # Large bullish engulfing candle
    timestamp = base_time + timedelta(days=44)
    candles.append({
        "timestamp": timestamp.isoformat() + "Z",
        "open": 129.0,  # Below previous close
        "high": 133.0,
        "low": 128.5,
        "close": 132.5,  # Above previous open
        "volume": 2500000  # High volume
    })
    
    return candles

def test_pattern_detection(symbol, pattern_name, candles):
    """Test pattern detection"""
    print(f"🔍 Testing {pattern_name} detection for {symbol}...")
    
    payload = {
        "symbol": symbol,
        "timeframe": "1d",
        "candles": candles,
        "context": {
            "rsi": 65.0,
            "macd": 0.5,
            "volume_ratio": 1.2
        }
    }
    
    response = requests.post(f"{BASE_URL}/detect", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Detection successful!")
        print(f"   Total patterns found: {data['total_patterns']}")
        print(f"   Detection time: {data['detection_time_ms']:.2f}ms")
        
        if data['patterns']:
            for i, pattern in enumerate(data['patterns'], 1):
                print(f"\n   Pattern {i}:")
                print(f"     Type: {pattern['pattern_type']}")
                print(f"     Confidence: {pattern['confidence']:.1%}")
                print(f"     Direction: {pattern['direction']}")
                print(f"     Strength: {'⭐' * pattern['strength']}")
                print(f"     Index: {pattern['start_index']}-{pattern['end_index']}")
                print(f"     Price: ${pattern['price_at_detection']:.2f}")
        else:
            print(f"   ⚠️  No patterns detected (confidence threshold may be too high)")
        print()
    else:
        print(f"   ❌ Error: {response.status_code}")
        print(f"   {response.text}\n")
    
    return response.status_code == 200

def test_realtime_detection():
    """Test real-time pattern detection"""
    print("⚡ Testing real-time pattern detection...")
    
    # Recent candles (historical context)
    base_time = datetime.now() - timedelta(hours=20)
    recent_candles = []
    for i in range(20):
        timestamp = base_time + timedelta(hours=i)
        open_price = 150 - i * 0.3
        recent_candles.append({
            "timestamp": timestamp.isoformat() + "Z",
            "open": open_price,
            "high": open_price + 0.5,
            "low": open_price - 0.8,
            "close": open_price - 0.3,
            "volume": 1000000
        })
    
    # New incoming candle (hammer)
    new_candle = {
        "timestamp": (datetime.now()).isoformat() + "Z",
        "open": 144.0,
        "high": 144.5,
        "low": 140.0,  # Long lower shadow
        "close": 144.2,
        "volume": 2000000
    }
    
    payload = {
        "symbol": "TSLA",
        "new_candle": new_candle,
        "recent_candles": recent_candles
    }
    
    response = requests.post(f"{BASE_URL}/detect/realtime", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Real-time detection successful!")
        
        if data.get('pattern_detected'):
            pattern = data['pattern']
            print(f"   🎯 Pattern found!")
            print(f"     Type: {pattern['pattern_type']}")
            print(f"     Confidence: {pattern['confidence']:.1%}")
            print(f"     Direction: {pattern['direction']}")
            print(f"     Alert: {data.get('alert', 'N/A')}")
        else:
            print(f"   ℹ️  No pattern detected in new candle")
        print()
    else:
        print(f"   ❌ Error: {response.status_code}")
        print(f"   {response.text}\n")
    
    return response.status_code == 200

def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 AI Candlestick Pattern Detection - Test Suite")
    print("=" * 60)
    print()
    
    # Test 1: Health check
    if not test_health():
        print("❌ Service is not healthy. Exiting.")
        return
    
    # Test 2: Pattern types
    pattern_types = test_pattern_types()
    
    # Test 3: Hammer detection
    hammer_candles = generate_hammer_pattern()
    test_pattern_detection("AAPL", "Hammer", hammer_candles)
    
    # Test 4: Doji detection
    doji_candles = generate_doji_pattern()
    test_pattern_detection("MSFT", "Doji", doji_candles)
    
    # Test 5: Engulfing detection
    engulfing_candles = generate_engulfing_pattern()
    test_pattern_detection("GOOGL", "Bullish Engulfing", engulfing_candles)
    
    # Test 6: Real-time detection
    test_realtime_detection()
    
    print("=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)
    print()
    print("📚 Next steps:")
    print("  1. Review detected patterns above")
    print("  2. Integrate with Flutter mobile app")
    print("  3. Add pattern overlays to charts")
    print("  4. Set up real-time streaming")
    print()

if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to pattern detection service!")
        print("   Please ensure the service is running:")
        print("   python python/pattern_detection_api.py")
        print()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
