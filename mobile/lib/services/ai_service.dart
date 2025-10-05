import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../models/ai_insight.dart';

class AIService {
  final Dio _dio;

  AIService() : _dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  Future<List<AIInsight>> getInsights(String symbol) async {
    try {
      final response = await _dio.get(
        '/api/blog/generate-insights',
        queryParameters: {
          'symbol': symbol,
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['insights'] as List<dynamic>;
        return data.map((json) => AIInsight.fromJson(json as Map<String, dynamic>)).toList();
      } else {
        throw Exception('Failed to load AI insights');
      }
    } catch (e) {
      throw Exception('Error fetching AI insights: $e');
    }
  }
}

final aiServiceProvider = Provider<AIService>((ref) {
  return AIService();
});
