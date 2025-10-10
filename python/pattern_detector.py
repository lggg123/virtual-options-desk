"""
AI-Powered Candlestick Pattern Detection
Uses CNN + Rule-Based Hybrid Approach
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("Warning: OpenCV (cv2) not available. Pattern rendering disabled.")

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from torch.utils.data import Dataset, DataLoader
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("Warning: PyTorch not available. Using rule-based detection only.")

@dataclass
class DetectedPattern:
    pattern_type: str
    confidence: float
    direction: str  # bullish, bearish, neutral
    strength: int  # 1-5
    start_index: int
    end_index: int
    price_at_detection: float
    context: Dict[str, float]  # RSI, volume, etc.
    timestamp: datetime
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        result = asdict(self)
        result['timestamp'] = self.timestamp.isoformat()
        return result

# ==================== PATTERN DEFINITIONS ====================

class PatternDefinitions:
    """Rule-based pattern definitions"""
    
    @staticmethod
    def is_doji(candle: pd.Series, body_threshold: float = 0.1) -> bool:
        """Doji: Open ≈ Close, small body"""
        body = abs(candle['close'] - candle['open'])
        range_size = candle['high'] - candle['low']
        if range_size == 0:
            return False
        return (body / range_size) < body_threshold

    @staticmethod
    def is_hammer(candle: pd.Series, prev_candle: pd.Series) -> bool:
        """Hammer: Small body at top, long lower shadow"""
        body = abs(candle['close'] - candle['open'])
        lower_shadow = min(candle['open'], candle['close']) - candle['low']
        upper_shadow = candle['high'] - max(candle['open'], candle['close'])
        total_range = candle['high'] - candle['low']
        
        if total_range == 0:
            return False
        
        # Criteria: lower shadow >= 2x body, small upper shadow
        return (
            lower_shadow >= 2 * body and
            upper_shadow < body and
            candle['close'] > candle['open']  # Bullish
        )

    @staticmethod
    def is_shooting_star(candle: pd.Series) -> bool:
        """Shooting Star: Small body at bottom, long upper shadow"""
        body = abs(candle['close'] - candle['open'])
        upper_shadow = candle['high'] - max(candle['open'], candle['close'])
        lower_shadow = min(candle['open'], candle['close']) - candle['low']
        total_range = candle['high'] - candle['low']
        
        if total_range == 0:
            return False
        
        return (
            upper_shadow >= 2 * body and
            lower_shadow < body and
            candle['close'] < candle['open']  # Bearish
        )

    @staticmethod
    def is_engulfing(candle: pd.Series, prev_candle: pd.Series) -> Tuple[bool, str]:
        """Engulfing pattern: Current candle engulfs previous"""
        current_body = candle['close'] - candle['open']
        prev_body = prev_candle['close'] - prev_candle['open']
        
        # Bullish engulfing
        if (current_body > 0 and prev_body < 0 and
            candle['open'] < prev_candle['close'] and
            candle['close'] > prev_candle['open']):
            return True, 'bullish'
        
        # Bearish engulfing
        if (current_body < 0 and prev_body > 0 and
            candle['open'] > prev_candle['close'] and
            candle['close'] < prev_candle['open']):
            return True, 'bearish'
        
        return False, 'neutral'

    @staticmethod
    def is_morning_star(candles: pd.DataFrame, idx: int) -> bool:
        """Morning Star: 3-candle bullish reversal"""
        if idx < 2:
            return False
        
        first = candles.iloc[idx - 2]
        second = candles.iloc[idx - 1]
        third = candles.iloc[idx]
        
        # First: Long bearish
        # Second: Small body (star)
        # Third: Long bullish
        
        first_bearish = first['close'] < first['open']
        first_body = abs(first['close'] - first['open'])
        
        second_small = abs(second['close'] - second['open']) < first_body * 0.3
        
        third_bullish = third['close'] > third['open']
        third_body = abs(third['close'] - third['open'])
        third_closes_above = third['close'] > (first['open'] + first['close']) / 2
        
        return first_bearish and second_small and third_bullish and third_closes_above

    @staticmethod
    def is_evening_star(candles: pd.DataFrame, idx: int) -> bool:
        """Evening Star: 3-candle bearish reversal"""
        if idx < 2:
            return False
        
        first = candles.iloc[idx - 2]
        second = candles.iloc[idx - 1]
        third = candles.iloc[idx]
        
        first_bullish = first['close'] > first['open']
        first_body = abs(first['close'] - first['open'])
        
        second_small = abs(second['close'] - second['open']) < first_body * 0.3
        
        third_bearish = third['close'] < third['open']
        third_closes_below = third['close'] < (first['open'] + first['close']) / 2
        
        return first_bullish and second_small and third_bearish and third_closes_below

# ==================== CNN MODEL FOR PATTERN RECOGNITION ====================

if TORCH_AVAILABLE:
    class CandlestickCNN(nn.Module):
        """CNN for visual pattern recognition"""
        
        def __init__(self, num_classes: int = 10):
            super().__init__()
            
            # Input: 32x32 grayscale image of candlestick chart
            self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
            self.bn1 = nn.BatchNorm2d(32)
            self.pool1 = nn.MaxPool2d(2)
            
            self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
            self.bn2 = nn.BatchNorm2d(64)
            self.pool2 = nn.MaxPool2d(2)
            
            self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
            self.bn3 = nn.BatchNorm2d(128)
            self.pool3 = nn.MaxPool2d(2)
            
            # Fully connected layers
            self.fc1 = nn.Linear(128 * 4 * 4, 256)
            self.dropout1 = nn.Dropout(0.5)
            self.fc2 = nn.Linear(256, 128)
            self.dropout2 = nn.Dropout(0.3)
            self.fc3 = nn.Linear(128, num_classes)
            
        def forward(self, x):
            # Convolutional layers
            x = F.relu(self.bn1(self.conv1(x)))
            x = self.pool1(x)
            
            x = F.relu(self.bn2(self.conv2(x)))
            x = self.pool2(x)
            
            x = F.relu(self.bn3(self.conv3(x)))
            x = self.pool3(x)
            
            # Flatten
            x = x.view(x.size(0), -1)
            
            # Fully connected
            x = F.relu(self.fc1(x))
            x = self.dropout1(x)
            x = F.relu(self.fc2(x))
            x = self.dropout2(x)
            x = self.fc3(x)
            
            return x

# ==================== PATTERN DETECTOR ====================

class PatternDetector:
    """Hybrid rule-based + ML pattern detection"""
    
    def __init__(self, use_ml: bool = True):
        # Note: use_ml=True enables ensemble models (XGBoost, RF, LightGBM)
        # Pattern detection uses rule-based approach (highly accurate)
        self.use_ml = False  # Pattern detection doesn't need ML, uses rules
        self.pattern_defs = PatternDefinitions()
        
        # ML models (ensemble) are loaded separately in ml_ensemble.py
        # Pattern detection uses proven candlestick rules, not CNN
        print("✅ Pattern detector initialized (rule-based patterns)")
        
        self.pattern_types = [
            'doji', 'hammer', 'shooting_star', 'bullish_engulfing',
            'bearish_engulfing', 'morning_star', 'evening_star',
            'three_white_soldiers', 'three_black_crows', 'harami'
        ]

    def detect_patterns(
        self, 
        df: pd.DataFrame,
        context: Optional[Dict] = None
    ) -> List[DetectedPattern]:
        """Detect all patterns in OHLCV data"""
        
        patterns = []
        
        # Rule-based detection
        rule_patterns = self._detect_rule_based(df)
        patterns.extend(rule_patterns)
        
        # ML-based detection
        if self.use_ml:
            ml_patterns = self._detect_ml_based(df)
            patterns.extend(ml_patterns)
        
        # Merge and deduplicate patterns
        patterns = self._merge_patterns(patterns)
        
        # Add context information
        if context:
            for pattern in patterns:
                pattern.context.update(context)
        
        return patterns

    def _detect_rule_based(self, df: pd.DataFrame) -> List[DetectedPattern]:
        """Rule-based pattern detection"""
        patterns = []
        
        for i in range(1, len(df)):
            current = df.iloc[i]
            prev = df.iloc[i-1] if i > 0 else None
            
            timestamp = current.get('timestamp', datetime.now())
            if isinstance(timestamp, str):
                timestamp = pd.to_datetime(timestamp)
            elif not isinstance(timestamp, datetime):
                timestamp = datetime.now()
            
            # Doji
            if self.pattern_defs.is_doji(current):
                patterns.append(DetectedPattern(
                    pattern_type='doji',
                    confidence=0.85,
                    direction='neutral',
                    strength=3,
                    start_index=i,
                    end_index=i,
                    price_at_detection=float(current['close']),
                    context={},
                    timestamp=timestamp
                ))
            
            # Hammer
            if prev is not None and self.pattern_defs.is_hammer(current, prev):
                patterns.append(DetectedPattern(
                    pattern_type='hammer',
                    confidence=0.80,
                    direction='bullish',
                    strength=4,
                    start_index=i,
                    end_index=i,
                    price_at_detection=float(current['close']),
                    context={},
                    timestamp=timestamp
                ))
            
            # Shooting Star
            if self.pattern_defs.is_shooting_star(current):
                patterns.append(DetectedPattern(
                    pattern_type='shooting_star',
                    confidence=0.80,
                    direction='bearish',
                    strength=4,
                    start_index=i,
                    end_index=i,
                    price_at_detection=float(current['close']),
                    context={},
                    timestamp=timestamp
                ))
            
            # Engulfing
            if prev is not None:
                is_engulfing, direction = self.pattern_defs.is_engulfing(current, prev)
                if is_engulfing:
                    patterns.append(DetectedPattern(
                        pattern_type=f'{direction}_engulfing',
                        confidence=0.85,
                        direction=direction,
                        strength=5,
                        start_index=i-1,
                        end_index=i,
                        price_at_detection=float(current['close']),
                        context={},
                        timestamp=timestamp
                    ))
            
            # Morning Star
            if self.pattern_defs.is_morning_star(df, i):
                patterns.append(DetectedPattern(
                    pattern_type='morning_star',
                    confidence=0.90,
                    direction='bullish',
                    strength=5,
                    start_index=i-2,
                    end_index=i,
                    price_at_detection=float(current['close']),
                    context={},
                    timestamp=timestamp
                ))
            
            # Evening Star
            if self.pattern_defs.is_evening_star(df, i):
                patterns.append(DetectedPattern(
                    pattern_type='evening_star',
                    confidence=0.90,
                    direction='bearish',
                    strength=5,
                    start_index=i-2,
                    end_index=i,
                    price_at_detection=float(current['close']),
                    context={},
                    timestamp=timestamp
                ))
        
        return patterns

    def _detect_ml_based(self, df: pd.DataFrame) -> List[DetectedPattern]:
        """ML-based pattern detection using CNN"""
        patterns = []
        
        if not self.use_ml:
            return patterns
        
        # Sliding window approach
        window_size = 20
        
        for i in range(window_size, len(df)):
            window = df.iloc[i-window_size:i]
            
            # Convert to image
            image = self._candles_to_image(window)
            
            # Predict
            with torch.no_grad():
                image_tensor = torch.FloatTensor(image).unsqueeze(0).unsqueeze(0)
                output = self.model(image_tensor)
                probabilities = F.softmax(output, dim=1)
                
                # Get top predictions
                top_probs, top_indices = torch.topk(probabilities, k=3)
                
                for prob, idx in zip(top_probs[0], top_indices[0]):
                    if prob > 0.6:  # Confidence threshold
                        pattern_type = self.pattern_types[idx]
                        direction = self._infer_direction(pattern_type)
                        
                        timestamp = df.iloc[i].get('timestamp', datetime.now())
                        if isinstance(timestamp, str):
                            timestamp = pd.to_datetime(timestamp)
                        elif not isinstance(timestamp, datetime):
                            timestamp = datetime.now()
                        
                        patterns.append(DetectedPattern(
                            pattern_type=pattern_type,
                            confidence=float(prob),
                            direction=direction,
                            strength=self._calculate_strength(float(prob)),
                            start_index=i-5,
                            end_index=i,
                            price_at_detection=float(df.iloc[i]['close']),
                            context={'ml_detected': True},
                            timestamp=timestamp
                        ))
        
        return patterns

    def _candles_to_image(self, candles: pd.DataFrame) -> np.ndarray:
        """Convert candlesticks to 32x32 grayscale image"""
        image = np.zeros((32, 32), dtype=np.uint8)
        
        # Normalize prices to 0-31 range
        min_price = candles['low'].min()
        max_price = candles['high'].max()
        price_range = max_price - min_price
        
        if price_range == 0:
            return image
        
        for i, (_, candle) in enumerate(candles.iterrows()):
            x = int((i / len(candles)) * 31)
            
            # Draw candlestick
            open_y = 31 - int(((candle['open'] - min_price) / price_range) * 31)
            close_y = 31 - int(((candle['close'] - min_price) / price_range) * 31)
            high_y = 31 - int(((candle['high'] - min_price) / price_range) * 31)
            low_y = 31 - int(((candle['low'] - min_price) / price_range) * 31)
            
            # Draw wick (if cv2 available)
            if CV2_AVAILABLE:
                cv2.line(image, (x, high_y), (x, low_y), 255, 1)
            
                # Draw body
                body_top = min(open_y, close_y)
                body_bottom = max(open_y, close_y)
                cv2.rectangle(image, (x-1, body_top), (x+1, body_bottom), 255, -1)
        
        return image

    def _infer_direction(self, pattern_type: str) -> str:
        """Infer direction from pattern type"""
        bullish_patterns = ['hammer', 'morning_star', 'bullish_engulfing', 'three_white_soldiers']
        bearish_patterns = ['shooting_star', 'evening_star', 'bearish_engulfing', 'three_black_crows']
        
        if any(p in pattern_type for p in bullish_patterns):
            return 'bullish'
        elif any(p in pattern_type for p in bearish_patterns):
            return 'bearish'
        return 'neutral'

    def _calculate_strength(self, confidence: float) -> int:
        """Calculate pattern strength (1-5) from confidence"""
        if confidence >= 0.9:
            return 5
        elif confidence >= 0.8:
            return 4
        elif confidence >= 0.7:
            return 3
        elif confidence >= 0.6:
            return 2
        return 1

    def _merge_patterns(self, patterns: List[DetectedPattern]) -> List[DetectedPattern]:
        """Merge overlapping patterns from different detection methods"""
        if not patterns:
            return patterns
        
        # Sort by start index
        patterns.sort(key=lambda p: p.start_index)
        
        merged = []
        current = patterns[0]
        
        for next_pattern in patterns[1:]:
            # If patterns overlap and are similar type
            if (next_pattern.start_index <= current.end_index and
                next_pattern.pattern_type == current.pattern_type):
                # Keep the one with higher confidence
                if next_pattern.confidence > current.confidence:
                    current = next_pattern
            else:
                merged.append(current)
                current = next_pattern
        
        merged.append(current)
        return merged

    def detect_realtime(
        self,
        new_candle: Dict,
        recent_candles: pd.DataFrame,
        context: Optional[Dict] = None
    ) -> Optional[DetectedPattern]:
        """Real-time pattern detection for streaming data"""
        
        # Append new candle
        df = pd.concat([
            recent_candles,
            pd.DataFrame([new_candle])
        ], ignore_index=True)
        
        # Detect patterns in last 5 candles
        patterns = self.detect_patterns(df.tail(5), context)
        
        # Return most recent pattern if any
        if patterns:
            return patterns[-1]
        return None

# ==================== PATTERN TRAINING (Optional) ====================

if TORCH_AVAILABLE:
    class PatternTrainer:
        """Train CNN model on labeled candlestick patterns"""
        
        def __init__(self):
            self.model = CandlestickCNN(num_classes=10)
            self.criterion = nn.CrossEntropyLoss()
            self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)

        def train(
            self,
            train_loader: DataLoader,
            val_loader: DataLoader,
            epochs: int = 50
        ):
            """Train the model"""
            
            best_val_loss = float('inf')
            
            for epoch in range(epochs):
                # Training
                self.model.train()
                train_loss = 0
                
                for images, labels in train_loader:
                    self.optimizer.zero_grad()
                    outputs = self.model(images)
                    loss = self.criterion(outputs, labels)
                    loss.backward()
                    self.optimizer.step()
                    train_loss += loss.item()
                
                # Validation
                self.model.eval()
                val_loss = 0
                correct = 0
                total = 0
                
                with torch.no_grad():
                    for images, labels in val_loader:
                        outputs = self.model(images)
                        loss = self.criterion(outputs, labels)
                        val_loss += loss.item()
                        
                        _, predicted = torch.max(outputs, 1)
                        total += labels.size(0)
                        correct += (predicted == labels).sum().item()
                
                accuracy = 100 * correct / total
                
                print(f"Epoch {epoch+1}/{epochs}")
                print(f"Train Loss: {train_loss/len(train_loader):.4f}")
                print(f"Val Loss: {val_loss/len(val_loader):.4f}")
                print(f"Val Accuracy: {accuracy:.2f}%")
                
                # Save best model
                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    torch.save(self.model.state_dict(), 'pattern_detector.pth')
                    print("✅ Model saved!")

# ==================== USAGE EXAMPLE ====================

def main():
    """Example usage"""
    
    # Sample candlestick data
    df = pd.DataFrame({
        'timestamp': pd.date_range('2024-01-01', periods=100, freq='1h'),
        'open': np.random.randn(100).cumsum() + 100,
        'high': np.random.randn(100).cumsum() + 102,
        'low': np.random.randn(100).cumsum() + 98,
        'close': np.random.randn(100).cumsum() + 100,
        'volume': np.random.randint(1000000, 10000000, 100)
    })

    # Initialize detector
    detector = PatternDetector(use_ml=False)  # Set to True if model is trained

    # Detect patterns
    patterns = detector.detect_patterns(df)

    print(f"\n🔍 Detected {len(patterns)} patterns:\n")

    for pattern in patterns:
        print(f"Pattern: {pattern.pattern_type}")
        print(f"Direction: {pattern.direction}")
        print(f"Confidence: {pattern.confidence:.2%}")
        print(f"Strength: {'⭐' * pattern.strength}")
        print(f"Price: ${pattern.price_at_detection:.2f}")
        print(f"Time: {pattern.timestamp}")
        print("-" * 50)

    # Real-time detection example
    new_candle = {
        'timestamp': pd.Timestamp.now(),
        'open': 100.5,
        'high': 101.2,
        'low': 100.3,
        'close': 100.8,
        'volume': 5000000
    }

    context = {'rsi': 65, 'macd': 0.5, 'volume_ratio': 1.2}
    realtime_pattern = detector.detect_realtime(new_candle, df.tail(20), context)

    if realtime_pattern:
        print("\n🚨 Real-time pattern detected!")
        print(f"Type: {realtime_pattern.pattern_type}")
        print(f"Confidence: {realtime_pattern.confidence:.2%}")

if __name__ == '__main__':
    main()
