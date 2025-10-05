# Flutter App Integration Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              Flutter Mobile/Web App                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  • Real-time Candlestick Charts                 │   │
│  │  • AI Pattern Detection Overlay                 │   │
│  │  • 1000 AI Stock Picks Browser                  │   │
│  │  • Factor Analysis Dashboard                    │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────┘
                   │ WebSocket (live data)
                   │ REST API (picks, factors)
                   ↓
┌─────────────────────────────────────────────────────────┐
│         Your Existing virtual-options-desk              │
│  ┌──────────────────┐    ┌──────────────────────────┐  │
│  │  Next.js Frontend │    │   New Services Added:   │  │
│  │  (port 3000)      │    │  • Pattern Detection    │  │
│  └──────────────────┘    │  • Stock Screening API  │  │
│                           │  • WebSocket Server     │  │
│  ┌──────────────────┐    └──────────────────────────┘  │
│  │  CrewAI Service  │                                   │
│  │  (port 8001)     │                                   │
│  └──────────────────┘                                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│    New Stock Screening Service (port 8002)              │
│  • Factor Calculation Pipeline                          │
│  • ML Ensemble (XGBoost, RF, LSTM, LightGBM)           │
│  • PostgreSQL Database                                  │
│  • Monthly Screening Jobs                               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│           External Data Providers                       │
│  • Alpha Vantage  • Finnhub  • Polygon  • FMP          │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
virtual-options-desk/
├── frontend/                    # Existing Next.js app
│   └── src/
│       └── app/api/
│           ├── market-data/     # Existing
│           ├── patterns/        # NEW: Pattern detection
│           └── websocket/       # NEW: Live data stream
│
├── screening-service/           # NEW: Stock screening system
│   ├── factor_calculator.py
│   ├── ml_models.py
│   ├── database.py
│   ├── api.py
│   ├── pattern_detector.py
│   └── monthly_job.py
│
├── flutter-app/                 # NEW: Flutter mobile/web app
│   ├── lib/
│   │   ├── models/
│   │   │   ├── stock_pick.dart
│   │   │   ├── candlestick_data.dart
│   │   │   └── pattern_detection.dart
│   │   ├── services/
│   │   │   ├── api_service.dart
│   │   │   ├── websocket_service.dart
│   │   │   └── chart_service.dart
│   │   ├── screens/
│   │   │   ├── home_screen.dart
│   │   │   ├── chart_screen.dart
│   │   │   ├── picks_screen.dart
│   │   │   └── analysis_screen.dart
│   │   └── widgets/
│   │       ├── candlestick_chart.dart
│   │       ├── pattern_overlay.dart
│   │       └── stock_card.dart
│   └── pubspec.yaml
│
└── docker-compose.yml           # Updated with new services
```

## Installation Steps

### 1. Set Up Screening Service

```bash
cd virtual-options-desk

# Create new directory
mkdir screening-service
cd screening-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**requirements.txt:**

```txt
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pandas==2.1.3
numpy==1.26.2
pandas-ta==0.3.14b0
scikit-learn==1.3.2
xgboost==2.0.2
lightgbm==4.1.0
torch==2.1.1
aiohttp==3.9.1
python-dotenv==1.0.0
```

### 2. Set Up PostgreSQL Database

```bash
# Using Docker
docker run --name stock-screening-db \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=stock_screening \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Initialize Database

```python
# Run from screening-service/
python database.py
```

### 4. Flutter App Setup

```bash
# Create Flutter project
cd virtual-options-desk
flutter create flutter_app

cd flutter_app

# Add dependencies
flutter pub add fl_chart syncfusion_flutter_charts web_socket_channel dio provider
```

## Flutter App Code Examples

### pubspec.yaml

```yaml
name: stock_screening_app
description: AI-powered stock screening with live charts

dependencies:
  flutter:
    sdk: flutter
  
  # Charts
  fl_chart: ^0.68.0
  syncfusion_flutter_charts: ^24.1.41
  
  # Networking
  dio: ^5.4.0
  web_socket_channel: ^2.4.0
  
  # State Management
  provider: ^6.1.0
  
  # Utilities
  intl: ^0.19.0
  shared_preferences: ^2.2.2
```

### models/stock_pick.dart

```dart
class StockPick {
  final String symbol;
  final String companyName;
  final int rank;
  final double aiScore;
  final double confidence;
  final double riskScore;
  final double predictedReturn;
  final String category;
  final Map<String, double> modelBreakdown;
  final Map<String, double> topFactors;
  final double? actualReturn1m;

  StockPick({
    required this.symbol,
    required this.companyName,
    required this.rank,
    required this.aiScore,
    required this.confidence,
    required this.riskScore,
    required this.predictedReturn,
    required this.category,
    required this.modelBreakdown,
    required this.topFactors,
    this.actualReturn1m,
  });

  factory StockPick.fromJson(Map<String, dynamic> json) {
    return StockPick(
      symbol: json['symbol'],
      companyName: json['company_name'],
      rank: json['rank'],
      aiScore: json['ai_score'].toDouble(),
      confidence: json['confidence'].toDouble(),
      riskScore: json['risk_score'].toDouble(),
      predictedReturn: json['predicted_return'].toDouble(),
      category: json['category'],
      modelBreakdown: Map<String, double>.from(
        json['model_breakdown'].map((k, v) => MapEntry(k, v.toDouble()))
      ),
      topFactors: Map<String, double>.from(
        json['top_factors'].map((k, v) => MapEntry(k, v.toDouble()))
      ),
      actualReturn1m: json['actual_return_1m']?.toDouble(),
    );
  }
}
```

### services/api_service.dart

```dart
import 'package:dio/dio.dart';
import '../models/stock_pick.dart';

class ApiService {
  final Dio _dio;
  final String baseUrl;

  ApiService({
    String? baseUrl,
  }) : baseUrl = baseUrl ?? 'http://localhost:8002/api',
       _dio = Dio(BaseOptions(
         baseUrl: baseUrl ?? 'http://localhost:8002/api',
         connectTimeout: const Duration(seconds: 10),
         receiveTimeout: const Duration(seconds: 30),
       ));

  // Get top picks
  Future<List<StockPick>> getTopPicks({
    int n = 100,
    String? category,
    double minConfidence = 0.0,
    double maxRisk = 100.0,
  }) async {
    try {
      final response = await _dio.get(
        '/picks/top/$n',
        queryParameters: {
          if (category != null) 'category': category,
          'min_confidence': minConfidence,
          'max_risk': maxRisk,
        },
      );

      return (response.data as List)
          .map((json) => StockPick.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching picks: $e');
      rethrow;
    }
  }

  // Get specific stock details
  Future<StockPick> getStockDetails(String symbol) async {
    final response = await _dio.get('/stock/$symbol');
    return StockPick.fromJson(response.data);
  }

  // Get stock factors
  Future<Map<String, dynamic>> getStockFactors(String symbol) async {
    final response = await _dio.get('/stock/$symbol/factors');
    return response.data;
  }

  // Get candlestick patterns
  Future<List<Pattern>> getPatterns(
    String symbol, {
    String timeframe = '1d',
    int days = 7,
  }) async {
    final response = await _dio.get(
      '/patterns/$symbol',
      queryParameters: {
        'timeframe': timeframe,
        'days': days,
      },
    );

    return (response.data as List)
        .map((json) => Pattern.fromJson(json))
        .toList();
  }
}
```

### widgets/candlestick_chart.dart

```dart
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class CandlestickChartWidget extends StatefulWidget {
  final String symbol;
  final String timeframe;

  const CandlestickChartWidget({
    Key? key,
    required this.symbol,
    this.timeframe = '1d',
  }) : super(key: key);

  @override
  State<CandlestickChartWidget> createState() => _CandlestickChartWidgetState();
}

class _CandlestickChartWidgetState extends State<CandlestickChartWidget> {
  late WebSocketChannel channel;
  List<CandlestickData> candles = [];
  List<PatternOverlay> patterns = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _connectWebSocket();
    _loadHistoricalData();
  }

  void _connectWebSocket() {
    channel = WebSocketChannel.connect(
      Uri.parse('ws://localhost:8002/ws/live/${widget.symbol}'),
    );

    channel.stream.listen((data) {
      // Parse incoming candlestick data
      final newCandle = CandlestickData.fromJson(data);
      setState(() {
        candles.add(newCandle);
        if (candles.length > 200) {
          candles.removeAt(0); // Keep only last 200 candles
        }
      });

      // Check for patterns in real-time
      _detectPatterns();
    });
  }

  Future<void> _loadHistoricalData() async {
    // Load historical candlesticks
    // ... API call to get historical data
    setState(() {
      isLoading = false;
    });
  }

  void _detectPatterns() async {
    // Call pattern detection API
    // ... API call
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Stack(
      children: [
        // Main candlestick chart
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: LineChart(
            _buildChartData(),
            swapAnimationDuration: const Duration(milliseconds: 250),
          ),
        ),

        // Pattern overlays
        ...patterns.map((pattern) => Positioned(
          left: pattern.x,
          top: pattern.y,
          child: _buildPatternIndicator(pattern),
        )),

        // Real-time price indicator
        Positioned(
          top: 16,
          right: 16,
          child: _buildPriceIndicator(),
        ),
      ],
    );
  }

  LineChartData _buildChartData() {
    // Convert candles to chart data
    // Implement OHLC visualization
    return LineChartData(
      // ... chart configuration
    );
  }

  Widget _buildPatternIndicator(PatternOverlay pattern) {
    Color color = pattern.direction == 'bullish' 
        ? Colors.green 
        : Colors.red;

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        border: Border.all(color: color, width: 2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            pattern.direction == 'bullish' 
                ? Icons.arrow_upward 
                : Icons.arrow_downward,
            color: color,
            size: 20,
          ),
          const SizedBox(height: 4),
          Text(
            pattern.patternType,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            '${(pattern.confidence * 100).toInt()}%',
            style: TextStyle(
              color: color.withOpacity(0.8),
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceIndicator() {
    if (candles.isEmpty) return const SizedBox.shrink();

    final latest = candles.last;
    final isUp = latest.close > latest.open;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isUp ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isUp ? Colors.green : Colors.red,
          width: 2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            '\$${latest.close.toStringAsFixed(2)}',
            style: TextStyle(
              color: isUp ? Colors.green : Colors.red,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            '${isUp ? '+' : ''}${((latest.close - latest.open) / latest.open * 100).toStringAsFixed(2)}%',
            style: TextStyle(
              color: isUp ? Colors.green : Colors.red,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    channel.sink.close();
    super.dispose();
  }
}
```

### screens/picks_screen.dart

```dart
import 'package:flutter/material.dart';
import '../models/stock_pick.dart';
import '../services/api_service.dart';

class PicksScreen extends StatefulWidget {
  const PicksScreen({Key? key}) : super(key: key);

  @override
  State<PicksScreen> createState() => _PicksScreenState();
}

class _PicksScreenState extends State<PicksScreen> {
  final ApiService _api = ApiService();
  List<StockPick> _picks = [];
  String? _selectedCategory;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPicks();
  }

  Future<void> _loadPicks() async {
    setState(() => _isLoading = true);
    try {
      final picks = await _api.getTopPicks(
        n: 1000,
        category: _selectedCategory,
      );
      setState(() {
        _picks = picks;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      // Show error
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Stock Picks'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (category) {
              setState(() => _selectedCategory = category);
              _loadPicks();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: null, child: Text('All')),
              const PopupMenuItem(value: 'growth', child: Text('Growth')),
              const PopupMenuItem(value: 'value', child: Text('Value')),
              const PopupMenuItem(value: 'momentum', child: Text('Momentum')),
              const PopupMenuItem(value: 'quality', child: Text('Quality')),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _picks.length,
              itemBuilder: (context, index) {
                final pick = _picks[index];
                return StockCard(pick: pick);
              },
            ),
    );
  }
}

class StockCard extends StatelessWidget {
  final StockPick pick;

  const StockCard({Key? key, required this.pick}) : super(key: key);

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
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        pick.symbol,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        pick.companyName,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ],
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
            ],
          ),
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
    return Colors.grey;
  }

  Color _getScoreColor(double score) {
    if (score >= 80) return Colors.green;
    if (score >= 60) return Colors.orange;
    return Colors.red;
  }
}
```

## Deployment

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  # Existing Next.js frontend
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8002

  # Existing CrewAI service
  crewai:
    build: ./crewai-service
    ports:
      - "8001:8001"

  # NEW: Stock Screening Service
  screening:
    build: ./screening-service
    ports:
      - "8002:8002"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/stock_screening
      - ALPHA_VANTAGE_KEY=${ALPHA_VANTAGE_KEY}
      - FINNHUB_KEY=${FINNHUB_KEY}
    depends_on:
      - db

  # PostgreSQL Database
  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=stock_screening
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Monthly Screening Job

Create a cron job or scheduled task:

```python
# monthly_job.py
import asyncio
from factor_calculator import BatchFactorCalculator
from ml_models import StockScreeningEnsemble, MonthlyScreeningPipeline
from database import SessionLocal, MonthlyScreen, StockPick

async def run_monthly_screening():
    """Run monthly stock screening"""
    
    print("🚀 Starting monthly screening...")
    
    # 1. Load ensemble
    ensemble = StockScreeningEnsemble()
    ensemble.load_models()
    
    # 2. Define universe (get from API or database)
    universe = get_stock_universe()  # ~5000 stocks
    
    # 3. Run screening
    pipeline = MonthlyScreeningPipeline(ensemble)
    top_picks = await pipeline.run_monthly_screen(universe, top_n=1000)
    
    # 4. Save to database
    save_picks_to_db(top_picks)
    
    print("✅ Monthly screening complete!")

if __name__ == '__main__':
    asyncio.run(run_monthly_screening())
```

Schedule with cron (Linux/Mac):

```bash
# Run on the 1st of every month at 2 AM
0 2 1 * * cd /path/to/screening-service && python monthly_job.py
```

## Next Steps

1. **Test locally**: Run all services and test API endpoints
2. **Integrate Flutter**: Connect Flutter app to your backend
3. **Deploy**: Use Vercel (frontend) + Railway/Render (backend services)
4. **Monitor**: Set up logging and performance monitoring
5. **Iterate**: Refine models based on actual performance

Need help with any specific part? Let me know!
