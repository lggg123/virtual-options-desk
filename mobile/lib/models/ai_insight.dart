class AIInsight {
  final String type; // 'bullish', 'bearish', 'neutral'
  final String title;
  final String description;
  final double confidence;
  final DateTime timestamp;

  AIInsight({
    required this.type,
    required this.title,
    required this.description,
    required this.confidence,
    required this.timestamp,
  });

  factory AIInsight.fromJson(Map<String, dynamic> json) {
    return AIInsight(
      type: json['type'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      confidence: (json['confidence'] as num).toDouble(),
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'title': title,
      'description': description,
      'confidence': confidence,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
