import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/candle.dart';
import '../services/market_data_service.dart';

final candlesProvider = FutureProvider.family<List<Candle>, String>((ref, symbol) async {
  final marketDataService = ref.watch(marketDataServiceProvider);
  return marketDataService.getCandles(symbol);
});

final selectedSymbolProvider = StateProvider<String>((ref) => 'AAPL');

final timeframeProvider = StateProvider<String>((ref) => '1D');
