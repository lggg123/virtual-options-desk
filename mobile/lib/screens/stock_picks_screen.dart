import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/stock_pick.dart';
import '../providers/stock_picks_provider.dart';
import 'stock_detail_screen.dart';

class StockPicksScreen extends ConsumerStatefulWidget {
  const StockPicksScreen({super.key});

  @override
  ConsumerState<StockPicksScreen> createState() => _StockPicksScreenState();
}

class _StockPicksScreenState extends ConsumerState<StockPicksScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final selectedCategory = ref.watch(selectedCategoryProvider);
    final picksAsync = ref.watch(topPicksProvider(1000));
    final searchAsync = ref.watch(stockSearchProvider);

    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Search stocks...',
                  border: InputBorder.none,
                  hintStyle: TextStyle(color: Colors.white70),
                ),
                style: const TextStyle(color: Colors.white),
                onChanged: (query) {
                  ref.read(stockSearchProvider.notifier).search(query);
                },
              )
            : const Text('AI Stock Picks'),
        actions: [
          IconButton(
            icon: Icon(_isSearching ? Icons.close : Icons.search),
            onPressed: () {
              setState(() {
                _isSearching = !_isSearching;
                if (!_isSearching) {
                  _searchController.clear();
                  ref.read(stockSearchProvider.notifier).clear();
                }
              });
            },
          ),
          PopupMenuButton<String?>(
            icon: const Icon(Icons.filter_list),
            onSelected: (category) {
              ref.read(selectedCategoryProvider.notifier).state = category;
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: null,
                child: Text('All Categories'),
              ),
              const PopupMenuItem(
                value: 'growth',
                child: Text('Growth'),
              ),
              const PopupMenuItem(
                value: 'value',
                child: Text('Value'),
              ),
              const PopupMenuItem(
                value: 'momentum',
                child: Text('Momentum'),
              ),
              const PopupMenuItem(
                value: 'quality',
                child: Text('Quality'),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Category filter chips
          if (!_isSearching) _buildCategoryChips(),
          
          // Stock list
          Expanded(
            child: _isSearching
                ? _buildSearchResults(searchAsync)
                : _buildPicksList(picksAsync),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChips() {
    final selectedCategory = ref.watch(selectedCategoryProvider);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildChip('All', null, selectedCategory),
            const SizedBox(width: 8),
            _buildChip('Growth', 'growth', selectedCategory),
            const SizedBox(width: 8),
            _buildChip('Value', 'value', selectedCategory),
            const SizedBox(width: 8),
            _buildChip('Momentum', 'momentum', selectedCategory),
            const SizedBox(width: 8),
            _buildChip('Quality', 'quality', selectedCategory),
          ],
        ),
      ),
    );
  }

  Widget _buildChip(String label, String? value, String? selectedCategory) {
    final isSelected = selectedCategory == value;
    
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) {
        ref.read(selectedCategoryProvider.notifier).state = value;
      },
    );
  }

  Widget _buildPicksList(AsyncValue<List<StockPick>> picksAsync) {
    return picksAsync.when(
      data: (picks) {
        if (picks.isEmpty) {
          return const Center(
            child: Text('No stock picks available'),
          );
        }
        
        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(topPicksProvider);
          },
          child: ListView.builder(
            itemCount: picks.length,
            itemBuilder: (context, index) {
              return StockPickCard(pick: picks[index]);
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error: $error'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.invalidate(topPicksProvider),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults(AsyncValue<List<StockPick>> searchAsync) {
    return searchAsync.when(
      data: (picks) {
        if (picks.isEmpty && _searchController.text.isNotEmpty) {
          return const Center(
            child: Text('No results found'),
          );
        }
        
        if (picks.isEmpty) {
          return const Center(
            child: Text('Start typing to search stocks'),
          );
        }
        
        return ListView.builder(
          itemCount: picks.length,
          itemBuilder: (context, index) {
            return StockPickCard(pick: picks[index]);
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
    );
  }
}

class StockPickCard extends StatelessWidget {
  final StockPick pick;

  const StockPickCard({super.key, required this.pick});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => StockDetailScreen(symbol: pick.symbol),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              pick.symbol,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 8),
                            _buildCategoryBadge(pick.category),
                          ],
                        ),
                        if (pick.companyName != null)
                          Text(
                            pick.companyName!,
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 14,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                  Chip(
                    label: Text('#${pick.rank}'),
                    backgroundColor: _getRankColor(pick.rank),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildMetric('AI Score', pick.aiScore.toStringAsFixed(1)),
                  _buildMetric('Confidence', '${(pick.confidence * 100).toInt()}%'),
                  _buildMetric('Risk', pick.riskScore.toStringAsFixed(0)),
                ],
              ),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: pick.aiScore / 100,
                backgroundColor: Colors.grey[200],
                valueColor: AlwaysStoppedAnimation<Color>(
                  _getScoreColor(pick.aiScore),
                ),
              ),
              if (pick.predictedReturn != null) ...[
                const SizedBox(height: 8),
                Text(
                  'Predicted Return: ${pick.predictedReturn!.toStringAsFixed(2)}%',
                  style: TextStyle(
                    color: pick.predictedReturn! > 0 ? Colors.green : Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryBadge(String category) {
    final color = _getCategoryColor(category);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color),
      ),
      child: Text(
        category.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildMetric(String label, String value) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 12,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Color _getRankColor(int rank) {
    if (rank <= 10) return Colors.amber;
    if (rank <= 50) return Colors.blue;
    if (rank <= 100) return Colors.green;
    return Colors.grey;
  }

  Color _getScoreColor(double score) {
    if (score >= 80) return Colors.green;
    if (score >= 60) return Colors.orange;
    return Colors.red;
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'growth':
        return Colors.green;
      case 'value':
        return Colors.blue;
      case 'momentum':
        return Colors.purple;
      case 'quality':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }
}
