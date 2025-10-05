# Virtual Options Desk

A comprehensive options trading platform with AI-powered market analysis a## 🎯 Features

- **📈 Real Market Data**: 5 different API providers
- **🤖 AI Analysis**: CrewAI multi-agent market analysis
- **🤖 ML Stock Screening**: Multi-model ensemble (XGBoost, Random Forest, LightGBM, LSTM)
- **📝 Daily Blogs**: Automated market analysis posts
- **📊 3D Visualization**: Interactive price/volume charts
- **💹 Options Trading**: Virtual trading environment
- **📱 Mobile App**: Flutter app with candlestick charts & AI insights
- **🔄 Fallback Systems**: Works without external servicesmous blog generation.

## 🚀 Quick Start (Local Development)

```bash
# Clone and start everything
git clone <your-repo>
cd virtual-options-desk
chmod +x start-dev.sh
./start-dev.sh
```

**Services:**
- Frontend: http://localhost:3000
- CrewAI Service: http://localhost:8001 (optional)
- ML Service: http://localhost:8002 (for stock screening)

## 📊 Free Market Data APIs

Get your API keys from these providers (all have free tiers):

| Provider | Free Limit | Best For | Signup |
|----------|------------|----------|---------|
| **Alpha Vantage** | 100 req/day | Beginners, Technical indicators | [Get Key](https://www.alphavantage.co/support/#api-key) |
| **Finnhub** | 60 calls/min | Real-time data, News | [Get Key](https://finnhub.io/register) |
| **Polygon.io** | 5 calls/min | Options data, Professional | [Get Key](https://polygon.io/pricing) |
| **FMP** | 250 req/day | Financial statements | [Get Key](https://site.financialmodelingprep.com/developer/docs) |
| **EODHD** | 20 req/day | End-of-day data | [Get Key](https://eodhd.com/register) |

## ⚙️ Setup

1. **Install Dependencies**
```bash
cd frontend && bun install
```

2. **Set Up Supabase Database** (Optional but recommended)
```bash
# 1. Create project at supabase.com
# 2. Run database/supabase_schema.sql in SQL Editor
# 3. Copy your credentials to .env.local
```
See [database/SUPABASE_SETUP.md](database/SUPABASE_SETUP.md) for detailed guide.

3. **Configure API Keys**
```bash
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your API keys
```

3. **Start Development**
```bash
./start-dev.sh
# Or manually:
bun run dev:frontend  # Frontend only
bun run dev:crewai    # CrewAI service (optional)
./start-ml-service.sh # ML service (optional)
```

4. **Set Up ML Models** (Optional)
```bash
# Install ML dependencies
pip install -r python/requirements-ml.txt

# Start ML service
./start-ml-service.sh

# Train models (first time)
curl -X POST http://localhost:3000/api/ml/train
```

## 🔧 Testing

```bash
# Test blog generation
bun run test:blog

# Test market data APIs
curl "http://localhost:3000/api/market-data?symbol=AAPL&provider=alpha_vantage&type=current"

# Test historical data
curl "http://localhost:3000/api/market-data?symbol=SPY&type=historical&days=7"
```

## 🏗️ Architecture

```
virtual-options-desk/
├── frontend/           # Next.js TypeScript app
│   ├── src/app/       # App router & API routes
│   ├── src/lib/       # Services & utilities
│   └── package.json
├── mobile/            # Flutter mobile app
│   ├── lib/           # Dart source code
│   ├── android/       # Android platform files
│   ├── ios/           # iOS platform files
│   └── pubspec.yaml   # Flutter dependencies
├── python/            # Python ML & AI services
│   ├── ml_ensemble.py # ML model ensemble
│   ├── ml_api.py      # FastAPI ML service
│   └── crewai_analysis.py # CrewAI integration
├── ml_models/         # Trained ML models (not in git)
├── crewai-service/    # Optional AI enhancement
│   ├── python/        # CrewAI analysis scripts
│   ├── main.py        # FastAPI server
│   └── requirements.txt
├── start-dev.sh       # Development startup script
└── start-ml-service.sh # ML service startup script
```

## 🎯 Features

- **📈 Real Market Data**: 5 different API providers
- **🤖 AI Analysis**: CrewAI multi-agent market analysis
- **📝 Daily Blogs**: Automated market analysis posts
- **📊 3D Visualization**: Interactive price/volume charts
- **💹 Options Trading**: Virtual trading environment
- **� Mobile App**: Flutter app with candlestick charts & AI insights
- **�🔄 Fallback Systems**: Works without external services

## 🚀 Deployment Options

**Frontend Only (Recommended Start):**
- Deploy to Vercel/Netlify
- Works with built-in fallback analysis
- Add CrewAI service later

**Full Stack:**
- Frontend → Vercel
- CrewAI Service → Railway/Render

## 🔑 Environment Variables

```bash
# Market Data (choose one)
ALPHA_VANTAGE_API_KEY=your_key
FINNHUB_API_KEY=your_key
POLYGON_API_KEY=your_key

# AI Enhancement (optional)
ANTHROPIC_API_KEY=your_key
CREWAI_SERVICE_URL=http://localhost:8001
```

## 🛠️ Development Scripts

```bash
# Start everything
./start-dev.sh

# Individual services
bun run dev:frontend    # Next.js on :3000
bun run dev:crewai      # Python service on :8001

# Testing
bun run test:blog       # Blog generation
bun run test:crewai     # Market analysis
```

## 📱 Mobile App

The Flutter mobile app provides real-time candlestick charts, AI stock picks, and pattern detection on iOS, Android, and web.

**Features:**
- 📊 Real-time candlestick charts with pattern overlays
- ⭐ Browse 1000 AI-selected stocks from ML screening
- 🔍 Search and filter stocks by category, confidence, risk
- 📈 Detailed stock analysis with model breakdowns
- 🔄 Real-time updates via Supabase

**Quick Start:**
```bash
cd mobile

# 1. Install dependencies
flutter pub get

# 2. Configure Supabase (copy credentials to .env)
cp .env.example .env
# Edit .env with your Supabase URL and key

# 3. Run the app
flutter run -d chrome  # For web
flutter run -d android # For Android
flutter run -d ios     # For iOS
```

**Documentation:**
- [Complete Setup Guide](mobile/SETUP_COMPLETE.md) - Detailed walkthrough
- [Supabase Integration](mobile/README_SUPABASE.md) - Database connection
- [Flutter Integration Guide](docs/FLUTTER_INTEGRATION_GUIDE.md) - Architecture overview

## 🤖 Machine Learning Stock Screening

Advanced ML-based stock screening using ensemble methods to predict stock performance.

**Quick Start:**
```bash
# Install ML dependencies
pip install -r python/requirements-ml.txt

# Start ML service
./start-ml-service.sh

# Train models (one-time)
curl -X POST http://localhost:3000/api/ml/train

# Generate predictions
curl -X POST http://localhost:3000/api/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["AAPL", "MSFT", "GOOGL"]}'
```

**Features:**
- 🎯 Multi-model ensemble (XGBoost, Random Forest, LightGBM, LSTM)
- 📊 Predicts 30-day forward returns
- 🎲 Confidence scoring based on model agreement
- ⚠️ Risk assessment for each prediction
- 📈 Feature importance analysis
- 🔄 Monthly screening pipeline for 1000+ stocks

See the [ML Training Guide](docs/ML_TRAINING_GUIDE.md) for complete documentation.

Ready to trade! 📊✨