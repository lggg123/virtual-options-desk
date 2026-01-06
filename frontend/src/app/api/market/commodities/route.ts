import { NextRequest, NextResponse } from 'next/server';

// Using API Ninjas for commodities (10,000 calls/month free)
// Also using simulated data as fallback for demo purposes

const API_NINJAS_KEY = process.env.API_NINJAS_KEY || '';
const API_NINJAS_URL = 'https://api.api-ninjas.com/v1/commodityprice';

// Cache for rate limiting
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minutes cache for commodities

// Commodity metadata
const COMMODITY_INFO: Record<string, { name: string; unit: string; category: 'energy' | 'metals' | 'agriculture' | 'livestock'; exchange: string }> = {
  'CL': { name: 'Crude Oil WTI', unit: 'barrel', category: 'energy', exchange: 'NYMEX' },
  'BZ': { name: 'Brent Crude Oil', unit: 'barrel', category: 'energy', exchange: 'ICE' },
  'NG': { name: 'Natural Gas', unit: 'MMBtu', category: 'energy', exchange: 'NYMEX' },
  'HO': { name: 'Heating Oil', unit: 'gallon', category: 'energy', exchange: 'NYMEX' },
  'RB': { name: 'RBOB Gasoline', unit: 'gallon', category: 'energy', exchange: 'NYMEX' },
  'GC': { name: 'Gold', unit: 'oz', category: 'metals', exchange: 'COMEX' },
  'SI': { name: 'Silver', unit: 'oz', category: 'metals', exchange: 'COMEX' },
  'HG': { name: 'Copper', unit: 'lb', category: 'metals', exchange: 'COMEX' },
  'PL': { name: 'Platinum', unit: 'oz', category: 'metals', exchange: 'NYMEX' },
  'PA': { name: 'Palladium', unit: 'oz', category: 'metals', exchange: 'NYMEX' },
  'ZC': { name: 'Corn', unit: 'bushel', category: 'agriculture', exchange: 'CBOT' },
  'ZW': { name: 'Wheat', unit: 'bushel', category: 'agriculture', exchange: 'CBOT' },
  'ZS': { name: 'Soybeans', unit: 'bushel', category: 'agriculture', exchange: 'CBOT' },
  'CT': { name: 'Cotton', unit: 'lb', category: 'agriculture', exchange: 'ICE' },
  'KC': { name: 'Coffee', unit: 'lb', category: 'agriculture', exchange: 'ICE' },
  'SB': { name: 'Sugar', unit: 'lb', category: 'agriculture', exchange: 'ICE' },
  'CC': { name: 'Cocoa', unit: 'ton', category: 'agriculture', exchange: 'ICE' },
  'LE': { name: 'Live Cattle', unit: 'lb', category: 'livestock', exchange: 'CME' },
  'HE': { name: 'Lean Hogs', unit: 'lb', category: 'livestock', exchange: 'CME' },
  'GF': { name: 'Feeder Cattle', unit: 'lb', category: 'livestock', exchange: 'CME' },
};

// Simulated base prices (used when API not available)
// Updated: January 2026
const BASE_PRICES: Record<string, number> = {
  'CL': 58.00, // WTI Crude - Updated Jan 2026
  'BZ': 62.50, // Brent - Updated Jan 2026
  'NG': 2.85,  // Natural Gas
  'HO': 2.35,  // Heating Oil
  'RB': 2.15,  // Gasoline
  'GC': 2670.00, // Gold - Updated Jan 2026
  'SI': 30.50, // Silver - Updated Jan 2026
  'HG': 3.85,  // Copper
  'PL': 925.00, // Platinum
  'PA': 1050.00, // Palladium
  'ZC': 485.00, // Corn
  'ZW': 590.00, // Wheat
  'ZS': 1285.00, // Soybeans
  'CT': 78.50, // Cotton
  'KC': 185.00, // Coffee
  'SB': 21.50, // Sugar
  'CC': 4250.00, // Cocoa
  'LE': 178.00, // Live Cattle
  'HE': 72.50, // Lean Hogs
  'GF': 245.00, // Feeder Cattle
};

// GET /api/market/commodities?symbol=CL or ?category=energy or ?type=list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const category = searchParams.get('category') as 'energy' | 'metals' | 'agriculture' | 'livestock' | null;
    const type = searchParams.get('type') || 'quote'; // quote, list, history, ohlc
    const days = parseInt(searchParams.get('days') || '30');

    // Check cache
    const cacheKey = `commodity-${type}-${symbol || category || 'all'}-${days}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    let data;

    if (type === 'list') {
      // Return list of available commodities
      data = Object.entries(COMMODITY_INFO).map(([sym, info]) => ({
        symbol: sym,
        ...info
      }));
    } else if (type === 'history' && symbol) {
      // Get price history for charts
      data = getCommodityHistory(symbol.toUpperCase(), days);
    } else if (type === 'ohlc' && symbol) {
      // Get OHLC candlestick data
      data = getCommodityOHLC(symbol.toUpperCase(), days);
    } else if (symbol) {
      // Get quote for specific commodity
      data = await getCommodityQuote(symbol);
    } else if (category) {
      // Get all commodities in a category
      data = await getCommoditiesByCategory(category);
    } else {
      // Get all commodities
      data = await getAllCommodities();
    }

    // Update cache
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Commodities API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commodity data' },
      { status: 500 }
    );
  }
}

async function getCommodityQuote(symbol: string) {
  const info = COMMODITY_INFO[symbol.toUpperCase()];
  if (!info) {
    throw new Error(`Unknown commodity symbol: ${symbol}`);
  }

  // Try API Ninjas first
  if (API_NINJAS_KEY) {
    try {
      const response = await fetch(`${API_NINJAS_URL}?name=${info.name.toLowerCase().replace(' ', '_')}`, {
        headers: { 'X-Api-Key': API_NINJAS_KEY },
        next: { revalidate: 300 }
      });

      if (response.ok) {
        const apiData = await response.json();
        if (apiData && apiData.price) {
          return formatCommodityData(symbol, apiData.price, info);
        }
      }
    } catch (e) {
      console.log('API Ninjas fallback to simulated data:', e);
    }
  }

  // Fallback to simulated data
  return getSimulatedCommodityData(symbol);
}

async function getCommoditiesByCategory(category: 'energy' | 'metals' | 'agriculture' | 'livestock') {
  const symbols = Object.entries(COMMODITY_INFO)
    .filter(([, info]) => info.category === category)
    .map(([symbol]) => symbol);

  const quotes = await Promise.all(symbols.map(symbol => getCommodityQuote(symbol)));
  return quotes;
}

async function getAllCommodities() {
  const symbols = Object.keys(COMMODITY_INFO);
  const quotes = await Promise.all(symbols.map(symbol => getCommodityQuote(symbol)));
  return quotes;
}

function formatCommodityData(symbol: string, price: number, info: typeof COMMODITY_INFO[string]) {
  const basePrice = BASE_PRICES[symbol] || price;
  const change = price - basePrice;
  const changePercent = (change / basePrice) * 100;

  // Simulate intraday range
  const volatility = getVolatilityForCategory(info.category);
  const high = price * (1 + volatility * Math.random());
  const low = price * (1 - volatility * Math.random());
  const open = basePrice * (1 + (Math.random() - 0.5) * volatility);

  return {
    symbol,
    name: info.name,
    price: roundPrice(price, symbol),
    unit: info.unit,
    change: roundPrice(change, symbol),
    change_percentage: Math.round(changePercent * 100) / 100,
    high: roundPrice(high, symbol),
    low: roundPrice(low, symbol),
    open: roundPrice(open, symbol),
    previous_close: roundPrice(basePrice, symbol),
    category: info.category,
    exchange: info.exchange,
    last_updated: new Date().toISOString()
  };
}

function getSimulatedCommodityData(symbol: string) {
  const info = COMMODITY_INFO[symbol];
  const basePrice = BASE_PRICES[symbol];

  if (!info || !basePrice) {
    throw new Error(`Unknown commodity: ${symbol}`);
  }

  // Add some realistic price variation
  const volatility = getVolatilityForCategory(info.category);
  const randomChange = (Math.random() - 0.5) * 2 * volatility;
  const price = basePrice * (1 + randomChange);

  return formatCommodityData(symbol, price, info);
}

function getVolatilityForCategory(category: string): number {
  switch (category) {
    case 'energy': return 0.03; // 3% daily volatility
    case 'metals': return 0.015; // 1.5%
    case 'agriculture': return 0.025; // 2.5%
    case 'livestock': return 0.02; // 2%
    default: return 0.02;
  }
}

function roundPrice(price: number, symbol: string): number {
  // Different commodities have different price precisions
  const precision = ['GC', 'PL', 'PA', 'CC', 'ZS'].includes(symbol) ? 2 :
                   ['CL', 'BZ', 'NG', 'SI'].includes(symbol) ? 2 :
                   ['ZC', 'ZW', 'CT', 'KC', 'SB', 'LE', 'HE', 'GF'].includes(symbol) ? 2 : 4;
  return Math.round(price * Math.pow(10, precision)) / Math.pow(10, precision);
}

// Generate simulated historical price data
function getCommodityHistory(symbol: string, days: number) {
  const info = COMMODITY_INFO[symbol];
  const basePrice = BASE_PRICES[symbol];

  if (!info || !basePrice) {
    throw new Error(`Unknown commodity: ${symbol}`);
  }

  const volatility = getVolatilityForCategory(info.category);
  const prices: { timestamp: number; date: string; price: number }[] = [];
  const volumes: { timestamp: number; date: string; volume: number }[] = [];

  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const dataPoints = Math.min(days * 24, 720); // Hourly data, max 30 days worth
  const intervalMs = (days * msPerDay) / dataPoints;

  // Generate price path using geometric brownian motion
  let currentPrice = basePrice;
  const drift = 0.0001; // Small positive drift
  const dt = 1 / dataPoints;

  for (let i = dataPoints; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    const randomShock = (Math.random() - 0.5) * 2;
    const priceChange = currentPrice * (drift * dt + volatility * Math.sqrt(dt) * randomShock);
    currentPrice = Math.max(currentPrice + priceChange, basePrice * 0.5);

    prices.push({
      timestamp,
      date: new Date(timestamp).toISOString(),
      price: roundPrice(currentPrice, symbol)
    });

    // Simulate volume (higher during market hours)
    const hour = new Date(timestamp).getHours();
    const isMarketHours = hour >= 9 && hour <= 16;
    const baseVolume = isMarketHours ? 50000 : 10000;
    volumes.push({
      timestamp,
      date: new Date(timestamp).toISOString(),
      volume: Math.floor(baseVolume * (0.5 + Math.random()))
    });
  }

  const priceValues = prices.map(p => p.price);
  return {
    symbol,
    name: info.name,
    unit: info.unit,
    category: info.category,
    exchange: info.exchange,
    days,
    prices,
    volumes,
    price_change: priceValues[priceValues.length - 1] - priceValues[0],
    price_change_percentage: ((priceValues[priceValues.length - 1] - priceValues[0]) / priceValues[0]) * 100,
    high: Math.max(...priceValues),
    low: Math.min(...priceValues),
    last_updated: new Date().toISOString()
  };
}

// Generate simulated OHLC data
function getCommodityOHLC(symbol: string, days: number) {
  const info = COMMODITY_INFO[symbol];
  const basePrice = BASE_PRICES[symbol];

  if (!info || !basePrice) {
    throw new Error(`Unknown commodity: ${symbol}`);
  }

  const volatility = getVolatilityForCategory(info.category);
  const candles: {
    timestamp: number;
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[] = [];

  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  // Determine candle interval based on days
  let candleInterval: number;
  let numCandles: number;
  if (days <= 1) {
    candleInterval = 15 * 60 * 1000; // 15 min
    numCandles = 96;
  } else if (days <= 7) {
    candleInterval = 60 * 60 * 1000; // 1 hour
    numCandles = days * 24;
  } else if (days <= 30) {
    candleInterval = 4 * 60 * 60 * 1000; // 4 hours
    numCandles = days * 6;
  } else {
    candleInterval = msPerDay; // Daily
    numCandles = days;
  }

  let currentPrice = basePrice;

  for (let i = numCandles; i >= 0; i--) {
    const timestamp = now - (i * candleInterval);

    // Generate OHLC for this candle
    const open = currentPrice;
    const dailyVolatility = volatility * Math.sqrt(candleInterval / msPerDay);

    // Random price movements within candle
    const move1 = currentPrice * dailyVolatility * (Math.random() - 0.5) * 2;
    const move2 = currentPrice * dailyVolatility * (Math.random() - 0.5) * 2;
    const close = currentPrice + move1;
    const high = Math.max(open, close) + Math.abs(move2) * 0.5;
    const low = Math.min(open, close) - Math.abs(move2) * 0.5;

    currentPrice = close;

    // Volume simulation
    const hour = new Date(timestamp).getHours();
    const isMarketHours = hour >= 9 && hour <= 16;
    const baseVolume = isMarketHours ? 100000 : 25000;

    candles.push({
      timestamp,
      date: new Date(timestamp).toISOString(),
      open: roundPrice(open, symbol),
      high: roundPrice(high, symbol),
      low: roundPrice(low, symbol),
      close: roundPrice(close, symbol),
      volume: Math.floor(baseVolume * (0.5 + Math.random()))
    });
  }

  return {
    symbol,
    name: info.name,
    unit: info.unit,
    category: info.category,
    exchange: info.exchange,
    days,
    candles,
    current_price: candles[candles.length - 1]?.close || basePrice,
    period_high: Math.max(...candles.map(c => c.high)),
    period_low: Math.min(...candles.map(c => c.low)),
    last_updated: new Date().toISOString()
  };
}
