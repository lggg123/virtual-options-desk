import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../models/candle.dart';

class MarketDataService {
  final Dio _dio;

  MarketDataService() : _dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    connectTimeout: const Duration(seconds: 5),
    receiveTimeout: const Duration(seconds: 3),
  ));

  Future<List<Candle>> getCandles(String symbol, {String timeframe = '1D'}) async {
    try {
      final response = await _dio.get(
        '${AppConfig.marketDataEndpoint}/$symbol/candles',
        queryParameters: {
          'timeframe': timeframe,
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data as List<dynamic>;
        return data.map((json) => Candle.fromJson(json as Map<String, dynamic>)).toList();
      } else {
        throw Exception('Failed to load candles');
      }
    } catch (e) {
      throw Exception('Error fetching candles: $e');
    }
  }

  Future<Map<String, dynamic>> getQuote(String symbol) async {
    try {
      final response = await _dio.get(
        '${AppConfig.marketDataEndpoint}/$symbol/quote',
      );

      if (response.statusCode == 200) {
        return response.data as Map<String, dynamic>;
      } else {
        throw Exception('Failed to load quote');
      }
    } catch (e) {
      throw Exception('Error fetching quote: $e');
    }
  }
}

final marketDataServiceProvider = Provider<MarketDataService>((ref) {
  return MarketDataService();
});
