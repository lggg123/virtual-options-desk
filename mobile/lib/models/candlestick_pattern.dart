class CandlestickPattern {
  final String id;
  final String symbol;
  final String patternType;
  final String timeframe;
  final double confidence;
  final String direction; // 'bullish', 'bearish', 'neutral'
  final int strength; // 1-5
  final double? priceAtDetection;
  final double? volumeAtDetection;
  final double? rsiAtDetection;
  final double? priceChange1h;
  final double? priceChange1d;
  final bool? patternSuccess;
  final DateTime detectedAt;

  CandlestickPattern({
    required this.id,
    required this.symbol,
    required this.patternType,
    required this.timeframe,
    required this.confidence,
    required this.direction,
    required this.strength,
    this.priceAtDetection,
    this.volumeAtDetection,
    this.rsiAtDetection,
    this.priceChange1h,
    this.priceChange1d,
    this.patternSuccess,
    required this.detectedAt,
  });

  factory CandlestickPattern.fromJson(Map<String, dynamic> json) {
    return CandlestickPattern(
      id: json['id'] as String,
      symbol: json['symbol'] as String,
      patternType: json['pattern_type'] as String,
      timeframe: json['timeframe'] as String,
      confidence: (json['confidence'] as num).toDouble(),
      direction: json['direction'] as String,
      strength: json['strength'] as int,
      priceAtDetection: (json['price_at_detection'] as num?)?.toDouble(),
      volumeAtDetection: (json['volume_at_detection'] as num?)?.toDouble(),
      rsiAtDetection: (json['rsi_at_detection'] as num?)?.toDouble(),
      priceChange1h: (json['price_change_1h'] as num?)?.toDouble(),
      priceChange1d: (json['price_change_1d'] as num?)?.toDouble(),
      patternSuccess: json['pattern_success'] as bool?,
      detectedAt: DateTime.parse(json['detected_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'symbol': symbol,
      'pattern_type': patternType,
      'timeframe': timeframe,
      'confidence': confidence,
      'direction': direction,
      'strength': strength,
      'price_at_detection': priceAtDetection,
      'volume_at_detection': volumeAtDetection,
      'rsi_at_detection': rsiAtDetection,
      'price_change_1h': priceChange1h,
      'price_change_1d': priceChange1d,
      'pattern_success': patternSuccess,
      'detected_at': detectedAt.toIso8601String(),
    };
  }

  // Helper to get pattern display name
  String get displayName {
    return patternType
        .split('_')
        .map((word) => word[0].toUpperCase() + word.substring(1))
        .join(' ');
  }

  // Helper to determine if pattern is bullish
  bool get isBullish => direction == 'bullish';
  
  // Helper to determine if pattern is bearish
  bool get isBearish => direction == 'bearish';
}
