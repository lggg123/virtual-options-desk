# Virtual Options Desk

A comprehensive options trading platform with AI-powered market analysis a## 🎯 Features

- **📈 ## 🎯 Key Capabilities

- **📈 Real Market Data**: 5 different API providers
- **🤖 AI Analysis**: CrewAI multi-agent market analysis
- **📝 Daily Blogs**: Automated market analysis posts
- **📊 3D Visualization**: Interactive price/volume charts
- **💹 Options Trading**: Virtual trading environment
- **📱 REST APIs**: Backend services for iOS app integration
- **🔄 Fallback Systems**: Works without external serviceset Data**: 5 different API providers
- **🤖 AI Analysis**: CrewAI multi-agent market analysis
- **🤖 ML Stock Screening**: Multi-model ensemble (XGBoost, Random Forest, LightGBM, LSTM)
- **📝 Daily Blogs**: Automated market analysis posts
- **📊 3D Visualization**: Interactive price/volume charts
- **💹 Options Trading**: Virtual trading environment
- **📱 API Backend**: REST APIs for mobile app integration
- **🔄 Fallback Systems**: Works without external services

## 🚀 Quick Start (Local Development)

```bash
# Clone and start everything
git clone <your-repo>
cd virtual-options-desk
chmod +x start-dev.sh
./start-dev.sh
```

**Services:**
- Next.js Web App: http://localhost:3000
- CrewAI Service: http://localhost:8001 (optional)
- ML API Service: http://localhost:8002 (stock screening)
- Pattern Detection API: http://localhost:8003 (pattern analysis)

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
├── frontend/           # Next.js TypeScript web app
│   ├── src/app/       # App router & API routes
│   ├── src/lib/       # Services & utilities
│   └── package.json
├── src/               # Next.js app (root level)
│   ├── app/api/       # REST API endpoints
│   └── lib/           # Shared utilities
├── python/            # Python ML & AI services
│   ├── ml_ensemble.py      # ML model ensemble
│   ├── ml_api.py           # FastAPI ML service (port 8002)
│   ├── pattern_detector.py # Pattern detection
│   ├── pattern_detection_api.py # Pattern API (port 8003)
│   └── crewai_analysis.py  # CrewAI integration
├── ml_models/         # Trained ML models (not in git)
├── database/          # Supabase schema & setup
│   ├── supabase_schema.sql
│   └── SUPABASE_SETUP.md
├── crewai-service/    # Optional AI enhancement
│   ├── python/        # CrewAI analysis scripts
│   ├── main.py        # FastAPI server
│   └── requirements.txt
├── start-dev.sh            # Development startup script
├── start-ml-service.sh     # ML service startup
└── start-pattern-service.sh # Pattern detection startup
```

## 🎯 Features

- **📈 Real Market Data**: 5 different API providers
- **🤖 AI Analysis**: CrewAI multi-agent market analysis
- **📝 Daily Blogs**: Automated market analysis posts
- **📊 3D Visualization**: Interactive price/volume charts
- **💹 Options Trading**: Virtual trading environment
- **📱 Mobile App**: Flutter app with candlestick charts & AI insights
- **🔄 Fallback Systems**: Works without external services
- **🧠 ML Stock Screening**: Interactive dashboard with ensemble model predictions, confidence scoring, and risk assessment

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

## 📱 API Backend for iOS App

This repository provides backend services and APIs consumed by a separate iOS application.

**Available API Endpoints:**

### Pattern Detection API (Port 8003)
```bash
# Start the service
./start-pattern-service.sh

# Detect patterns in stock data
curl -X POST http://localhost:8003/api/patterns/detect \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "timeframe": "1d"}'
```

### ML Stock Screening API (Port 8002)
```bash
# Start the service
./start-ml-service.sh

# Get AI stock picks
curl http://localhost:8002/api/predictions

# Predict specific symbols
curl -X POST http://localhost:8002/api/predict \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["AAPL", "MSFT", "GOOGL"]}'
```

### Supabase Database
- Stock picks stored in `stock_picks` table
- Real-time updates via Supabase subscriptions
- See [database/SUPABASE_SETUP.md](database/SUPABASE_SETUP.md) for setup

**iOS App Integration:**
- Configure Supabase URL and anon key in your iOS app
- Connect to Python APIs for pattern detection and ML predictions
- Subscribe to real-time stock_picks updates

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

**Frontend Dashboard:**
- 🖥️ ML Screening Dashboard at `/dashboard/ml-screening`
- 📊 Visual ranking of top predictions
- 🧠 Model ensemble breakdown showing individual model contributions
- 📈 Interactive confidence and risk score visualizations
- 🎯 Feature importance analysis for each stock
- 🔍 Detailed prediction insights with filtering by risk level

See the [ML Training Guide](docs/ML_TRAINING_GUIDE.md) for complete documentation.

## 🚀 Strategic Roadmaps

We have **three comprehensive roadmaps** for platform evolution. Each targets different markets and technical approaches.

### 🎯 Which Path to Choose?

**See**: [Roadmap Comparison Guide](docs/ROADMAP_COMPARISON.md) - Decision framework to help you choose

### Available Roadmaps

#### 1. [Algorithmic Trading Roadmap](docs/ALGORITHMIC_TRADING_ROADMAP.md)
**"QuantConnect for Options"** - Code-first platform  
- **Target Users**: Developer/quant traders who code  
- **Key Features**: Python strategy editor, backtesting, analytics  
- **Time to MVP**: 3-6 months  
- **Revenue Model**: $0/$29/$99/mo  
- **Best For**: Fast MVP, proven concept, low risk

#### 2. [Agentic Trading Roadmap](docs/AGENTIC_TRADING_STRATEGIC_ROADMAP.md)
**"AI Agents Orchestrate Your Strategies"** - Natural language platform  
- **Target Users**: All levels including non-coders  
- **Key Features**: Natural language strategy creation, multi-agent orchestration, continuous learning  
- **Time to MVP**: 6-9 months  
- **Revenue Model**: $0/$29/$299/mo  
- **Best For**: Innovation, differentiation, accessibility

#### 3. [Diamond Architecture Roadmap](docs/DIAMOND_ARCHITECTURE_ROADMAP.md) 🆕
**"Interview the AI" Marketplace** - Premium subscription service  
- **Target Users**: Traders who value transparency over DIY  
- **Key Features**: 
  - Microsoft Qlib (data layer)
  - AlphaPy (AutoML signal generation)
  - TradingAgents (Bull vs Bear structured debate)
  - LangGraph (state orchestration)
  - ElizaOS (interactive character chat)
  - Multi-perspective risk review
- **Time to MVP**: 12-19 months (7 phases)
- **Revenue Model**: $0/$40/$99/mo  
- **Best For**: Premium marketplace, defensible moat, high ARPU

### 📚 Supporting Documentation

- [Diamond Integration Summary](docs/DIAMOND_INTEGRATION_SUMMARY.md) - How Diamond integrates with existing code
- [Diamond Quick Start](docs/DIAMOND_QUICK_START.md) - 2-week Qlib setup guide

### 💡 Recommended Approach

**Hybrid Path** (lowest risk, highest potential):
1. **Q1-Q2 2026**: Build Algorithmic MVP → Get first revenue
2. **Q3-Q4 2026**: Add Agentic features → Increase ARPU
3. **2027**: Upgrade premium tier to Diamond → $40/mo subscriptions

This lets you ship fast, validate market fit, then upgrade to premium features.

Ready to trade! 📊✨