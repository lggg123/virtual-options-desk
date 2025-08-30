# Virtual Options Desk

A comprehensive options trading platform with AI-powered market analysis and autonomous blog generation.

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

2. **Configure API Keys**
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
├── crewai-service/    # Optional AI enhancement
│   ├── python/        # CrewAI analysis scripts
│   ├── main.py        # FastAPI server
│   └── requirements.txt
└── start-dev.sh       # Development startup script
```

## 🎯 Features

- **📈 Real Market Data**: 5 different API providers
- **🤖 AI Analysis**: CrewAI multi-agent market analysis
- **📝 Daily Blogs**: Automated market analysis posts
- **📊 3D Visualization**: Interactive price/volume charts
- **💹 Options Trading**: Virtual trading environment
- **🔄 Fallback Systems**: Works without external services

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

Ready to trade! 📊✨