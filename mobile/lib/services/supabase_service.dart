import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../config/supabase_config.dart';
import '../models/stock_pick.dart';
import '../models/candlestick_pattern.dart';
import '../models/candle.dart';

class SupabaseService {
  final Logger _logger = Logger();
  SupabaseClient get _client => SupabaseConfig.client;
  late final Dio _dio;
  
  SupabaseService() {
    final apiUrl = dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000/api';
    _dio = Dio(BaseOptions(
      baseUrl: apiUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
    ));
  }

  // ==================== STOCK PICKS ====================

  /// Get top stock picks from the latest screening run
  Future<List<StockPick>> getTopPicks({
    int limit = 100,
    String? category,
    double? minConfidence,
    double? maxRisk,
  }) async {
    try {
      var builder = _client
          .from('stock_picks')
          .select('''
            *,
            monthly_screens!inner(run_date)
          ''');

      // Filter by category if provided
      if (category != null && category.isNotEmpty) {
        builder = builder.eq('category', category);
      }

      // Filter by confidence if provided
      if (minConfidence != null) {
        builder = builder.gte('confidence', minConfidence);
      }

      // Filter by risk if provided
      if (maxRisk != null) {
        builder = builder.lte('risk_score', maxRisk);
      }

      final response = await builder
          .order('rank', ascending: true)
          .limit(limit);
      
      _logger.d('Fetched ${response.length} stock picks');
      
      return (response as List)
          .map((json) => StockPick.fromJson(json))
          .toList();
    } catch (e) {
      _logger.e('Error fetching top picks', error: e);
      rethrow;
    }
  }

  /// Get stock pick details for a specific symbol
  Future<StockPick?> getStockPick(String symbol) async {
    try {
      final response = await _client
          .from('stock_picks')
          .select()
          .eq('symbol', symbol)
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();

      if (response == null) {
        _logger.w('No stock pick found for symbol: $symbol');
        return null;
      }

      return StockPick.fromJson(response);
    } catch (e) {
      _logger.e('Error fetching stock pick for $symbol', error: e);
      rethrow;
    }
  }

  /// Get picks by category
  Future<Map<String, List<StockPick>>> getPicksByCategory({
    int limitPerCategory = 25,
  }) async {
    try {
      final categories = ['growth', 'value', 'momentum', 'quality'];
      final Map<String, List<StockPick>> result = {};

      for (final category in categories) {
        final picks = await getTopPicks(
          limit: limitPerCategory,
          category: category,
        );
        result[category] = picks;
      }

      return result;
    } catch (e) {
      _logger.e('Error fetching picks by category', error: e);
      rethrow;
    }
  }

  /// Search stock picks by symbol or company name
  Future<List<StockPick>> searchStocks(String query) async {
    try {
      if (query.isEmpty) return [];

      final response = await _client
          .from('stock_picks')
          .select()
          .or('symbol.ilike.%$query%,company_name.ilike.%$query%')
          .order('rank', ascending: true)
          .limit(50);

      return (response as List)
          .map((json) => StockPick.fromJson(json))
          .toList();
    } catch (e) {
      _logger.e('Error searching stocks', error: e);
      rethrow;
    }
  }

  // ==================== CANDLESTICK PATTERNS ====================

  /// Get candlestick patterns for a symbol
  Future<List<CandlestickPattern>> getPatterns(
    String symbol, {
    int daysBack = 7,
    String? patternType,
  }) async {
    try {
      final cutoffDate = DateTime.now().subtract(Duration(days: daysBack));

      var builder = _client
          .from('candlestick_patterns')
          .select()
          .eq('symbol', symbol)
          .gte('detected_at', cutoffDate.toIso8601String());

      if (patternType != null) {
        builder = builder.eq('pattern_type', patternType);
      }

      final response = await builder.order('detected_at', ascending: false);

      return (response as List)
          .map((json) => CandlestickPattern.fromJson(json))
          .toList();
    } catch (e) {
      _logger.e('Error fetching patterns for $symbol', error: e);
      rethrow;
    }
  }

  /// Get recent patterns across all stocks
  Future<List<CandlestickPattern>> getRecentPatterns({
    int limit = 50,
    String? direction,
  }) async {
    try {
      var builder = _client
          .from('candlestick_patterns')
          .select();

      if (direction != null) {
        builder = builder.eq('direction', direction);
      }

      final response = await builder
          .order('detected_at', ascending: false)
          .limit(limit);

      return (response as List)
          .map((json) => CandlestickPattern.fromJson(json))
          .toList();
    } catch (e) {
      _logger.e('Error fetching recent patterns', error: e);
      rethrow;
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /// Subscribe to new stock picks
  RealtimeChannel subscribeToStockPicks({
    required void Function(List<StockPick>) onData,
    required void Function(Object) onError,
  }) {
    final channel = _client
        .channel('stock_picks_channel')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'stock_picks',
          callback: (payload) {
            try {
              final pick = StockPick.fromJson(payload.newRecord);
              onData([pick]);
            } catch (e) {
              onError(e);
            }
          },
        )
        .subscribe();

    return channel;
  }

  /// Subscribe to new candlestick patterns
  RealtimeChannel subscribeToPatterns({
    String? symbol,
    required void Function(List<CandlestickPattern>) onData,
    required void Function(Object) onError,
  }) {
    var channel = _client.channel('patterns_channel');

    if (symbol != null) {
      channel = channel.onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'candlestick_patterns',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: 'symbol',
          value: symbol,
        ),
        callback: (payload) {
          try {
            final pattern = CandlestickPattern.fromJson(payload.newRecord);
            onData([pattern]);
          } catch (e) {
            onError(e);
          }
        },
      );
    } else {
      channel = channel.onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'candlestick_patterns',
        callback: (payload) {
          try {
            final pattern = CandlestickPattern.fromJson(payload.newRecord);
            onData([pattern]);
          } catch (e) {
            onError(e);
          }
        },
      );
    }

    return channel.subscribe();
  }

  /// Unsubscribe from a channel
  Future<void> unsubscribe(RealtimeChannel channel) async {
    await _client.removeChannel(channel);
  }
  
  // ==================== AI PATTERN DETECTION ====================
  
  /// Detect patterns in candlestick data using AI
  Future<List<CandlestickPattern>> detectPatterns({
    required String symbol,
    required List<Candle> candles,
    String timeframe = '1d',
    Map<String, double>? context,
  }) async {
    try {
      final response = await _dio.post(
        '/patterns/detect',
        data: {
          'symbol': symbol,
          'timeframe': timeframe,
          'candles': candles.map((c) => {
            'timestamp': c.date.toIso8601String(),
            'open': c.open,
            'high': c.high,
            'low': c.low,
            'close': c.close,
            'volume': c.volume,
          }).toList(),
          if (context != null) 'context': context,
        },
      );

      final patterns = (response.data['patterns'] as List)
          .map((json) => CandlestickPattern.fromJson({
                'id': json['pattern_type'] + '_' + json['timestamp'],
                'symbol': symbol,
                'pattern_type': json['pattern_type'],
                'timeframe': timeframe,
                'confidence': json['confidence'],
                'direction': json['direction'],
                'strength': json['strength'],
                'price_at_detection': json['price_at_detection'],
                'detected_at': json['timestamp'],
                ...json['context'],
              }))
          .toList();

      _logger.d('Detected ${patterns.length} patterns for $symbol');
      return patterns;
    } catch (e) {
      _logger.e('Error detecting patterns', error: e);
      rethrow;
    }
  }
  
  /// Detect patterns in real-time
  Future<CandlestickPattern?> detectRealtimePattern({
    required String symbol,
    required Candle newCandle,
    required List<Candle> recentCandles,
    Map<String, double>? context,
  }) async {
    try {
      final response = await _dio.post(
        '/patterns/realtime',
        data: {
          'symbol': symbol,
          'new_candle': {
            'timestamp': newCandle.date.toIso8601String(),
            'open': newCandle.open,
            'high': newCandle.high,
            'low': newCandle.low,
            'close': newCandle.close,
            'volume': newCandle.volume,
          },
          'recent_candles': recentCandles.map((c) => {
            'timestamp': c.date.toIso8601String(),
            'open': c.open,
            'high': c.high,
            'low': c.low,
            'close': c.close,
            'volume': c.volume,
          }).toList(),
          if (context != null) 'context': context,
        },
      );

      if (response.data == null) {
        return null;
      }

      final json = response.data;
      return CandlestickPattern.fromJson({
        'id': json['pattern_type'] + '_' + json['timestamp'],
        'symbol': symbol,
        'pattern_type': json['pattern_type'],
        'timeframe': '1d',
        'confidence': json['confidence'],
        'direction': json['direction'],
        'strength': json['strength'],
        'price_at_detection': json['price_at_detection'],
        'detected_at': json['timestamp'],
        ...json['context'],
      });
    } catch (e) {
      _logger.e('Error detecting realtime pattern', error: e);
      return null;
    }
  }
  
  /// Get supported pattern types
  Future<Map<String, dynamic>> getPatternTypes() async {
    try {
      final response = await _dio.get('/patterns/types');
      return response.data;
    } catch (e) {
      _logger.e('Error fetching pattern types', error: e);
      rethrow;
    }
  }
}
