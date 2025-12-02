import { NextRequest, NextResponse } from 'next/server';

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

// Fetch current stock price from Yahoo Finance
async function fetchCurrentPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (response.ok) {
      const data = await response.json();
      const quote = data.chart.result[0].indicators.quote[0];
      const latestIndex = quote.close.length - 1;
      return quote.close[latestIndex] || data.chart.result[0].meta.regularMarketPrice || 100;
    }
  } catch (e) {
    console.error('Failed to fetch price:', e);
  }
  return 100; // Default fallback price
}

// Calculate Black-Scholes delta approximation
function calculateDelta(stockPrice: number, strike: number, daysToExpiry: number, type: 'call' | 'put', iv: number): number {
  const T = daysToExpiry / 365;
  const r = 0.05; // risk-free rate
  const sigma = iv / 100;

  if (T <= 0) return type === 'call' ? (stockPrice > strike ? 1 : 0) : (stockPrice < strike ? -1 : 0);

  const d1 = (Math.log(stockPrice / strike) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));

  // Normal CDF approximation
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
  const p = 0.3275911;
  const sign = d1 < 0 ? -1 : 1;
  const x = Math.abs(d1) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  const cdf = 0.5 * (1.0 + sign * y);

  return type === 'call' ? cdf : cdf - 1;
}

// Generate realistic options chain data based on stock price
function generateOptionsChain(
  stockPrice: number,
  expiration: string
): Array<{
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
}> {
  const options = [];
  const daysToExpiry = Math.max(1, Math.floor((new Date(expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const T = daysToExpiry / 365;

  // Generate strikes around the current price (typically $5 intervals for high-priced stocks, $1 for lower)
  const strikeInterval = stockPrice > 100 ? 5 : stockPrice > 50 ? 2.5 : 1;
  const baseStrike = Math.round(stockPrice / strikeInterval) * strikeInterval;

  // Generate 10 strikes above and 10 below ATM
  for (let i = -10; i <= 10; i++) {
    const strike = baseStrike + i * strikeInterval;
    if (strike <= 0) continue;

    // Calculate base IV - higher for OTM options, lower for ATM
    const moneyness = Math.abs(stockPrice - strike) / stockPrice;
    const baseIV = 25 + moneyness * 30 + Math.random() * 5; // IV skew

    // Time value component
    const timeValue = Math.sqrt(T) * stockPrice * (baseIV / 100);

    for (const type of ['call', 'put'] as const) {
      const intrinsicValue = type === 'call'
        ? Math.max(0, stockPrice - strike)
        : Math.max(0, strike - stockPrice);

      // Option price = intrinsic + time value (simplified)
      const isOTM = type === 'call' ? strike > stockPrice : strike < stockPrice;
      const optionValue = intrinsicValue + (isOTM ? timeValue * 0.3 : timeValue * 0.5);

      const last = Math.max(0.01, optionValue);
      const spread = Math.max(0.01, last * 0.02 + 0.01); // 2% spread + minimum
      const bid = Math.max(0.01, last - spread / 2);
      const ask = last + spread / 2;

      // Volume and OI are higher for ATM options
      const atmFactor = 1 - Math.min(1, moneyness * 2);
      const volume = Math.floor(100 + atmFactor * 5000 * Math.random());
      const openInterest = Math.floor(1000 + atmFactor * 50000 * Math.random());

      const delta = calculateDelta(stockPrice, strike, daysToExpiry, type, baseIV);

      options.push({
        strike,
        bid: Math.round(bid * 100) / 100,
        ask: Math.round(ask * 100) / 100,
        last: Math.round(last * 100) / 100,
        volume,
        openInterest,
        impliedVolatility: Math.round(baseIV * 10) / 10,
        delta: Math.round(delta * 100) / 100,
        gamma: Math.round((0.05 * atmFactor) * 100) / 100,
        theta: Math.round((-0.05 - Math.random() * 0.1) * 100) / 100,
        vega: Math.round((0.1 + atmFactor * 0.2) * 100) / 100,
        expiration,
        type,
      });
    }
  }

  return options;
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

    // Generate standard expiration dates
    const expirations = generateStandardExpirations();

    // Get the selected expiration or default to the first one
    const selectedExpiration = expiration || expirations[0];

    // Fetch current stock price for realistic options pricing
    const stockPrice = await fetchCurrentPrice(symbol);

    // Generate realistic options chain based on stock price
    const options = generateOptionsChain(stockPrice, selectedExpiration);

    return NextResponse.json({
      options,
      expirations,
      underlyingPrice: stockPrice,
      source: 'generated'
    });
  } catch (error) {
    console.error('Error fetching options chain:', error);
    return NextResponse.json({
      options: [],
      expirations: generateStandardExpirations(),
      underlyingPrice: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'fallback'
    });
  }
}
