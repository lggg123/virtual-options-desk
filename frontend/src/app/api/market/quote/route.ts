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
    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators.quote[0];

    const latestIndex = quote.close.length - 1;
    const currentPrice = quote.close[latestIndex];
    const previousClose = meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    return NextResponse.json({
      symbol: symbol,
      regularMarketPrice: currentPrice,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
      regularMarketVolume: quote.volume[latestIndex],
      regularMarketDayHigh: Math.max(...quote.high.filter((v: number) => v !== null)),
      regularMarketDayLow: Math.min(...quote.low.filter((v: number) => v !== null)),
      regularMarketOpen: quote.open[0],
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
