import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/stock_pick.dart';
import '../services/supabase_service.dart';

// Service provider
final supabaseServiceProvider = Provider((ref) => SupabaseService());

// State provider for selected category filter
final selectedCategoryProvider = StateProvider<String?>((ref) => null);

// State provider for min confidence filter
final minConfidenceProvider = StateProvider<double>((ref) => 0.0);

// State provider for max risk filter
final maxRiskProvider = StateProvider<double>((ref) => 100.0);

// Top stock picks provider
final topPicksProvider = FutureProvider.family<List<StockPick>, int>(
  (ref, limit) async {
    final service = ref.watch(supabaseServiceProvider);
    final category = ref.watch(selectedCategoryProvider);
    final minConfidence = ref.watch(minConfidenceProvider);
    final maxRisk = ref.watch(maxRiskProvider);

    return await service.getTopPicks(
      limit: limit,
      category: category,
      minConfidence: minConfidence,
      maxRisk: maxRisk,
    );
  },
);

// Stock pick by symbol provider
final stockPickProvider = FutureProvider.family<StockPick?, String>(
  (ref, symbol) async {
    final service = ref.watch(supabaseServiceProvider);
    return await service.getStockPick(symbol);
  },
);

// Picks by category provider
final picksByCategoryProvider = FutureProvider<Map<String, List<StockPick>>>(
  (ref) async {
    final service = ref.watch(supabaseServiceProvider);
    return await service.getPicksByCategory(limitPerCategory: 25);
  },
);

// Search stocks provider
final stockSearchProvider = StateNotifierProvider<StockSearchNotifier, AsyncValue<List<StockPick>>>(
  (ref) => StockSearchNotifier(ref),
);

class StockSearchNotifier extends StateNotifier<AsyncValue<List<StockPick>>> {
  final Ref ref;

  StockSearchNotifier(this.ref) : super(const AsyncValue.data([]));

  Future<void> search(String query) async {
    if (query.isEmpty) {
      state = const AsyncValue.data([]);
      return;
    }

    state = const AsyncValue.loading();
    
    try {
      final service = ref.read(supabaseServiceProvider);
      final results = await service.searchStocks(query);
      state = AsyncValue.data(results);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  void clear() {
    state = const AsyncValue.data([]);
  }
}
