import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/stock_pick.dart';
import '../models/candlestick_pattern.dart';
import '../providers/stock_picks_provider.dart';
import '../providers/patterns_provider.dart';
import '../widgets/candlestick_chart_widget.dart';

class StockDetailScreen extends ConsumerWidget {
  final String symbol;

  const StockDetailScreen({super.key, required this.symbol});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pickAsync = ref.watch(stockPickProvider(symbol));
    final patternsAsync = ref.watch(patternsProvider(
      PatternQuery(symbol: symbol, daysBack: 7),
    ));

    return Scaffold(
      appBar: AppBar(
        title: Text(symbol),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(stockPickProvider(symbol));
              ref.invalidate(patternsProvider);
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Candlestick Chart
            SizedBox(
              height: 400,
              child: CandlestickChartWidget(symbol: symbol),
            ),

            // Stock Pick Details
            pickAsync.when(
              data: (pick) {
                if (pick == null) {
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text('No data available for this stock'),
                  );
                }
                return _buildStockDetails(context, pick);
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Error: $error'),
              ),
            ),

            // Candlestick Patterns
            patternsAsync.when(
              data: (patterns) => _buildPatternsList(context, patterns),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Error loading patterns: $error'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStockDetails(BuildContext context, StockPick pick) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              pick.companyName ?? pick.symbol,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            if (pick.sector != null)
              Text(
                '${pick.sector} • ${pick.industry ?? ""}',
                style: TextStyle(color: Colors.grey[600]),
              ),
            const Divider(height: 32),
            
            // Scores
            _buildScoreRow('AI Score', pick.aiScore, 100),
            const SizedBox(height: 8),
            _buildScoreRow('Confidence', pick.confidence * 100, 100),
            const SizedBox(height: 8),
            _buildScoreRow('Risk Score', pick.riskScore, 100),
            
            if (pick.predictedReturn != null) ...[
              const Divider(height: 32),
              _buildInfoRow('Predicted Return', '${pick.predictedReturn!.toStringAsFixed(2)}%'),
            ],
            
            if (pick.actualReturn1m != null) ...[
              _buildInfoRow('Actual Return (1M)', '${pick.actualReturn1m!.toStringAsFixed(2)}%'),
            ],

            // Model Breakdown
            if (pick.modelBreakdown.isNotEmpty) ...[
              const Divider(height: 32),
              const Text(
                'Model Breakdown',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              ...pick.modelBreakdown.entries.map((entry) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _buildScoreRow(entry.key, entry.value, 100),
                );
              }),
            ],

            // Top Factors
            if (pick.topFactors.isNotEmpty) ...[
              const Divider(height: 32),
              const Text(
                'Top Factors',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              ...pick.topFactors.map((factor) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(_formatFactorName(factor.key)),
                      Text(
                        factor.value.toStringAsFixed(3),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildScoreRow(String label, double value, double max) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label),
            Text(
              value.toStringAsFixed(1),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: value / max,
          backgroundColor: Colors.grey[200],
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildPatternsList(BuildContext context, List<CandlestickPattern> patterns) {
    if (patterns.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Recent Patterns',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            ...patterns.map((pattern) => _buildPatternTile(pattern)),
          ],
        ),
      ),
    );
  }

  Widget _buildPatternTile(CandlestickPattern pattern) {
    final color = pattern.isBullish ? Colors.green : Colors.red;
    
    return ListTile(
      leading: Icon(
        pattern.isBullish ? Icons.arrow_upward : Icons.arrow_downward,
        color: color,
      ),
      title: Text(pattern.displayName),
      subtitle: Text(
        '${pattern.timeframe} • Confidence: ${(pattern.confidence * 100).toInt()}% • Strength: ${pattern.strength}/5',
      ),
      trailing: Text(
        _formatRelativeTime(pattern.detectedAt),
        style: TextStyle(color: Colors.grey[600], fontSize: 12),
      ),
    );
  }

  String _formatFactorName(String key) {
    return key
        .split('_')
        .map((word) => word[0].toUpperCase() + word.substring(1))
        .join(' ');
  }

  String _formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
