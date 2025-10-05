import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:candlesticks/candlesticks.dart' as cs;
import '../providers/market_data_provider.dart';

class CandlestickChartWidget extends ConsumerWidget {
  final String symbol;

  const CandlestickChartWidget({
    super.key,
    required this.symbol,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final candlesAsync = ref.watch(candlesProvider(symbol));

    return Card(
      margin: const EdgeInsets.all(16.0),
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  symbol,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                _buildTimeframeSelector(ref),
              ],
            ),
            const SizedBox(height: 8),
            Expanded(
              child: candlesAsync.when(
                data: (candles) {
                  if (candles.isEmpty) {
                    return const Center(
                      child: Text('No data available'),
                    );
                  }
                  
                  // Convert our Candle model to the library's Candle model
                  final chartCandles = candles.map((candle) {
                    return cs.Candle(
                      date: candle.date,
                      high: candle.high,
                      low: candle.low,
                      open: candle.open,
                      close: candle.close,
                      volume: candle.volume,
                    );
                  }).toList();

                  return cs.Candlesticks(
                    candles: chartCandles,
                  );
                },
                loading: () => const Center(
                  child: CircularProgressIndicator(),
                ),
                error: (error, stack) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text('Error loading chart: ${error.toString()}'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          ref.invalidate(candlesProvider(symbol));
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeframeSelector(WidgetRef ref) {
    final selectedTimeframe = ref.watch(timeframeProvider);
    
    return SegmentedButton<String>(
      segments: const [
        ButtonSegment(value: '1D', label: Text('1D')),
        ButtonSegment(value: '1W', label: Text('1W')),
        ButtonSegment(value: '1M', label: Text('1M')),
      ],
      selected: {selectedTimeframe},
      onSelectionChanged: (Set<String> newSelection) {
        ref.read(timeframeProvider.notifier).state = newSelection.first;
      },
    );
  }
}
