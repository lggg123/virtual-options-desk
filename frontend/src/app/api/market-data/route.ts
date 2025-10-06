// app/api/market-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createMarketDataService, MarketDataProviders } from '@/lib/market-data/real-market-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'SPY';
  const provider = (searchParams.get('provider') as MarketDataProviders) || 'alpha_vantage';
  const type = searchParams.get('type') || 'current'; // 'current' or 'historical'
  const days = parseInt(searchParams.get('days') || '7');
  
  // Get API key from environment or request
  const apiKey = getApiKeyForProvider(provider);
  
  if (!apiKey) {
    return NextResponse.json({
      error: `API key not configured for provider: ${provider}`,
      providers: MarketDataProviders,
      message: 'Please set up API keys in environment variables'
    }, { status: 400 });
  }

  try {
    const marketDataService = createMarketDataService({
      provider,
      apiKey,
      symbol,
      interval: '5min'
    });

    if (type === 'current') {
      const currentData = await marketDataService.getCurrentPrice(symbol);
      return NextResponse.json({
        success: true,
        data: currentData,
        provider,
        symbol,
        timestamp: new Date().toISOString()
      });
    } else if (type === 'historical') {
      const historicalData = await marketDataService.getHistoricalData(symbol, days);
      return NextResponse.json({
        success: true,
        data: historicalData,
        provider,
        symbol,
        days,
        count: historicalData.length,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        error: 'Invalid type parameter. Use "current" or "historical"'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Market data API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch market data',
      message: error instanceof Error ? error.message : 'Unknown error',
      provider,
      symbol
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Market Data API',
    endpoints: {
      'GET /api/market-data': {
        description: 'Get current or historical market data',
        parameters: {
          symbol: 'Stock symbol (default: SPY)',
          provider: 'Data provider (alpha_vantage, finnhub, polygon, fmp, eodhd)',
          type: 'Data type (current, historical)',
          days: 'Days of historical data (default: 7)'
        }
      }
    },
    providers: MarketDataProviders,
    examples: {
      current: '/api/market-data?symbol=AAPL&provider=alpha_vantage&type=current',
      historical: '/api/market-data?symbol=SPY&provider=finnhub&type=historical&days=30'
    }
  });
}

function getApiKeyForProvider(provider: string): string | undefined {
  switch (provider) {
    case 'alpha_vantage':
      return process.env.ALPHA_VANTAGE_API_KEY;
    case 'finnhub':
      return process.env.FINNHUB_API_KEY;
    case 'polygon':
      return process.env.POLYGON_API_KEY;
    case 'fmp':
      return process.env.FMP_API_KEY;
    case 'eodhd':
      return process.env.EODHD_API_KEY;
    default:
      return undefined;
  }
}