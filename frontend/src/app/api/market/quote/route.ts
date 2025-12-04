import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Use yfinance or your pattern detection service which has yfinance
    // For now, we'll proxy through a simple fetch or use a quote API
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) {
      throw new Error(`No data available for ${symbol}`);
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    // Find the latest non-null close price
    let currentPrice = meta.regularMarketPrice;
    if (quote?.close) {
      for (let i = quote.close.length - 1; i >= 0; i--) {
        if (quote.close[i] !== null && quote.close[i] !== undefined) {
          currentPrice = quote.close[i];
          break;
        }
      }
    }

    const previousClose = meta.previousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    // Filter out null values for high/low calculations
    const validHighs = quote?.high?.filter((v: number | null) => v !== null && v !== undefined) || [];
    const validLows = quote?.low?.filter((v: number | null) => v !== null && v !== undefined) || [];
    const validVolumes = quote?.volume?.filter((v: number | null) => v !== null && v !== undefined) || [];
    const validOpens = quote?.open?.filter((v: number | null) => v !== null && v !== undefined) || [];

    return NextResponse.json({
      symbol: symbol,
      regularMarketPrice: currentPrice,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
      regularMarketVolume: validVolumes.length > 0 ? validVolumes[validVolumes.length - 1] : 0,
      regularMarketDayHigh: validHighs.length > 0 ? Math.max(...validHighs) : currentPrice,
      regularMarketDayLow: validLows.length > 0 ? Math.min(...validLows) : currentPrice,
      regularMarketOpen: validOpens.length > 0 ? validOpens[0] : currentPrice,
      regularMarketPreviousClose: previousClose,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching market quote:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
