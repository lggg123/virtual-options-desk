import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const expiration = searchParams.get('expiration');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Fetch options data from Yahoo Finance
    const baseUrl = `https://query1.finance.yahoo.com/v7/finance/options/${symbol}`;
    const url = expiration ? `${baseUrl}?date=${expiration}` : baseUrl;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch options for ${symbol}`);
    }

    const data = await response.json();
    const optionChain = data.optionChain.result[0];

    if (!optionChain) {
      return NextResponse.json({
        options: [],
        expirations: []
      });
    }

    const calls = optionChain.options[0].calls || [];
    const puts = optionChain.options[0].puts || [];

    const options = [
      ...calls.map((call: any) => ({
        strike: call.strike,
        bid: call.bid,
        ask: call.ask,
        last: call.lastPrice,
        volume: call.volume || 0,
        openInterest: call.openInterest || 0,
        impliedVolatility: call.impliedVolatility || 0,
        delta: 0, // Would need Black-Scholes calculation
        gamma: 0,
        theta: 0,
        vega: 0,
        expiration: new Date(optionChain.expirationDates[0] * 1000).toISOString(),
        type: 'call' as const
      })),
      ...puts.map((put: any) => ({
        strike: put.strike,
        bid: put.bid,
        ask: put.ask,
        last: put.lastPrice,
        volume: put.volume || 0,
        openInterest: put.openInterest || 0,
        impliedVolatility: put.impliedVolatility || 0,
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        expiration: new Date(optionChain.expirationDates[0] * 1000).toISOString(),
        type: 'put' as const
      }))
    ];

    const expirations = optionChain.expirationDates.map((date: number) => 
      new Date(date * 1000).toISOString().split('T')[0]
    );

    return NextResponse.json({
      options,
      expirations,
      underlyingPrice: optionChain.quote.regularMarketPrice
    });
  } catch (error) {
    console.error('Error fetching options chain:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch options data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
