import { NextRequest, NextResponse } from 'next/server';

const METALPRICE_API_KEY = process.env.METALPRICE_API_KEY;

// Cache for rate limiting
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

// Futures contract specifications
const FUTURES_CONTRACTS: Record<string, {
  name: string;
  exchange: string;
  category: 'index' | 'currency' | 'commodity' | 'interest_rate' | 'crypto';
  contract_size: number;
  tick_size: number;
  tick_value: number;
  margin_requirement: number; // as percentage
  trading_hours: string;
  months: string[]; // Contract months (H=Mar, M=Jun, U=Sep, Z=Dec for most)
}> = {
  // Index Futures
  'ES': {
    name: 'E-mini S&P 500',
    exchange: 'CME',
    category: 'index',
    contract_size: 50,
    tick_size: 0.25,
    tick_value: 12.50,
    margin_requirement: 5,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  'NQ': {
    name: 'E-mini NASDAQ 100',
    exchange: 'CME',
    category: 'index',
    contract_size: 20,
    tick_size: 0.25,
    tick_value: 5.00,
    margin_requirement: 5,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  'YM': {
    name: 'E-mini Dow',
    exchange: 'CBOT',
    category: 'index',
    contract_size: 5,
    tick_size: 1,
    tick_value: 5.00,
    margin_requirement: 5,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  'RTY': {
    name: 'E-mini Russell 2000',
    exchange: 'CME',
    category: 'index',
    contract_size: 50,
    tick_size: 0.10,
    tick_value: 5.00,
    margin_requirement: 5,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  'MES': {
    name: 'Micro E-mini S&P 500',
    exchange: 'CME',
    category: 'index',
    contract_size: 5,
    tick_size: 0.25,
    tick_value: 1.25,
    margin_requirement: 3,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  'MNQ': {
    name: 'Micro E-mini NASDAQ 100',
    exchange: 'CME',
    category: 'index',
    contract_size: 2,
    tick_size: 0.25,
    tick_value: 0.50,
    margin_requirement: 3,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  // Currency Futures
  '6E': {
    name: 'Euro FX',
    exchange: 'CME',
    category: 'currency',
    contract_size: 125000,
    tick_size: 0.00005,
    tick_value: 6.25,
    margin_requirement: 2,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  '6J': {
    name: 'Japanese Yen',
    exchange: 'CME',
    category: 'currency',
    contract_size: 12500000,
    tick_size: 0.0000005,
    tick_value: 6.25,
    margin_requirement: 2,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  '6B': {
    name: 'British Pound',
    exchange: 'CME',
    category: 'currency',
    contract_size: 62500,
    tick_size: 0.0001,
    tick_value: 6.25,
    margin_requirement: 2,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  '6A': {
    name: 'Australian Dollar',
    exchange: 'CME',
    category: 'currency',
    contract_size: 100000,
    tick_size: 0.0001,
    tick_value: 10.00,
    margin_requirement: 2,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  '6C': {
    name: 'Canadian Dollar',
    exchange: 'CME',
    category: 'currency',
    contract_size: 100000,
    tick_size: 0.00005,
    tick_value: 5.00,
    margin_requirement: 2,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  // Commodity Futures
  'CL': {
    name: 'Crude Oil WTI',
    exchange: 'NYMEX',
    category: 'commodity',
    contract_size: 1000,
    tick_size: 0.01,
    tick_value: 10.00,
    margin_requirement: 7,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z']
  },
  'GC': {
    name: 'Gold',
    exchange: 'COMEX',
    category: 'commodity',
    contract_size: 100,
    tick_size: 0.10,
    tick_value: 10.00,
    margin_requirement: 5,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['G', 'J', 'M', 'Q', 'V', 'Z']
  },
  'SI': {
    name: 'Silver',
    exchange: 'COMEX',
    category: 'commodity',
    contract_size: 5000,
    tick_size: 0.005,
    tick_value: 25.00,
    margin_requirement: 8,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'K', 'N', 'U', 'Z']
  },
  'NG': {
    name: 'Natural Gas',
    exchange: 'NYMEX',
    category: 'commodity',
    contract_size: 10000,
    tick_size: 0.001,
    tick_value: 10.00,
    margin_requirement: 10,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z']
  },
  'HG': {
    name: 'Copper',
    exchange: 'COMEX',
    category: 'commodity',
    contract_size: 25000,
    tick_size: 0.0005,
    tick_value: 12.50,
    margin_requirement: 6,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'K', 'N', 'U', 'Z']
  },
  // Interest Rate Futures
  'ZB': {
    name: '30-Year T-Bond',
    exchange: 'CBOT',
    category: 'interest_rate',
    contract_size: 100000,
    tick_size: 0.03125,
    tick_value: 31.25,
    margin_requirement: 3,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  'ZN': {
    name: '10-Year T-Note',
    exchange: 'CBOT',
    category: 'interest_rate',
    contract_size: 100000,
    tick_size: 0.015625,
    tick_value: 15.625,
    margin_requirement: 2,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  'ZF': {
    name: '5-Year T-Note',
    exchange: 'CBOT',
    category: 'interest_rate',
    contract_size: 100000,
    tick_size: 0.0078125,
    tick_value: 7.8125,
    margin_requirement: 1.5,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['H', 'M', 'U', 'Z']
  },
  // Crypto Futures
  'BTC': {
    name: 'Bitcoin Futures',
    exchange: 'CME',
    category: 'crypto',
    contract_size: 5,
    tick_size: 5,
    tick_value: 25.00,
    margin_requirement: 40,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z']
  },
  'MBT': {
    name: 'Micro Bitcoin Futures',
    exchange: 'CME',
    category: 'crypto',
    contract_size: 0.1,
    tick_size: 5,
    tick_value: 0.50,
    margin_requirement: 40,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z']
  },
  'ETH': {
    name: 'Ether Futures',
    exchange: 'CME',
    category: 'crypto',
    contract_size: 50,
    tick_size: 0.25,
    tick_value: 12.50,
    margin_requirement: 40,
    trading_hours: 'Sun-Fri 6:00pm-5:00pm ET',
    months: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z']
  },
};

// Base prices for simulation (updated regularly in production)
const BASE_PRICES: Record<string, number> = {
  'ES': 5950.00,
  'NQ': 21200.00,
  'YM': 44500,
  'RTY': 2050.00,
  'MES': 5950.00,
  'MNQ': 21200.00,
  '6E': 1.0850,
  '6J': 0.00667,
  '6B': 1.2750,
  '6A': 0.6550,
  '6C': 0.7150,
  'CL': 72.50,
  'GC': 2045.00,
  'SI': 23.50,
  'NG': 2.85,
  'HG': 3.85,
  'ZB': 118.50,
  'ZN': 110.25,
  'ZF': 108.50,
  'BTC': 98500,
  'MBT': 98500,
  'ETH': 3850,
};

// Month code to name mapping
const MONTH_CODES: Record<string, { name: string; number: number }> = {
  'F': { name: 'January', number: 0 },
  'G': { name: 'February', number: 1 },
  'H': { name: 'March', number: 2 },
  'J': { name: 'April', number: 3 },
  'K': { name: 'May', number: 4 },
  'M': { name: 'June', number: 5 },
  'N': { name: 'July', number: 6 },
  'Q': { name: 'August', number: 7 },
  'U': { name: 'September', number: 8 },
  'V': { name: 'October', number: 9 },
  'X': { name: 'November', number: 10 },
  'Z': { name: 'December', number: 11 },
};

// GET /api/market/futures?symbol=ES or ?category=index or ?type=list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();
    const category = searchParams.get('category') as 'index' | 'currency' | 'commodity' | 'interest_rate' | 'crypto' | null;
    const type = searchParams.get('type') || 'quote';
    const contract = searchParams.get('contract'); // e.g., 'H25' for March 2025

    // Check cache
    const cacheKey = `futures-${type}-${symbol || category || 'all'}-${contract || 'front'}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    let data;

    if (type === 'list') {
      // Return list of available futures contracts
      data = Object.entries(FUTURES_CONTRACTS).map(([sym, info]) => ({
        symbol: sym,
        ...info,
        available_contracts: getAvailableContracts(sym)
      }));
    } else if (type === 'chain') {
      // Get futures chain (all available contract months)
      if (!symbol) {
        throw new Error('Symbol required for futures chain');
      }
      data = await getFuturesChain(symbol);
    } else if (symbol) {
      // Get quote for specific contract
      data = await getFuturesQuote(symbol, contract || undefined);
    } else if (category) {
      // Get all futures in a category
      data = await getFuturesByCategory(category);
    } else {
      // Get all futures (front month)
      data = await getAllFutures();
    }

    // Update cache
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Futures API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch futures data' },
      { status: 500 }
    );
  }
}

function getAvailableContracts(symbol: string): string[] {
  const spec = FUTURES_CONTRACTS[symbol];
  if (!spec) return [];

  const contracts: string[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Generate next 4 available contract months
  for (let i = 0; i < 12 && contracts.length < 4; i++) {
    const targetMonth = (currentMonth + i) % 12;
    const targetYear = currentYear + Math.floor((currentMonth + i) / 12);

    const monthCode = Object.entries(MONTH_CODES).find(([, v]) => v.number === targetMonth)?.[0];
    if (monthCode && spec.months.includes(monthCode)) {
      const yearCode = (targetYear % 100).toString().padStart(2, '0');
      contracts.push(`${monthCode}${yearCode}`);
    }
  }

  return contracts;
}

function getExpirationDate(monthCode: string, yearCode: string): string {
  const month = MONTH_CODES[monthCode];
  if (!month) return '';

  const year = 2000 + parseInt(yearCode);
  // Third Friday of the month for most futures
  const firstDay = new Date(year, month.number, 1);
  const firstFriday = (5 - firstDay.getDay() + 7) % 7 + 1;
  const thirdFriday = firstFriday + 14;

  return new Date(year, month.number, thirdFriday).toISOString().split('T')[0];
}

async function getFuturesQuote(symbol: string, contract?: string) {
  const spec = FUTURES_CONTRACTS[symbol];
  if (!spec) {
    throw new Error(`Unknown futures symbol: ${symbol}`);
  }

  // Get front month contract if not specified
  const availableContracts = getAvailableContracts(symbol);
  const activeContract = contract || availableContracts[0];
  const monthCode = activeContract.charAt(0);
  const yearCode = activeContract.slice(1);

  let price: number;
  if (symbol === 'GC' || symbol === 'SI') {
    // Fetch live gold or silver price from metalpriceapi.com
    const metalCode = symbol === 'GC' ? 'XAU' : 'XAG';
    const fallback = symbol === 'GC' ? BASE_PRICES['GC'] || 2045.00 : BASE_PRICES['SI'] || 23.50;
    try {
      const metalRes = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${METALPRICE_API_KEY}&base=${metalCode}&currencies=USD`);
      if (!metalRes.ok) {
        console.error(`[MetalPriceAPI] HTTP error for ${metalCode}:`, metalRes.status, metalRes.statusText);
        throw new Error('Failed to fetch metal price');
      }
      const metalData = await metalRes.json();
      console.log(`[MetalPriceAPI] Response for ${metalCode}:`, metalData);
      // Price is in USD per troy ounce
      price = metalData.rates?.USD || fallback;
      if (!metalData.rates?.USD) {
        console.error(`[MetalPriceAPI] No USD rate found for ${metalCode}. Full response:`, metalData);
      }
    } catch (err) {
      console.error(`[MetalPriceAPI] Error fetching ${metalCode}:`, err);
      price = fallback;
    }
  } else {
    // Simulate price movement for other contracts
    const basePrice = BASE_PRICES[symbol] || 100;
    const volatility = getVolatilityForCategory(spec.category);
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    price = basePrice * (1 + randomChange);
  }

  // Add contango/backwardation effect for non-front month contracts
  const contractIndex = availableContracts.indexOf(activeContract);
  const carryAdjustment = contractIndex * 0.001 * (spec.category === 'commodity' ? 1 : -0.5);
  const adjustedPrice = price * (1 + carryAdjustment);

  const change = adjustedPrice - (BASE_PRICES[symbol] || 100);
  const changePercent = (change / (BASE_PRICES[symbol] || 100)) * 100;

  // Simulate intraday data
  const volatility = getVolatilityForCategory(spec.category);
  const high = adjustedPrice * (1 + volatility * Math.random() * 0.5);
  const low = adjustedPrice * (1 - volatility * Math.random() * 0.5);
  const open = (BASE_PRICES[symbol] || 100) * (1 + (Math.random() - 0.5) * volatility * 0.5);
  const volume = Math.floor(50000 + Math.random() * 200000);
  const openInterest = Math.floor(500000 + Math.random() * 1000000);

  return {
    symbol,
    contract: activeContract,
    name: spec.name,
    price: roundPrice(adjustedPrice, symbol),
    change: roundPrice(change, symbol),
    change_percentage: Math.round(changePercent * 100) / 100,
    open: roundPrice(open, symbol),
    high: roundPrice(high, symbol),
    low: roundPrice(low, symbol),
    previous_close: roundPrice(BASE_PRICES[symbol] || 100, symbol),
    volume,
    open_interest: openInterest,
    expiration_date: getExpirationDate(monthCode, yearCode),
    contract_size: spec.contract_size,
    tick_size: spec.tick_size,
    tick_value: spec.tick_value,
    margin_requirement: spec.margin_requirement,
    notional_value: roundPrice(adjustedPrice * spec.contract_size, symbol),
    exchange: spec.exchange,
    category: spec.category,
    trading_hours: spec.trading_hours,
    available_contracts: availableContracts,
    last_updated: new Date().toISOString()
  };
}

async function getFuturesChain(symbol: string) {
  const spec = FUTURES_CONTRACTS[symbol];
  if (!spec) {
    throw new Error(`Unknown futures symbol: ${symbol}`);
  }

  const contracts = getAvailableContracts(symbol);
  const chain = await Promise.all(
    contracts.map(contract => getFuturesQuote(symbol, contract))
  );

  return {
    symbol,
    name: spec.name,
    contracts: chain,
    last_updated: new Date().toISOString()
  };
}

async function getFuturesByCategory(category: 'index' | 'currency' | 'commodity' | 'interest_rate' | 'crypto') {
  const symbols = Object.entries(FUTURES_CONTRACTS)
    .filter(([, spec]) => spec.category === category)
    .map(([symbol]) => symbol);

  const quotes = await Promise.all(symbols.map(symbol => getFuturesQuote(symbol)));
  return quotes;
}

async function getAllFutures() {
  const symbols = Object.keys(FUTURES_CONTRACTS);
  const quotes = await Promise.all(symbols.map(symbol => getFuturesQuote(symbol)));
  return quotes;
}

function getVolatilityForCategory(category: string): number {
  switch (category) {
    case 'index': return 0.015;
    case 'currency': return 0.008;
    case 'commodity': return 0.025;
    case 'interest_rate': return 0.005;
    case 'crypto': return 0.04;
    default: return 0.02;
  }
}

function roundPrice(price: number, symbol: string): number {
  const spec = FUTURES_CONTRACTS[symbol];
  if (!spec) return Math.round(price * 100) / 100;

  // Round to tick size
  const ticks = Math.round(price / spec.tick_size);
  return ticks * spec.tick_size;
}
