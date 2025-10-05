import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/ai_insight.dart';
import '../services/ai_service.dart';

final aiInsightsProvider = FutureProvider.family<List<AIInsight>, String>((ref, symbol) async {
  final aiService = ref.watch(aiServiceProvider);
  return aiService.getInsights(symbol);
});
