import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/ai_provider.dart';

class AIInsightsPanel extends ConsumerWidget {
  final String symbol;

  const AIInsightsPanel({
    super.key,
    required this.symbol,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final insightsAsync = ref.watch(aiInsightsProvider(symbol));

    return Card(
      margin: const EdgeInsets.all(16.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.psychology, color: Colors.purple),
                const SizedBox(width: 8),
                Text(
                  'AI Insights',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const Divider(),
            Expanded(
              child: insightsAsync.when(
                data: (insights) {
                  if (insights.isEmpty) {
                    return const Center(
                      child: Text('No insights available'),
                    );
                  }

                  return ListView.builder(
                    itemCount: insights.length,
                    itemBuilder: (context, index) {
                      final insight = insights[index];
                      return ListTile(
                        leading: _getInsightIcon(insight.type),
                        title: Text(
                          insight.title,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(insight.description),
                            const SizedBox(height: 4),
                            LinearProgressIndicator(
                              value: insight.confidence,
                              backgroundColor: Colors.grey[300],
                              valueColor: AlwaysStoppedAnimation<Color>(
                                _getConfidenceColor(insight.confidence),
                              ),
                            ),
                            Text(
                              'Confidence: ${(insight.confidence * 100).toStringAsFixed(0)}%',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                        isThreeLine: true,
                      );
                    },
                  );
                },
                loading: () => const Center(
                  child: CircularProgressIndicator(),
                ),
                error: (error, stack) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red),
                      const SizedBox(height: 8),
                      Text('Error: ${error.toString()}'),
                      TextButton(
                        onPressed: () {
                          ref.invalidate(aiInsightsProvider(symbol));
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

  Icon _getInsightIcon(String type) {
    switch (type.toLowerCase()) {
      case 'bullish':
        return const Icon(Icons.trending_up, color: Colors.green);
      case 'bearish':
        return const Icon(Icons.trending_down, color: Colors.red);
      default:
        return const Icon(Icons.trending_flat, color: Colors.grey);
    }
  }

  Color _getConfidenceColor(double confidence) {
    if (confidence >= 0.7) {
      return Colors.green;
    } else if (confidence >= 0.4) {
      return Colors.orange;
    } else {
      return Colors.red;
    }
  }
}
