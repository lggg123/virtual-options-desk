import { NextRequest, NextResponse } from 'next/server';

// Cache for rate limiting
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 second cache for CFDs (faster updates)

// CFD instrument specifications
const CFD_INSTRUMENTS: Record<string, {
  name: string;
  underlying_asset: string;
  asset_class: 'forex' | 'index' | 'commodity' | 'crypto' | 'stock';
  leverage: number;
  margin_requirement: number;
  min_trade_size: number;
  max_trade_size: number;
  pip_size: number;
  pip_value: number;
  spread_typical: number; // in pips
  trading_hours: string;
  swap_long: number; // overnight financing rate
  swap_short: number;
}> = {
  // Forex CFDs
  'EURUSD': {
    name: 'Euro / US Dollar',
    underlying_asset: 'EUR/USD',
    asset_class: 'forex',
    leverage: 30,
    margin_requirement: 3.33,
    min_trade_size: 0.01,
    max_trade_size: 100,
    pip_size: 0.0001,
    pip_value: 10,
    spread_typical: 0.8,
    trading_hours: 'Sun 5pm - Fri 5pm ET',
    swap_long: -6.5,
    swap_short: 3.2
  },
  'GBPUSD': {
    name: 'British Pound / US Dollar',
    underlying_asset: 'GBP/USD',
    asset_class: 'forex',
    leverage: 30,
    margin_requirement: 3.33,
    min_trade_size: 0.01,
    max_trade_size: 100,
    pip_size: 0.0001,
    pip_value: 10,
    spread_typical: 1.2,
    trading_hours: 'Sun 5pm - Fri 5pm ET',
    swap_long: -5.8,
    swap_short: 2.5
  },
  'USDJPY': {
    name: 'US Dollar / Japanese Yen',
    underlying_asset: 'USD/JPY',
    asset_class: 'forex',
    leverage: 30,
    margin_requirement: 3.33,
    min_trade_size: 0.01,
    max_trade_size: 100,
    pip_size: 0.01,
    pip_value: 6.67,
    spread_typical: 1.0,
    trading_hours: 'Sun 5pm - Fri 5pm ET',
    swap_long: 8.5,
    swap_short: -12.3
  },
  'AUDUSD': {
    name: 'Australian Dollar / US Dollar',
    underlying_asset: 'AUD/USD',
    asset_class: 'forex',
    leverage: 30,
    margin_requirement: 3.33,
    min_trade_size: 0.01,
    max_trade_size: 100,
    pip_size: 0.0001,
    pip_value: 10,
    spread_typical: 1.0,
    trading_hours: 'Sun 5pm - Fri 5pm ET',
    swap_long: -4.2,
    swap_short: 1.8
  },
  'USDCAD': {
    name: 'US Dollar / Canadian Dollar',
    underlying_asset: 'USD/CAD',
    asset_class: 'forex',
    leverage: 30,
    margin_requirement: 3.33,
    min_trade_size: 0.01,
    max_trade_size: 100,
    pip_size: 0.0001,
    pip_value: 7.4,
    spread_typical: 1.5,
    trading_hours: 'Sun 5pm - Fri 5pm ET',
    swap_long: -3.5,
    swap_short: 0.8
  },
  'EURGBP': {
    name: 'Euro / British Pound',
    underlying_asset: 'EUR/GBP',
    asset_class: 'forex',
    leverage: 30,
    margin_requirement: 3.33,
    min_trade_size: 0.01,
    max_trade_size: 100,
    pip_size: 0.0001,
    pip_value: 12.7,
    spread_typical: 1.3,
    trading_hours: 'Sun 5pm - Fri 5pm ET',
    swap_long: -2.1,
    swap_short: -1.5
  },
  // Index CFDs
  'US500': {
    name: 'US 500 (S&P 500)',
    underlying_asset: 'S&P 500 Index',
    asset_class: 'index',
    leverage: 20,
    margin_requirement: 5,
    min_trade_size: 0.1,
    max_trade_size: 500,
    pip_size: 0.1,
    pip_value: 0.10,
    spread_typical: 0.5,
    trading_hours: 'Sun 6pm - Fri 5pm ET',
    swap_long: -12.5,
    swap_short: -3.2
  },
  'US100': {
    name: 'US Tech 100 (NASDAQ)',
    underlying_asset: 'NASDAQ 100 Index',
    asset_class: 'index',
    leverage: 20,
    margin_requirement: 5,
    min_trade_size: 0.1,
    max_trade_size: 200,
    pip_size: 0.1,
    pip_value: 0.10,
    spread_typical: 1.0,
    trading_hours: 'Sun 6pm - Fri 5pm ET',
    swap_long: -15.0,
    swap_short: -4.5
  },
  'US30': {
    name: 'US 30 (Dow Jones)',
    underlying_asset: 'Dow Jones Industrial Average',
    asset_class: 'index',
    leverage: 20,
    margin_requirement: 5,
    min_trade_size: 0.1,
    max_trade_size: 100,
    pip_size: 1,
    pip_value: 1,
    spread_typical: 2.0,
    trading_hours: 'Sun 6pm - Fri 5pm ET',
    swap_long: -10.8,
    swap_short: -2.8
  },
  'GER40': {
    name: 'Germany 40 (DAX)',
    underlying_asset: 'DAX Index',
    asset_class: 'index',
    leverage: 20,
    margin_requirement: 5,
    min_trade_size: 0.1,
    max_trade_size: 200,
    pip_size: 0.1,
    pip_value: 0.10,
    spread_typical: 1.2,
    trading_hours: '3am - 10pm ET',
    swap_long: -8.5,
    swap_short: -2.2
  },
  'UK100': {
    name: 'UK 100 (FTSE)',
    underlying_asset: 'FTSE 100 Index',
    asset_class: 'index',
    leverage: 20,
    margin_requirement: 5,
    min_trade_size: 0.1,
    max_trade_size: 200,
    pip_size: 0.1,
    pip_value: 0.13,
    spread_typical: 1.5,
    trading_hours: '3am - 12pm ET',
    swap_long: -7.2,
    swap_short: -1.8
  },
  // Commodity CFDs
  'XAUUSD': {
    name: 'Gold',
    underlying_asset: 'Gold Spot',
    asset_class: 'commodity',
    leverage: 20,
    margin_requirement: 5,
    min_trade_size: 0.01,
    max_trade_size: 50,
    pip_size: 0.01,
    pip_value: 0.01,
    spread_typical: 20,
    trading_hours: 'Sun 6pm - Fri 5pm ET',
    swap_long: -18.5,
    swap_short: 5.2
  },
  'XAGUSD': {
    name: 'Silver',
    underlying_asset: 'Silver Spot',
    asset_class: 'commodity',
    leverage: 10,
    margin_requirement: 10,
    min_trade_size: 0.01,
    max_trade_size: 100,
    pip_size: 0.001,
    pip_value: 0.05,
    spread_typical: 2.5,
    trading_hours: 'Sun 6pm - Fri 5pm ET',
    swap_long: -12.3,
    swap_short: 3.8
  },
  'USOIL': {
    name: 'US Crude Oil',
    underlying_asset: 'WTI Crude Oil',
    asset_class: 'commodity',
    leverage: 10,
    margin_requirement: 10,
    min_trade_size: 0.1,
    max_trade_size: 500,
    pip_size: 0.01,
    pip_value: 0.01,
    spread_typical: 3,
    trading_hours: 'Sun 6pm - Fri 5pm ET',
    swap_long: -8.5,
    swap_short: 2.1
  },
  'UKOIL': {
    name: 'UK Crude Oil',
    underlying_asset: 'Brent Crude Oil',
    asset_class: 'commodity',
    leverage: 10,
    margin_requirement: 10,
    min_trade_size: 0.1,
    max_trade_size: 500,
    pip_size: 0.01,
    pip_value: 0.01,
    spread_typical: 4,
    trading_hours: 'Mon 1am - Fri 10pm ET',
    swap_long: -9.2,
    swap_short: 2.5
  },
  'NATGAS': {
    name: 'Natural Gas',
    underlying_asset: 'Natural Gas',
    asset_class: 'commodity',
    leverage: 10,
    margin_requirement: 10,
    min_trade_size: 1,
    max_trade_size: 1000,
    pip_size: 0.001,
    pip_value: 0.001,
    spread_typical: 5,
    trading_hours: 'Sun 6pm - Fri 5pm ET',
    swap_long: -5.8,
    swap_short: 1.5
  },
  // Crypto CFDs
  'BTCUSD': {
    name: 'Bitcoin / US Dollar',
    underlying_asset: 'Bitcoin',
    asset_class: 'crypto',
    leverage: 2,
    margin_requirement: 50,
    min_trade_size: 0.001,
    max_trade_size: 10,
    pip_size: 1,
    pip_value: 1,
    spread_typical: 50,
    trading_hours: '24/7',
    swap_long: -25.0,
    swap_short: -25.0
  },
  'ETHUSD': {
    name: 'Ethereum / US Dollar',
    underlying_asset: 'Ethereum',
    asset_class: 'crypto',
    leverage: 2,
    margin_requirement: 50,
    min_trade_size: 0.01,
    max_trade_size: 100,
    pip_size: 0.1,
    pip_value: 0.1,
    spread_typical: 5,
    trading_hours: '24/7',
    swap_long: -25.0,
    swap_short: -25.0
  },
  'SOLUSD': {
    name: 'Solana / US Dollar',
    underlying_asset: 'Solana',
    asset_class: 'crypto',
    leverage: 2,
    margin_requirement: 50,
    min_trade_size: 0.1,
    max_trade_size: 1000,
    pip_size: 0.01,
    pip_value: 0.01,
    spread_typical: 0.5,
    trading_hours: '24/7',
    swap_long: -25.0,
    swap_short: -25.0
  },
  // Stock CFDs (Popular US stocks)
  'AAPL.US': {
    name: 'Apple Inc',
    underlying_asset: 'AAPL',
    asset_class: 'stock',
    leverage: 5,
    margin_requirement: 20,
    min_trade_size: 0.1,
    max_trade_size: 1000,
    pip_size: 0.01,
    pip_value: 0.01,
    spread_typical: 0.05,
    trading_hours: '9:30am - 4pm ET',
    swap_long: -6.5,
    swap_short: -3.2
  },
  'MSFT.US': {
    name: 'Microsoft Corp',
    underlying_asset: 'MSFT',
    asset_class: 'stock',
    leverage: 5,
    margin_requirement: 20,
    min_trade_size: 0.1,
    max_trade_size: 500,
    pip_size: 0.01,
    pip_value: 0.01,
    spread_typical: 0.08,
    trading_hours: '9:30am - 4pm ET',
    swap_long: -6.5,
    swap_short: -3.2
  },
  'NVDA.US': {
    name: 'NVIDIA Corp',
    underlying_asset: 'NVDA',
    asset_class: 'stock',
    leverage: 5,
    margin_requirement: 20,
    min_trade_size: 0.1,
    max_trade_size: 200,
    pip_size: 0.01,
    pip_value: 0.01,
    spread_typical: 0.15,
    trading_hours: '9:30am - 4pm ET',
    swap_long: -6.5,
    swap_short: -3.2
  },
  'TSLA.US': {
    name: 'Tesla Inc',
    underlying_asset: 'TSLA',
    asset_class: 'stock',
    leverage: 5,
    margin_requirement: 20,
    min_trade_size: 0.1,
    max_trade_size: 500,
    pip_size: 0.01,
    pip_value: 0.01,
    spread_typical: 0.20,
    trading_hours: '9:30am - 4pm ET',
    swap_long: -6.5,
    swap_short: -3.2
  },
  'AMZN.US': {
    name: 'Amazon.com Inc',
    underlying_asset: 'AMZN',
    asset_class: 'stock',
    leverage: 5,
    margin_requirement: 20,
    min_trade_size: 0.1,
    max_trade_size: 500,
    pip_size: 0.01,
    pip_value: 0.01,
    spread_typical: 0.10,
    trading_hours: '9:30am - 4pm ET',
    swap_long: -6.5,
    swap_short: -3.2
  },
};

// Base prices for simulation
const BASE_PRICES: Record<string, number> = {
  // Forex
  'EURUSD': 1.0850,
  'GBPUSD': 1.2750,
  'USDJPY': 149.50,
  'AUDUSD': 0.6550,
  'USDCAD': 1.3650,
  'EURGBP': 0.8510,
  // Index
  'US500': 5950,
  'US100': 21200,
  'US30': 44500,
  'GER40': 19850,
  'UK100': 8250,
  // Commodity - Updated Jan 2026
  'XAUUSD': 4498.60, // Gold - Updated Jan 2026 (live market)
  'XAGUSD': 80.96, // Silver - Updated Jan 2026 (live market)
  'USOIL': 58.00, // WTI Crude - Updated Jan 2026
  'UKOIL': 62.50, // Brent Crude - Updated Jan 2026
  'NATGAS': 2.85,
  // Crypto
  'BTCUSD': 98500,
  'ETHUSD': 3850,
  'SOLUSD': 225,
  // Stock
  'AAPL.US': 195.50,
  'MSFT.US': 425.00,
  'NVDA.US': 142.00,
  'TSLA.US': 355.00,
  'AMZN.US': 215.00,
};

// GET /api/market/cfd?symbol=EURUSD or ?asset_class=forex or ?type=list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();
    const assetClass = searchParams.get('asset_class') as 'forex' | 'index' | 'commodity' | 'crypto' | 'stock' | null;
    const type = searchParams.get('type') || 'quote';

    // Check cache
    const cacheKey = `cfd-${type}-${symbol || assetClass || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    let data;

    if (type === 'list') {
      // Return list of available CFD instruments
      data = Object.entries(CFD_INSTRUMENTS).map(([sym, info]) => ({
        symbol: sym,
        ...info
      }));
    } else if (symbol) {
      // Get quote for specific CFD
      data = await getCFDQuote(symbol);
    } else if (assetClass) {
      // Get all CFDs in an asset class
      data = await getCFDsByAssetClass(assetClass);
    } else {
      // Get all CFDs
      data = await getAllCFDs();
    }

    // Update cache
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (error) {
    console.error('CFD API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch CFD data' },
      { status: 500 }
    );
  }
}

async function getCFDQuote(symbol: string) {
  const spec = CFD_INSTRUMENTS[symbol];
  if (!spec) {
    throw new Error(`Unknown CFD symbol: ${symbol}`);
  }

  // Try to fetch live price from EODHD (commodities) or Alpha Vantage (forex/stocks)
  let basePrice = BASE_PRICES[symbol] || 100;
  let useLivePrice = false;
  let r: Record<string, unknown> = {};
  const eodhdKey = process.env.EODHD_API_KEY || '';
  const alphaKey = process.env.ALPHA_VANTAGE_API_KEY || '';

  if (symbol === 'XAUUSD' || symbol === 'XAGUSD' || symbol === 'USOIL' || symbol === 'UKOIL' || symbol === 'NATGAS') {
    // EODHD for commodities
    // let eodhdFailed = false; // removed unused assignment
    try {
      const eodhdSymbol = symbol;
      const url = `https://eodhd.com/api/real-time/${eodhdSymbol}.FOREX?api_token=${eodhdKey}&fmt=json`;
      const resp = await fetch(url);
      const raw = await resp.text();
      let json = {};
      try {
        json = JSON.parse(raw);
      } catch {
        console.warn('EODHD non-JSON response for', symbol, raw);
      }
      r = json || {};
      if (typeof r.close === 'number') {
        basePrice = r.close;
        useLivePrice = true;
      } else {
        console.warn('EODHD did not return valid price for', symbol, JSON.stringify(json));
      }
      }
    } catch (err) {
      console.warn('EODHD fetch failed for', symbol, err);
    }
    }
    // Fallback to Alpha Vantage if EODHD fails
    if (!useLivePrice && (symbol === 'XAUUSD' || symbol === 'XAGUSD')) {
      try {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol.slice(0,3)}&to_currency=${symbol.slice(3)}&apikey=${alphaKey}`;
        const resp = await fetch(url);
        const json = await resp.json();
        const rate = json['Realtime Currency Exchange Rate'] || {};
        if (typeof rate['5. Exchange Rate'] === 'string') {
          basePrice = parseFloat(rate['5. Exchange Rate']);
          useLivePrice = true;
          console.warn('Alpha Vantage fallback used for', symbol, basePrice);
        } else {
          console.warn('Alpha Vantage did not return valid price for', symbol, JSON.stringify(rate));
        }
      } catch (err) {
        console.warn('Alpha Vantage fallback fetch failed for', symbol, err);
      }
    }
  } else if (symbol.endsWith('.US')) {
    // Alpha Vantage for US stocks
    try {
      const avSymbol = symbol.replace('.US', '');
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${avSymbol}&apikey=${alphaKey}`;
      const resp = await fetch(url);
      const json = await resp.json();
      const quote = json['Global Quote'] || {};
      if (typeof quote['05. price'] === 'string') {
        basePrice = parseFloat(quote['05. price']);
        useLivePrice = true;
      }
    } catch (err) {
      console.warn('Alpha Vantage fetch failed for', symbol, err);
    }
  } else {
    // Alpha Vantage for forex
    try {
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol.slice(0,3)}&to_currency=${symbol.slice(3)}&apikey=${alphaKey}`;
      const resp = await fetch(url);
      const json = await resp.json();
      const rate = json['Realtime Currency Exchange Rate'] || {};
      if (typeof rate['5. Exchange Rate'] === 'string') {
        basePrice = parseFloat(rate['5. Exchange Rate']);
        useLivePrice = true;
      }
    } catch (err) {
      console.warn('Alpha Vantage forex fetch failed for', symbol, err);
    }
  }

  const volatility = getVolatilityForAssetClass(spec.asset_class);
  const spreadInPrice = spec.spread_typical * spec.pip_size;

  let midPrice: number;
  let bid: number;
  let ask: number;
  let change: number;
  let changePercent: number;
  let high: number;
  let low: number;
  let open: number;
  let previous_close: number;

  if (useLivePrice) {
    midPrice = typeof r.regularMarketPrice === 'number' ? r.regularMarketPrice : basePrice;
    bid = typeof r.bid === 'number' ? r.bid : (midPrice - spreadInPrice / 2);
    ask = typeof r.ask === 'number' ? r.ask : (midPrice + spreadInPrice / 2);
    previous_close = typeof r.regularMarketPreviousClose === 'number' ? r.regularMarketPreviousClose : basePrice;
    change = typeof r.regularMarketChange === 'number' ? r.regularMarketChange : (midPrice - previous_close);
    changePercent = typeof r.regularMarketChangePercent === 'number' ? r.regularMarketChangePercent : ((change / previous_close) * 100);
    high = typeof r.regularMarketDayHigh === 'number' ? r.regularMarketDayHigh : midPrice * (1 + volatility * Math.random() * 0.5);
    low = typeof r.regularMarketDayLow === 'number' ? r.regularMarketDayLow : midPrice * (1 - volatility * Math.random() * 0.5);
    open = typeof r.regularMarketOpen === 'number' ? r.regularMarketOpen : previous_close * (1 + (Math.random() - 0.5) * volatility * 0.5);
  } else {
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    midPrice = basePrice * (1 + randomChange);
    bid = midPrice - spreadInPrice / 2;
    ask = midPrice + spreadInPrice / 2;
    change = midPrice - basePrice;
    changePercent = (change / basePrice) * 100;
    high = midPrice * (1 + volatility * Math.random() * 0.5);
    low = midPrice * (1 - volatility * Math.random() * 0.5);
    open = basePrice * (1 + (Math.random() - 0.5) * volatility * 0.5);
    previous_close = basePrice;
  }

  // Calculate margin required for 1 lot
  const marginRequired = (midPrice * spec.min_trade_size) / spec.leverage;

  return {
    symbol,
    name: spec.name,
    underlying_asset: spec.underlying_asset,
    asset_class: spec.asset_class,
    price: roundPrice(midPrice, spec.pip_size),
    bid: roundPrice(bid, spec.pip_size),
    ask: roundPrice(ask, spec.pip_size),
    spread: spec.spread_typical,
    spread_cost: roundPrice(spreadInPrice, spec.pip_size),
    change: roundPrice(change, spec.pip_size),
    change_percentage: Math.round(changePercent * 100) / 100,
    open: roundPrice(open, spec.pip_size),
    high: roundPrice(high, spec.pip_size),
    low: roundPrice(low, spec.pip_size),
    previous_close: roundPrice(basePrice, spec.pip_size),
    leverage: spec.leverage,
    margin_requirement: spec.margin_requirement,
    margin_required_1_lot: roundPrice(marginRequired, 0.01),
    pip_size: spec.pip_size,
    pip_value: spec.pip_value,
    min_trade_size: spec.min_trade_size,
    max_trade_size: spec.max_trade_size,
    swap_long: spec.swap_long,
    swap_short: spec.swap_short,
    trading_hours: spec.trading_hours,
    last_updated: new Date().toISOString()
  };
}

async function getCFDsByAssetClass(assetClass: 'forex' | 'index' | 'commodity' | 'crypto' | 'stock') {
  const symbols = Object.entries(CFD_INSTRUMENTS)
    .filter(([, spec]) => spec.asset_class === assetClass)
    .map(([symbol]) => symbol);

  const quotes = await Promise.all(symbols.map(symbol => getCFDQuote(symbol)));
  return quotes;
}

async function getAllCFDs() {
  const symbols = Object.keys(CFD_INSTRUMENTS);
  const quotes = await Promise.all(symbols.map(symbol => getCFDQuote(symbol)));
  return quotes;
}

function getVolatilityForAssetClass(assetClass: string): number {
  switch (assetClass) {
    case 'forex': return 0.005;
    case 'index': return 0.012;
    case 'commodity': return 0.02;
    case 'crypto': return 0.035;
    case 'stock': return 0.018;
    default: return 0.01;
  }
}

function roundPrice(price: number, precision: number): number {
  if (precision >= 1) {
    return Math.round(price / precision) * precision;
  }
  const decimals = Math.abs(Math.floor(Math.log10(precision)));
  return Math.round(price * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
