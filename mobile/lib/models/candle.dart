class Candle {
  final DateTime date;
  final double high;
  final double low;
  final double open;
  final double close;
  final double volume;

  Candle({
    required this.date,
    required this.high,
    required this.low,
    required this.open,
    required this.close,
    required this.volume,
  });

  factory Candle.fromJson(Map<String, dynamic> json) {
    return Candle(
      date: DateTime.parse(json['date'] as String),
      high: (json['high'] as num).toDouble(),
      low: (json['low'] as num).toDouble(),
      open: (json['open'] as num).toDouble(),
      close: (json['close'] as num).toDouble(),
      volume: (json['volume'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date.toIso8601String(),
      'high': high,
      'low': low,
      'open': open,
      'close': close,
      'volume': volume,
    };
  }
}
