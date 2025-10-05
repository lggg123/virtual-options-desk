import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/candlestick_pattern.dart';
import '../services/supabase_service.dart';

// Service provider
final supabaseServiceProvider = Provider((ref) => SupabaseService());

// Patterns for symbol provider
final patternsProvider = FutureProvider.family<List<CandlestickPattern>, PatternQuery>(
  (ref, query) async {
    final service = ref.watch(supabaseServiceProvider);
    return await service.getPatterns(
      query.symbol,
      daysBack: query.daysBack,
      patternType: query.patternType,
    );
  },
);

// Recent patterns provider
final recentPatternsProvider = FutureProvider<List<CandlestickPattern>>(
  (ref) async {
    final service = ref.watch(supabaseServiceProvider);
    return await service.getRecentPatterns(limit: 50);
  },
);

// Query class for patterns
class PatternQuery {
  final String symbol;
  final int daysBack;
  final String? patternType;

  PatternQuery({
    required this.symbol,
    this.daysBack = 7,
    this.patternType,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PatternQuery &&
          runtimeType == other.runtimeType &&
          symbol == other.symbol &&
          daysBack == other.daysBack &&
          patternType == other.patternType;

  @override
  int get hashCode =>
      symbol.hashCode ^ daysBack.hashCode ^ patternType.hashCode;
}
