class StockPick {
  final String id;
  final String screenId;
  final String symbol;
  final String? companyName;
  final String? sector;
  final String? industry;
  final double? marketCap;
  final double aiScore;
  final int rank;
  final double confidence;
  final double riskScore;
  final double? predictedReturn;
  final String category;
  final double? xgboostScore;
  final double? randomForestScore;
  final double? lightgbmScore;
  final double? lstmScore;
  final Map<String, dynamic>? factorScores;
  final double? actualReturn1w;
  final double? actualReturn1m;
  final double? actualReturn3m;
  final bool? isWinner;
  final DateTime createdAt;

  StockPick({
    required this.id,
    required this.screenId,
    required this.symbol,
    this.companyName,
    this.sector,
    this.industry,
    this.marketCap,
    required this.aiScore,
    required this.rank,
    required this.confidence,
    required this.riskScore,
    this.predictedReturn,
    required this.category,
    this.xgboostScore,
    this.randomForestScore,
    this.lightgbmScore,
    this.lstmScore,
    this.factorScores,
    this.actualReturn1w,
    this.actualReturn1m,
    this.actualReturn3m,
    this.isWinner,
    required this.createdAt,
  });

  factory StockPick.fromJson(Map<String, dynamic> json) {
    return StockPick(
      id: json['id'] as String,
      screenId: json['screen_id'] as String,
      symbol: json['symbol'] as String,
      companyName: json['company_name'] as String?,
      sector: json['sector'] as String?,
      industry: json['industry'] as String?,
      marketCap: (json['market_cap'] as num?)?.toDouble(),
      aiScore: (json['ai_score'] as num).toDouble(),
      rank: json['rank'] as int,
      confidence: (json['confidence'] as num).toDouble(),
      riskScore: (json['risk_score'] as num).toDouble(),
      predictedReturn: (json['predicted_return'] as num?)?.toDouble(),
      category: json['category'] as String,
      xgboostScore: (json['xgboost_score'] as num?)?.toDouble(),
      randomForestScore: (json['random_forest_score'] as num?)?.toDouble(),
      lightgbmScore: (json['lightgbm_score'] as num?)?.toDouble(),
      lstmScore: (json['lstm_score'] as num?)?.toDouble(),
      factorScores: json['factor_scores'] as Map<String, dynamic>?,
      actualReturn1w: (json['actual_return_1w'] as num?)?.toDouble(),
      actualReturn1m: (json['actual_return_1m'] as num?)?.toDouble(),
      actualReturn3m: (json['actual_return_3m'] as num?)?.toDouble(),
      isWinner: json['is_winner'] as bool?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'screen_id': screenId,
      'symbol': symbol,
      'company_name': companyName,
      'sector': sector,
      'industry': industry,
      'market_cap': marketCap,
      'ai_score': aiScore,
      'rank': rank,
      'confidence': confidence,
      'risk_score': riskScore,
      'predicted_return': predictedReturn,
      'category': category,
      'xgboost_score': xgboostScore,
      'random_forest_score': randomForestScore,
      'lightgbm_score': lightgbmScore,
      'lstm_score': lstmScore,
      'factor_scores': factorScores,
      'actual_return_1w': actualReturn1w,
      'actual_return_1m': actualReturn1m,
      'actual_return_3m': actualReturn3m,
      'is_winner': isWinner,
      'created_at': createdAt.toIso8601String(),
    };
  }

  // Get model breakdown as a map for UI display
  Map<String, double> get modelBreakdown {
    return {
      if (xgboostScore != null) 'XGBoost': xgboostScore!,
      if (randomForestScore != null) 'Random Forest': randomForestScore!,
      if (lightgbmScore != null) 'LightGBM': lightgbmScore!,
      if (lstmScore != null) 'LSTM': lstmScore!,
    };
  }

  // Get top factors sorted by importance
  List<MapEntry<String, double>> get topFactors {
    if (factorScores == null) return [];
    
    final factors = factorScores!
        .entries
        .where((e) => e.value is num)
        .map((e) => MapEntry(e.key, (e.value as num).toDouble()))
        .toList();
    
    factors.sort((a, b) => b.value.compareTo(a.value));
    return factors.take(5).toList();
  }
}
