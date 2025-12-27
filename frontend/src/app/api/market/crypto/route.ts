import { NextRequest, NextResponse } from 'next/server';

// CoinGecko API - Free tier: 30 calls/min
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Cache for rate limiting
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  last_updated: string;
}

// GET /api/market/crypto?ids=bitcoin,ethereum or ?symbol=BTC
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids'); // CoinGecko IDs: bitcoin,ethereum
    const symbol = searchParams.get('symbol'); // Single symbol: BTC
    const type = searchParams.get('type') || 'market'; // market, price, list, history, ohlc
    const days = searchParams.get('days') || '7'; // For history: 1, 7, 30, 90, 365, max
    const interval = searchParams.get('interval'); // For history: minutely, hourly, daily

    // Check cache
    const cacheKey = `crypto-${type}-${ids || symbol}-${days}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    let data;

    if (type === 'list' || type === 'top') {
      // Get list of top cryptocurrencies
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      data = await getTopCryptos(limit);
    } else if (type === 'price' && symbol) {
      // Get simple price for a symbol
      data = await getCryptoPrice(symbol);
    } else if (type === 'history' && symbol) {
      // Get price history for charts
      data = await getCryptoHistory(symbol, days, interval || undefined);
    } else if (type === 'ohlc' && symbol) {
      // Get OHLC candlestick data
      data = await getCryptoOHLC(symbol, days);
    } else if (ids) {
      // Get market data for specific coins
      data = await getCryptoMarketData(ids);
    } else {
      // Default: get top 20 by market cap
      data = await getTopCryptos(20);
    }

    // Update cache
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Crypto API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cryptocurrency data' },
      { status: 500 }
    );
  }
}

async function getTopCryptos(limit: number = 50) {
  const response = await fetch(
    `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`,
    {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }
    }
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const coins: CoinGeckoMarketData[] = await response.json();

  // Return raw CoinGecko format to match what the frontend expects
  return coins.map(coin => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    current_price: coin.current_price,
    price_change_24h: coin.price_change_24h,
    price_change_percentage_24h: coin.price_change_percentage_24h,
    market_cap: coin.market_cap,
    market_cap_rank: coin.market_cap_rank,
    total_volume: coin.total_volume,
    high_24h: coin.high_24h,
    low_24h: coin.low_24h,
    circulating_supply: coin.circulating_supply,
    total_supply: coin.total_supply,
    image: coin.image,
    ath: coin.ath,
    ath_change_percentage: coin.ath_change_percentage,
    last_updated: coin.last_updated
  }));
}

async function getCryptoMarketData(ids: string) {
  const response = await fetch(
    `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
    {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }
    }
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const coins: CoinGeckoMarketData[] = await response.json();

  return coins.map(coin => ({
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price: coin.current_price,
    price_change_24h: coin.price_change_24h,
    price_change_percentage_24h: coin.price_change_percentage_24h,
    market_cap: coin.market_cap,
    volume_24h: coin.total_volume,
    high_24h: coin.high_24h,
    low_24h: coin.low_24h,
    circulating_supply: coin.circulating_supply,
    total_supply: coin.total_supply,
    image: coin.image,
    last_updated: coin.last_updated
  }));
}

async function getCryptoPrice(symbol: string) {
  // Map common symbols to CoinGecko IDs
  const symbolToId: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'AVAX': 'avalanche-2',
    'LINK': 'chainlink',
    'LTC': 'litecoin',
  };

  const coinId = symbolToId[symbol.toUpperCase()] || symbol.toLowerCase();

  const response = await fetch(
    `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
    {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 }
    }
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  const coinData = data[coinId];

  if (!coinData) {
    throw new Error(`Coin not found: ${symbol}`);
  }

  return {
    symbol: symbol.toUpperCase(),
    id: coinId,
    price: coinData.usd,
    change_24h: coinData.usd_24h_change,
    volume_24h: coinData.usd_24h_vol,
    market_cap: coinData.usd_market_cap,
    last_updated: new Date().toISOString()
  };
}

// Symbol to CoinGecko ID mapping
const symbolToId: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'BNB': 'binancecoin',
  'SOL': 'solana',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'LTC': 'litecoin',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'XLM': 'stellar',
  'ALGO': 'algorand',
  'VET': 'vechain',
  'FIL': 'filecoin',
  'TRX': 'tron',
  'ETC': 'ethereum-classic',
  'XMR': 'monero',
  'NEAR': 'near',
  'APT': 'aptos',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'INJ': 'injective-protocol',
  'SUI': 'sui',
  'SEI': 'sei-network',
  'PEPE': 'pepe',
  'SHIB': 'shiba-inu',
};

function getCoinId(symbol: string): string {
  return symbolToId[symbol.toUpperCase()] || symbol.toLowerCase();
}

async function getCryptoHistory(symbol: string, days: string, interval?: string) {
  const coinId = getCoinId(symbol);

  // CoinGecko market_chart endpoint
  // Note: interval is auto-determined by CoinGecko based on days
  // 1 day = 5 min data, 2-90 days = hourly, >90 days = daily
  let url = `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  if (interval) {
    url += `&interval=${interval}`;
  }

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 300 } // 5 min cache for history
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();

  // Transform data for charting
  // CoinGecko returns: { prices: [[timestamp, price], ...], market_caps: [...], total_volumes: [...] }
  return {
    symbol: symbol.toUpperCase(),
    id: coinId,
    days: days,
    prices: data.prices.map((p: [number, number]) => ({
      timestamp: p[0],
      date: new Date(p[0]).toISOString(),
      price: p[1]
    })),
    market_caps: data.market_caps.map((m: [number, number]) => ({
      timestamp: m[0],
      date: new Date(m[0]).toISOString(),
      market_cap: m[1]
    })),
    volumes: data.total_volumes.map((v: [number, number]) => ({
      timestamp: v[0],
      date: new Date(v[0]).toISOString(),
      volume: v[1]
    })),
    // Summary stats
    price_change: data.prices.length > 1
      ? data.prices[data.prices.length - 1][1] - data.prices[0][1]
      : 0,
    price_change_percentage: data.prices.length > 1
      ? ((data.prices[data.prices.length - 1][1] - data.prices[0][1]) / data.prices[0][1]) * 100
      : 0,
    high: Math.max(...data.prices.map((p: [number, number]) => p[1])),
    low: Math.min(...data.prices.map((p: [number, number]) => p[1])),
    last_updated: new Date().toISOString()
  };
}

async function getCryptoOHLC(symbol: string, days: string) {
  const coinId = getCoinId(symbol);

  // CoinGecko OHLC endpoint
  // Valid days: 1, 7, 14, 30, 90, 180, 365, max
  // Candle granularity: 1-2 days = 30min, 3-30 days = 4hr, 31+ days = 4 day
  const response = await fetch(
    `${COINGECKO_API}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
    {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    }
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  // CoinGecko returns: [[timestamp, open, high, low, close], ...]
  const data: [number, number, number, number, number][] = await response.json();

  return {
    symbol: symbol.toUpperCase(),
    id: coinId,
    days: days,
    candles: data.map(candle => ({
      timestamp: candle[0],
      date: new Date(candle[0]).toISOString(),
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4]
    })),
    // Summary
    current_price: data.length > 0 ? data[data.length - 1][4] : 0,
    period_high: Math.max(...data.map(c => c[2])),
    period_low: Math.min(...data.map(c => c[3])),
    last_updated: new Date().toISOString()
  };
}
