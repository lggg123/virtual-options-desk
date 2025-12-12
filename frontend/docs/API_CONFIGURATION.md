# API Configuration Guide

This document explains the external APIs used for market data in the Virtual Options Desk platform.

## Overview

The platform supports multiple data providers for different asset classes:

| Asset Class | Data Source | API Key Required |
|-------------|-------------|------------------|
| Stocks | Alpha Vantage / EODHD | Yes |
| Crypto | CoinGecko | No (free public API) |
| Futures | Simulated | No |
| CFDs | Simulated | No |

---

## Stock Market Data Providers

The platform supports 5 interchangeable providers for stock data. Configure via environment variables.

### 1. Alpha Vantage (Default)

```env
ALPHA_VANTAGE_API_KEY=your_key_here
```

- **Free Tier**: 100 requests/day
- **Features**: Real-time quotes, historical data, technical indicators
- **Sign Up**: https://www.alphavantage.co/support/#api-key

### 2. EODHD

```env
EODHD_API_KEY=your_key_here
```

- **Free Tier**: 20 requests/day
- **Features**: End-of-day data, intraday (paid), options data
- **Sign Up**: https://eodhd.com/register
- **Note**: Used for ML training data fetching

### 3. Finnhub

```env
FINNHUB_API_KEY=your_key_here
```

- **Free Tier**: 60 calls/minute
- **Features**: Real-time data, company fundamentals, alternative data
- **Sign Up**: https://finnhub.io/register

### 4. Polygon.io

```env
POLYGON_API_KEY=your_key_here
```

- **Free Tier**: 5 calls/minute
- **Features**: Real-time data, options data, news
- **Sign Up**: https://polygon.io/pricing

### 5. Financial Modeling Prep (FMP)

```env
FMP_API_KEY=your_key_here
```

- **Free Tier**: 250 requests/day
- **Features**: Financial statements, real-time prices, ratios
- **Sign Up**: https://site.financialmodelingprep.com/developer/docs

---

## API Usage

### Market Data Endpoint

```
GET /api/market-data
```

**Parameters:**
| Parameter | Default | Description |
|-----------|---------|-------------|
| `symbol` | SPY | Stock ticker symbol |
| `provider` | alpha_vantage | Data provider to use |
| `type` | current | `current` or `historical` |
| `days` | 7 | Days of historical data |

**Examples:**
```bash
# Get current price from Alpha Vantage
/api/market-data?symbol=AAPL&provider=alpha_vantage&type=current

# Get 30 days of historical data from EODHD
/api/market-data?symbol=SPY&provider=eodhd&type=historical&days=30

# Get current price from Finnhub
/api/market-data?symbol=MSFT&provider=finnhub&type=current
```

---

## Crypto Data

### CoinGecko API (Free)

No API key required. The platform fetches real-time crypto data from CoinGecko's public API.

**Endpoint:** `/api/market/crypto`

**Supported Coins:** BTC, ETH, BNB, SOL, XRP, ADA, DOGE, DOT, MATIC, AVAX, LINK, LTC, UNI, ATOM, XLM, ALGO, VET, FIL, TRX, XMR, NEAR, APT, ARB, OP, INJ, SUI, SEI, PEPE, SHIB

**Rate Limit:** 30 calls/minute (free tier)

**Examples:**
```bash
# Get top 50 cryptocurrencies
/api/market/crypto?type=top&limit=50

# Get specific crypto quote
/api/market/crypto?symbol=bitcoin
```

---

## Futures Data (Simulated)

**Endpoint:** `/api/market/futures`

Futures contracts are simulated with realistic price movements based on volatility profiles.

**Categories:**
- Index Futures: ES, NQ, YM, RTY, MES, MNQ
- Currency Futures: 6E, 6J, 6B, 6A, 6C
- Commodity Futures: CL, GC, SI, NG, HG
- Interest Rate: ZB, ZN, ZF
- Crypto Futures: BTC, MBT, ETH

**Examples:**
```bash
# Get all futures
/api/market/futures

# Get futures by category
/api/market/futures?category=index

# Get specific contract
/api/market/futures?symbol=ES
```

---

## CFD Data (Simulated)

**Endpoint:** `/api/market/cfd`

CFD instruments are simulated with bid/ask spreads and leverage specifications.

**Asset Classes:**
- Forex: EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, EURGBP
- Indices: US500, US100, US30, GER40, UK100
- Commodities: XAUUSD, XAGUSD, USOIL, UKOIL, NATGAS
- Crypto: BTCUSD, ETHUSD, SOLUSD
- Stocks: AAPL.US, MSFT.US, NVDA.US, TSLA.US, AMZN.US

**Examples:**
```bash
# Get all CFDs
/api/market/cfd

# Get CFDs by asset class
/api/market/cfd?asset_class=forex

# Get specific CFD quote
/api/market/cfd?symbol=EURUSD
```

---

## Environment Variables Summary

```env
# Stock Data Providers (at least one required for live stock data)
ALPHA_VANTAGE_API_KEY=your_key
EODHD_API_KEY=your_key
FINNHUB_API_KEY=your_key
POLYGON_API_KEY=your_key
FMP_API_KEY=your_key

# No keys needed for:
# - CoinGecko (crypto) - free public API
# - Futures - simulated
# - CFDs - simulated
```

---

## Switching Providers

To change the default stock data provider, modify the API call in your frontend components:

```typescript
// Using Alpha Vantage (default)
const response = await fetch('/api/market-data?symbol=AAPL&type=current');

// Using EODHD instead
const response = await fetch('/api/market-data?symbol=AAPL&provider=eodhd&type=current');
```

---

## Rate Limiting Recommendations

| Provider | Requests | Strategy |
|----------|----------|----------|
| Alpha Vantage | 100/day | Cache heavily, batch requests |
| EODHD | 20/day | Use for ML training only |
| Finnhub | 60/min | Good for real-time updates |
| Polygon | 5/min | Use sparingly, cache results |
| FMP | 250/day | Good balance of limits |
| CoinGecko | 30/min | Sufficient for crypto updates |

For production, consider:
1. Implementing server-side caching (Redis)
2. Using webhooks where available
3. Upgrading to paid tiers for higher limits
