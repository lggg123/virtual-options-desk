import { NextRequest, NextResponse } from 'next/server';

// Helper to format symbol for EODHD (US stocks need .US suffix)
function formatEODHDSymbol(symbol: string): string {
  if (symbol.includes('.')) return symbol;
  return `${symbol}.US`;
}

// Generate standard monthly expiration dates (3rd Friday of each month)
function generateStandardExpirations(): string[] {
  const expirations: string[] = [];
  const now = new Date();
  let currentMonth = now.getMonth();
  let currentYear = now.getFullYear();

  for (let i = 0; i < 12; i++) {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstFriday = (5 - firstDay.getDay() + 7) % 7 + 1;
    const thirdFriday = firstFriday + 14;
    const expirationDate = new Date(currentYear, currentMonth, thirdFriday);

    if (expirationDate > now) {
      expirations.push(expirationDate.toISOString().split('T')[0]);
    }

    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }

  return expirations;
}

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

    const apiKey = process.env.EODHD_API_KEY;

    if (!apiKey) {
      console.warn('EODHD API key not configured, using fallback data');
      return NextResponse.json({
        options: [],
        expirations: generateStandardExpirations(),
        underlyingPrice: 0,
        source: 'fallback'
      });
    }

    const formattedSymbol = formatEODHDSymbol(symbol);

    // Build EODHD options URL
    let url = `https://eodhd.com/api/options/${formattedSymbol}?api_token=${apiKey}&fmt=json`;

    // Add expiration filter if provided (EODHD uses from/to format)
    if (expiration) {
      url += `&from=${expiration}&to=${expiration}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`EODHD API error: ${response.status}`);
      // Return fallback expirations so dropdown isn't empty
      return NextResponse.json({
        options: [],
        expirations: generateStandardExpirations(),
        underlyingPrice: 0,
        source: 'fallback'
      });
    }

    const data = await response.json();

    // Handle EODHD error responses
    if (data.error || typeof data === 'string') {
      console.error('EODHD error:', data.error || data);
      return NextResponse.json({
        options: [],
        expirations: generateStandardExpirations(),
        underlyingPrice: 0,
        source: 'fallback'
      });
    }

    // EODHD returns data in a different format
    // Extract unique expiration dates from options data
    const expirationSet = new Set<string>();
    const options: Array<{
      strike: number;
      bid: number;
      ask: number;
      last: number;
      volume: number;
      openInterest: number;
      impliedVolatility: number;
      delta: number;
      gamma: number;
      theta: number;
      vega: number;
      expiration: string;
      type: 'call' | 'put';
    }> = [];

    // EODHD options response structure
    interface EODHDOption {
      strike: number;
      bid?: number;
      ask?: number;
      lastPrice?: number;
      volume?: number;
      openInterest?: number;
      impliedVolatility?: number;
      delta?: number;
      gamma?: number;
      theta?: number;
      vega?: number;
      expirationDate?: string;
      contractType?: string;
    }

    if (data.data && Array.isArray(data.data)) {
      for (const option of data.data as EODHDOption[]) {
        const expDate = option.expirationDate || '';
        if (expDate) {
          expirationSet.add(expDate.split('T')[0]);
        }

        options.push({
          strike: option.strike || 0,
          bid: option.bid || 0,
          ask: option.ask || 0,
          last: option.lastPrice || 0,
          volume: option.volume || 0,
          openInterest: option.openInterest || 0,
          impliedVolatility: option.impliedVolatility || 0,
          delta: option.delta || 0,
          gamma: option.gamma || 0,
          theta: option.theta || 0,
          vega: option.vega || 0,
          expiration: expDate,
          type: (option.contractType?.toLowerCase() === 'put' ? 'put' : 'call') as 'call' | 'put'
        });
      }
    } else if (Array.isArray(data)) {
      // Alternative EODHD response format
      for (const option of data as EODHDOption[]) {
        const expDate = option.expirationDate || '';
        if (expDate) {
          expirationSet.add(expDate.split('T')[0]);
        }

        options.push({
          strike: option.strike || 0,
          bid: option.bid || 0,
          ask: option.ask || 0,
          last: option.lastPrice || 0,
          volume: option.volume || 0,
          openInterest: option.openInterest || 0,
          impliedVolatility: option.impliedVolatility || 0,
          delta: option.delta || 0,
          gamma: option.gamma || 0,
          theta: option.theta || 0,
          vega: option.vega || 0,
          expiration: expDate,
          type: (option.contractType?.toLowerCase() === 'put' ? 'put' : 'call') as 'call' | 'put'
        });
      }
    }

    // Get expirations from API data, or use fallback if none found
    let expirations = Array.from(expirationSet).sort();
    if (expirations.length === 0) {
      expirations = generateStandardExpirations();
    }

    // Filter to only future expirations
    const now = new Date().toISOString().split('T')[0];
    expirations = expirations.filter(exp => exp >= now);

    // If still no future expirations, use generated ones
    if (expirations.length === 0) {
      expirations = generateStandardExpirations();
    }

    return NextResponse.json({
      options,
      expirations,
      underlyingPrice: data.lastPrice || data.underlyingPrice || 0,
      source: 'eodhd'
    });
  } catch (error) {
    console.error('Error fetching options chain:', error);
    // Return fallback expirations so dropdown isn't empty
    return NextResponse.json({
      options: [],
      expirations: generateStandardExpirations(),
      underlyingPrice: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'fallback'
    });
  }
}
