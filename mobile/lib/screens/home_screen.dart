import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../widgets/candlestick_chart_widget.dart';
import '../widgets/stock_search_bar.dart';
import '../widgets/ai_insights_panel.dart';
import 'stock_picks_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _selectedSymbol = 'AAPL';
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Virtual Options Desk'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              // Navigate to settings
            },
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.show_chart),
            label: 'Charts',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.stars),
            label: 'AI Picks',
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return _buildChartView();
      case 1:
        return const StockPicksScreen();
      default:
        return _buildChartView();
    }
  }

  Widget _buildChartView() {
    return SafeArea(
      child: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: StockSearchBar(
              onSymbolSelected: (symbol) {
                setState(() {
                  _selectedSymbol = symbol;
                });
              },
            ),
          ),
          
          // Candlestick chart
          Expanded(
            flex: 2,
            child: CandlestickChartWidget(
              symbol: _selectedSymbol,
            ),
          ),
          
          // AI Insights panel
          Expanded(
            flex: 1,
            child: AIInsightsPanel(
              symbol: _selectedSymbol,
            ),
          ),
        ],
      ),
    );
  }
}
