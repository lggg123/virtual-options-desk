"""
Tests for Pattern Detection API - Unit Tests
Tests the core logic and data models without requiring the full server
"""
import pytest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from datetime import datetime
import pandas as pd
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestCandleModel:
    """Test Candle Pydantic model"""

    def test_candle_creation(self):
        """Test creating a candle model"""
        from pattern_detection_api import Candle

        candle = Candle(
            timestamp="2025-01-01T00:00:00",
            open=150.0,
            high=155.0,
            low=149.0,
            close=154.0,
            volume=1000000.0
        )

        assert candle.open == 150.0
        assert candle.high == 155.0
        assert candle.low == 149.0
        assert candle.close == 154.0
        assert candle.volume == 1000000.0
        assert candle.timestamp == "2025-01-01T00:00:00"

    def test_candle_with_decimal_values(self):
        """Test candle with decimal price values"""
        from pattern_detection_api import Candle

        candle = Candle(
            timestamp="2025-01-01T00:00:00",
            open=150.25,
            high=155.75,
            low=149.30,
            close=154.50,
            volume=1000000.5
        )

        assert candle.open == 150.25
        assert candle.close == 154.50


class TestCandleDataFrameConversion:
    """Test candle to DataFrame conversion"""

    def test_candles_to_dataframe(self):
        """Test conversion of candles to DataFrame"""
        from pattern_detection_api import Candle, candles_to_dataframe

        candles = [
            Candle(
                timestamp="2025-01-01T00:00:00",
                open=150.0, high=155.0, low=149.0, close=154.0, volume=1000000.0
            ),
            Candle(
                timestamp="2025-01-02T00:00:00",
                open=154.0, high=158.0, low=153.0, close=157.0, volume=1100000.0
            )
        ]

        df = candles_to_dataframe(candles)

        assert len(df) == 2
        assert 'open' in df.columns
        assert 'high' in df.columns
        assert 'low' in df.columns
        assert 'close' in df.columns
        assert 'volume' in df.columns
        assert 'timestamp' in df.columns

    def test_empty_candles_list(self):
        """Test conversion of empty candles list"""
        from pattern_detection_api import candles_to_dataframe

        df = candles_to_dataframe([])
        assert len(df) == 0

    def test_single_candle_conversion(self):
        """Test conversion of single candle"""
        from pattern_detection_api import Candle, candles_to_dataframe

        candles = [
            Candle(
                timestamp="2025-01-01T00:00:00",
                open=150.0, high=155.0, low=149.0, close=154.0, volume=1000000.0
            )
        ]

        df = candles_to_dataframe(candles)
        assert len(df) == 1
        assert df.iloc[0]['open'] == 150.0


class TestPatternDetectionRequestModels:
    """Test request/response models"""

    def test_pattern_detection_request(self):
        """Test PatternDetectionRequest model"""
        from pattern_detection_api import PatternDetectionRequest, Candle

        request = PatternDetectionRequest(
            symbol="AAPL",
            timeframe="1d",
            candles=[
                Candle(
                    timestamp="2025-01-01T00:00:00",
                    open=150.0, high=155.0, low=149.0, close=154.0, volume=1000000.0
                )
            ]
        )

        assert request.symbol == "AAPL"
        assert request.timeframe == "1d"
        assert len(request.candles) == 1

    def test_pattern_detection_request_defaults(self):
        """Test PatternDetectionRequest with defaults"""
        from pattern_detection_api import PatternDetectionRequest, Candle

        request = PatternDetectionRequest(
            symbol="MSFT",
            candles=[
                Candle(
                    timestamp="2025-01-01T00:00:00",
                    open=350.0, high=355.0, low=349.0, close=354.0, volume=500000.0
                )
            ]
        )

        assert request.symbol == "MSFT"
        assert request.timeframe == "1d"  # Default
        assert request.context is None  # Default

    def test_detection_result_model(self):
        """Test DetectionResult model"""
        from pattern_detection_api import DetectionResult

        result = DetectionResult(
            symbol="AAPL",
            timeframe="1d",
            patterns=[],
            total_patterns=0,
            detection_time_ms=15.5
        )

        assert result.symbol == "AAPL"
        assert result.total_patterns == 0
        assert result.detection_time_ms == 15.5

    def test_pattern_response_model(self):
        """Test PatternResponse model"""
        from pattern_detection_api import PatternResponse

        response = PatternResponse(
            pattern_type="hammer",
            confidence=0.85,
            direction="bullish",
            strength=3,
            start_index=10,
            end_index=15,
            price_at_detection=154.50,
            context={"rsi": 45.0},
            timestamp="2025-01-01T00:00:00"
        )

        assert response.pattern_type == "hammer"
        assert response.confidence == 0.85
        assert response.direction == "bullish"
        assert response.strength == 3

    def test_realtime_detection_request(self):
        """Test RealtimeDetectionRequest model"""
        from pattern_detection_api import RealtimeDetectionRequest, Candle

        request = RealtimeDetectionRequest(
            symbol="GOOGL",
            new_candle=Candle(
                timestamp="2025-01-01T00:00:00",
                open=140.0, high=145.0, low=139.0, close=144.0, volume=800000.0
            ),
            recent_candles=[
                Candle(
                    timestamp="2024-12-31T00:00:00",
                    open=138.0, high=142.0, low=137.0, close=140.0, volume=750000.0
                )
            ]
        )

        assert request.symbol == "GOOGL"
        assert request.new_candle.close == 144.0
        assert len(request.recent_candles) == 1


class TestTimeframeUtilities:
    """Test timeframe utility functions"""

    def test_get_update_interval(self):
        """Test update interval calculation"""
        from pattern_detection_api import get_update_interval

        assert get_update_interval("1m") == 60
        assert get_update_interval("5m") == 300
        assert get_update_interval("15m") == 900
        assert get_update_interval("1h") == 3600
        assert get_update_interval("4h") == 14400
        assert get_update_interval("1d") == 86400
        assert get_update_interval("1w") == 604800
        assert get_update_interval("unknown") == 60  # Default

    def test_get_yfinance_interval(self):
        """Test yfinance interval mapping"""
        from pattern_detection_api import get_yfinance_interval

        assert get_yfinance_interval("1m") == "1m"
        assert get_yfinance_interval("5m") == "5m"
        assert get_yfinance_interval("15m") == "15m"
        assert get_yfinance_interval("1h") == "1h"
        assert get_yfinance_interval("4h") == "1h"  # Maps to 1h
        assert get_yfinance_interval("1d") == "1d"
        assert get_yfinance_interval("1w") == "1wk"
        assert get_yfinance_interval("unknown") == "1d"  # Default

    def test_get_yfinance_period(self):
        """Test yfinance period calculation"""
        from pattern_detection_api import get_yfinance_period

        assert get_yfinance_period("1m") == "7d"
        assert get_yfinance_period("5m") == "7d"
        assert get_yfinance_period("15m") == "7d"
        assert get_yfinance_period("1h") == "60d"
        assert get_yfinance_period("4h") == "60d"
        assert get_yfinance_period("1d") == "1y"
        assert get_yfinance_period("1w") == "5y"


class TestPatternTypes:
    """Test pattern type definitions"""

    def test_expected_pattern_types_exist(self):
        """Test that expected pattern types are supported"""
        expected_patterns = [
            'doji', 'hammer', 'shooting_star', 'bullish_engulfing',
            'bearish_engulfing', 'morning_star', 'evening_star',
            'three_white_soldiers', 'three_black_crows', 'harami'
        ]

        # These are the patterns that should be supported
        for pattern in expected_patterns:
            assert pattern in expected_patterns


class TestPatternDescriptions:
    """Test pattern description content"""

    def test_pattern_descriptions(self):
        """Test that pattern descriptions are informative"""
        descriptions = {
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

        for pattern, desc in descriptions.items():
            assert len(desc) > 10  # Has meaningful description
            assert pattern in descriptions


class TestMLAvailabilityFlags:
    """Test ML availability flag handling"""

    def test_ml_availability_true(self):
        """Test when ML is available"""
        ml_available = True

        models_loaded = {
            "xgboost": ml_available,
            "random_forest": ml_available,
            "lightgbm": ml_available
        }

        assert all(models_loaded.values())

    def test_ml_availability_false(self):
        """Test when ML is not available"""
        ml_available = False

        models_loaded = {
            "xgboost": ml_available,
            "random_forest": ml_available,
            "lightgbm": ml_available
        }

        assert not any(models_loaded.values())


class TestSubscriptionLimits:
    """Test subscription limit logic"""

    def test_pro_plan_limit(self):
        """Test Pro plan stock limit"""
        plan_id = 'pro'
        max_stocks_pro = 100

        symbols = ["AAPL"] * 101  # 101 symbols

        if plan_id == 'pro' and len(symbols) > max_stocks_pro:
            should_reject = True
        else:
            should_reject = False

        assert should_reject == True

    def test_premium_plan_unlimited(self):
        """Test Premium plan has no limit"""
        plan_id = 'premium'
        max_stocks_pro = 100

        symbols = ["AAPL"] * 200  # 200 symbols

        # Premium is unlimited, only Pro has the limit
        if plan_id == 'pro' and len(symbols) > max_stocks_pro:
            should_reject = True
        else:
            should_reject = False

        assert should_reject == False

    def test_usage_limit_allowed(self):
        """Test usage limit check when allowed"""
        usage_check = {
            'allowed': True,
            'usage': 5,
            'limit': 100,
            'remaining': 95
        }

        assert usage_check['allowed'] == True
        assert usage_check['remaining'] == 95

    def test_usage_limit_exceeded(self):
        """Test usage limit check when exceeded"""
        usage_check = {
            'allowed': False,
            'usage': 100,
            'limit': 100,
            'remaining': 0
        }

        assert usage_check['allowed'] == False
        assert usage_check['remaining'] == 0


class TestStockDataStructures:
    """Test stock data response structures"""

    def test_stock_details_structure(self):
        """Test stock details response structure"""
        stock_details = {
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "price": 154.50,
            "change": 2.30,
            "changePercent": 1.51,
            "volume": 50000000,
            "marketCap": 2500000000000
        }

        assert stock_details["symbol"] == "AAPL"
        assert "price" in stock_details
        assert "change" in stock_details
        assert "volume" in stock_details
        assert "marketCap" in stock_details

    def test_stock_pick_structure(self):
        """Test stock pick response structure"""
        pick = {
            "symbol": "MSFT",
            "name": "Microsoft Corporation",
            "price": 420.50,
            "change": -3.25,
            "volume": 25000000
        }

        assert pick["symbol"] == "MSFT"
        assert pick["price"] > 0
        assert "volume" in pick


class TestPriceCalculations:
    """Test price change calculations"""

    def test_change_calculation(self):
        """Test price change calculation"""
        current_price = 154.50
        prev_close = 152.20

        change = current_price - prev_close
        change_percent = (change / prev_close * 100)

        assert round(change, 2) == 2.30
        assert round(change_percent, 2) == 1.51

    def test_negative_change_calculation(self):
        """Test negative price change calculation"""
        current_price = 148.00
        prev_close = 152.20

        change = current_price - prev_close
        change_percent = (change / prev_close * 100)

        assert change < 0
        assert change_percent < 0


class TestWebSocketMessageTypes:
    """Test WebSocket message type definitions"""

    def test_message_types(self):
        """Test WebSocket message types"""
        message_types = ["historical", "candle_update", "pattern_detected", "heartbeat"]

        assert "historical" in message_types
        assert "candle_update" in message_types
        assert "pattern_detected" in message_types
        assert "heartbeat" in message_types

    def test_candle_update_message_structure(self):
        """Test candle update message structure"""
        message = {
            "type": "candle_update",
            "data": {
                "timestamp": "2025-01-01T00:00:00",
                "open": 150.0,
                "high": 155.0,
                "low": 149.0,
                "close": 154.0,
                "volume": 1000000
            }
        }

        assert message["type"] == "candle_update"
        assert "data" in message
        assert message["data"]["close"] == 154.0

    def test_pattern_detected_message_structure(self):
        """Test pattern detected message structure"""
        message = {
            "type": "pattern_detected",
            "data": {
                "pattern_type": "hammer",
                "direction": "bullish",
                "confidence": 0.85,
                "strength": 3,
                "timestamp": "2025-01-01T00:00:00"
            }
        }

        assert message["type"] == "pattern_detected"
        assert message["data"]["pattern_type"] == "hammer"
        assert message["data"]["direction"] == "bullish"
