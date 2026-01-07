import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { calculateBlackScholes } from '@/lib/calculations/black-scholes';

// In-memory cache for external API calls to prevent rate limiting
const priceCache = new Map<string, { data: number | { bid: number; ask: number; mid: number }; timestamp: number }>();
const PRICE_CACHE_DURATION = 30000; // 30 seconds

// Fetch current stock price from Yahoo Finance
async function fetchCurrentPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 30 } }
    );
    if (response.ok) {
      const data = await response.json();
      const quote = data.chart.result[0].indicators.quote[0];
      const latestIndex = quote.close.length - 1;
      return quote.close[latestIndex] || data.chart.result[0].meta.regularMarketPrice || 100;
    }
  } catch (e) {
    console.error('Failed to fetch price for', symbol, e);
  }
  return 0; // Return 0 to indicate fetch failed
}

// Fetch current crypto price from CoinGecko (with caching to prevent rate limiting)
async function fetchCryptoPrice(symbol: string): Promise<number> {
  // Check cache first
  const cacheKey = `crypto-${symbol}`;
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_DURATION) {
    return cached.data as number;
  }

  try {
    const coinIdMap: Record<string, string> = {
      'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'USDT': 'tether',
      'BNB': 'binancecoin', 'XRP': 'ripple', 'USDC': 'usd-coin', 'ADA': 'cardano',
      'DOGE': 'dogecoin', 'AVAX': 'avalanche-2', 'TRX': 'tron', 'TON': 'the-open-network',
      'LINK': 'chainlink', 'MATIC': 'matic-network', 'DOT': 'polkadot', 'SHIB': 'shiba-inu'
    };

    const coinId = coinIdMap[symbol] || symbol.toLowerCase();
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );

    if (response.ok) {
      const data = await response.json();
      const price = data[coinId]?.usd || 0;

      // Update cache
      priceCache.set(cacheKey, { data: price, timestamp: Date.now() });

      return price;
    }
  } catch (e) {
    console.error('Failed to fetch crypto price for', symbol, e);
  }
  return 0;
}

// Fetch current CFD price from internal API
async function fetchCFDPrice(symbol: string): Promise<{ bid: number; ask: number; mid: number }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/market/cfd?symbol=${symbol}`,
      { next: { revalidate: 30 } }
    );

    if (response.ok) {
      const quote = await response.json();
      if (quote && quote.bid && quote.ask) {
        return {
          bid: quote.bid,
          ask: quote.ask,
          mid: quote.price || (quote.bid + quote.ask) / 2
        };
      }
    }
  } catch (e) {
    console.error('Failed to fetch CFD price for', symbol, e);
  }
  return { bid: 0, ask: 0, mid: 0 };
}

// Fetch current futures price from internal API
async function fetchFuturePrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/market/futures`,
      { next: { revalidate: 30 } }
    );

    if (response.ok) {
      const contracts = await response.json();
      const contract = contracts.find((c: { symbol: string }) => c.symbol === symbol);
      if (contract && contract.price) {
        return contract.price;
      }
    }
  } catch (e) {
    console.error('Failed to fetch futures price for', symbol, e);
  }
  return 0;
}

// Parse option symbol format: "SPY-2026-01-26-680-call" or "AAPL-2025-12-20-180-put"
function parseOptionSymbol(symbol: string): {
  ticker: string;
  expiry: string;
  strike: number;
  optionType: 'call' | 'put';
} | null {
  // Try format: TICKER-YYYY-MM-DD-STRIKE-TYPE
  const match = symbol.match(/^([A-Z]+)-(\d{4}-\d{2}-\d{2})-(\d+(?:\.\d+)?)-(\w+)$/i);
  if (match) {
    return {
      ticker: match[1].toUpperCase(),
      expiry: match[2],
      strike: parseFloat(match[3]),
      optionType: match[4].toLowerCase() === 'put' ? 'put' : 'call',
    };
  }
  return null;
}

// Estimate Greeks based on option parameters (simplified Black-Scholes approximations)
function estimateGreeks(
  optionType: 'call' | 'put',
  strike: number,
  daysToExpiry: number,
  entryPrice: number
): { delta: number; gamma: number; theta: number; vega: number } {
  // Simplified estimates - in production, use proper Black-Scholes
  const timeToExpiry = Math.max(daysToExpiry / 365, 0.001);
  const sqrtT = Math.sqrt(timeToExpiry);

  // Rough ATM approximations
  const baseDelta = optionType === 'call' ? 0.5 : -0.5;
  const delta = baseDelta * (1 + (daysToExpiry > 30 ? 0.1 : -0.1));

  // Gamma is highest ATM and near expiry
  const gamma = 0.02 / sqrtT;

  // Theta increases as expiry approaches (negative for long options)
  const dailyTheta = -entryPrice * 0.01 / Math.max(daysToExpiry, 1);

  // Vega decreases as expiry approaches
  const vega = entryPrice * 0.1 * sqrtT;

  return {
    delta: Math.max(-1, Math.min(1, delta)),
    gamma: Math.max(0, Math.min(0.1, gamma)),
    theta: dailyTheta,
    vega: Math.max(0, vega),
  };
}

export interface TransformedPosition {
  id: string;
  symbol: string;
  ticker: string;
  assetClass: 'option' | 'crypto' | 'cfd' | 'stock' | 'future';
  type?: 'call' | 'put' | 'long' | 'short';
  strike?: number;
  expiry?: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  delta?: number;
  theta?: number;
  gamma?: number;
  vega?: number;
  daysToExpiry?: number;
  strategy?: string;
  // Option-specific fields
  underlyingPrice?: number;
  intrinsicValue?: number;
  timeValue?: number;
  breakeven?: number;
  priceSource: 'live' | 'estimated' | 'entry';
  impliedVolatility?: number;
  // CFD-specific fields
  leverage?: number;
  marginUsed?: number;
  positionValue?: number;
  // Crypto/general fields
  name?: string;
  image?: string;
}

export async function GET() {
  const supabase = await createSupabaseServer();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Fetching positions for user:', user.id);

    // Fetch open positions from the positions table
    const { data: positions, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }

    // Parse notes to determine asset class for each position
    const positionsWithAssetClass = (positions || []).map(pos => {
      let assetClass: 'option' | 'crypto' | 'cfd' | 'stock' | 'future' = 'option';
      let notes: Record<string, unknown> = {};

      try {
        if (pos.notes) {
          notes = typeof pos.notes === 'string' ? JSON.parse(pos.notes) : pos.notes;
          assetClass = (notes.asset_class as 'option' | 'crypto' | 'cfd' | 'stock' | 'future' | undefined) || 'option';
        }
      } catch (e) {
        console.error('Failed to parse notes for position', pos.id, e);
      }

      return { ...pos, assetClass, parsedNotes: notes };
    });

    // Group positions by asset class to fetch prices efficiently
    const optionPositions = positionsWithAssetClass.filter(p => p.assetClass === 'option');
    const cryptoPositions = positionsWithAssetClass.filter(p => p.assetClass === 'crypto');
    const cfdPositions = positionsWithAssetClass.filter(p => p.assetClass === 'cfd');
    const futurePositions = positionsWithAssetClass.filter(p => p.assetClass === 'future');

    // Fetch underlying prices for options
    const uniqueOptionTickers = [...new Set(optionPositions.map(pos => {
      const parsed = parseOptionSymbol(pos.symbol);
      return parsed?.ticker || pos.symbol.split('-')[0] || pos.symbol;
    }))];

    const optionPricePromises = uniqueOptionTickers.map(async ticker => ({
      ticker,
      price: await fetchCurrentPrice(ticker)
    }));

    // Fetch crypto prices
    const uniqueCryptoSymbols = [...new Set(cryptoPositions.map(pos => pos.symbol))];
    const cryptoPricePromises = uniqueCryptoSymbols.map(async symbol => ({
      symbol,
      price: await fetchCryptoPrice(symbol)
    }));

    // Fetch CFD prices
    const uniqueCFDSymbols = [...new Set(cfdPositions.map(pos => pos.symbol))];
    const cfdPricePromises = uniqueCFDSymbols.map(async symbol => ({
      symbol,
      prices: await fetchCFDPrice(symbol)
    }));

    // Fetch futures prices
    const uniqueFutureSymbols = [...new Set(futurePositions.map(pos => pos.symbol))];
    const futurePricePromises = uniqueFutureSymbols.map(async symbol => ({
      symbol,
      price: await fetchFuturePrice(symbol)
    }));

    // Wait for all prices
    const [optionPriceResults, cryptoPriceResults, cfdPriceResults, futurePriceResults] = await Promise.all([
      Promise.all(optionPricePromises),
      Promise.all(cryptoPricePromises),
      Promise.all(cfdPricePromises),
      Promise.all(futurePricePromises)
    ]);

    // Create price lookup maps
    const underlyingPrices: Record<string, number> = {};
    for (const { ticker, price } of optionPriceResults) {
      underlyingPrices[ticker] = price;
    }

    const cryptoPrices: Record<string, number> = {};
    for (const { symbol, price } of cryptoPriceResults) {
      cryptoPrices[symbol] = price;
    }

    const cfdPrices: Record<string, { bid: number; ask: number; mid: number }> = {};
    for (const { symbol, prices } of cfdPriceResults) {
      cfdPrices[symbol] = prices;
    }

    const futurePrices: Record<string, number> = {};
    for (const { symbol, price } of futurePriceResults) {
      futurePrices[symbol] = price;
    }

    // Transform database positions to match frontend interface
    const transformedPositions: TransformedPosition[] = positionsWithAssetClass.map(pos => {
      const assetClass = pos.assetClass;
      const notes = pos.parsedNotes;

      if (assetClass === 'crypto') {
        return transformCryptoPosition(pos, notes, cryptoPrices);
      } else if (assetClass === 'cfd') {
        return transformCFDPosition(pos, notes, cfdPrices);
      } else if (assetClass === 'future') {
        return transformFuturePosition(pos, notes, futurePrices);
      } else {
        return transformOptionPosition(pos, notes, underlyingPrices);
      }
    });

    // Detect strategies from position combinations (options only)
    // Only apply to options, leave futures and others untouched
    const optionPositionsOnly = transformedPositions.filter(p => p.assetClass === 'option');
    const nonOptionPositions = transformedPositions.filter(p => p.assetClass !== 'option');
    const optionsWithStrategies = detectStrategies(optionPositionsOnly);
    const positionsWithStrategies = [...nonOptionPositions, ...optionsWithStrategies];

    return NextResponse.json({ positions: positionsWithStrategies });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

// Transform Future position
function transformFuturePosition(
  pos: { id: string; symbol: string; quantity: number; entry_price: number; current_price?: number | null; contract_size?: number | null; expiry?: string | null; position_type?: string | null },
  notes: Record<string, unknown>,
  futurePrices: Record<string, number>
): TransformedPosition {
  const symbol = pos.symbol;
  const contractSize = (pos.contract_size as number | undefined) || (notes.contract_size as number | undefined) || 100;
  const expiry = pos.expiry || (notes.expiry as string | undefined) || undefined;
  const positionType = (pos.position_type as string | undefined) || (notes.position_type as string | undefined) || 'long';
  const currentPrice = futurePrices[symbol] || pos.current_price || pos.entry_price;
  const priceSource = futurePrices[symbol] ? 'live' : 'entry';

  // P&L calculation for futures (contract size multiplier)
  const priceDiff = positionType === 'long'
    ? (currentPrice - pos.entry_price)
    : (pos.entry_price - currentPrice);
  const pnl = priceDiff * pos.quantity * contractSize;
  const pnlPercent = pos.entry_price > 0
    ? (priceDiff / pos.entry_price) * 100
    : 0;

  return {
    id: pos.id,
    symbol,
    ticker: symbol,
    assetClass: 'future',
    type: positionType as 'long' | 'short',
    quantity: pos.quantity,
    avgPrice: pos.entry_price,
    currentPrice,
    pnl,
    pnlPercent,
    priceSource,
    expiry,
    name: notes.name as string | undefined,
    image: notes.image as string | undefined
  };
}

// Transform crypto position
function transformCryptoPosition(
  pos: { id: string; symbol: string; quantity: number; entry_price: number; current_price?: number | null },
  notes: Record<string, unknown>,
  cryptoPrices: Record<string, number>
): TransformedPosition {
  const symbol = pos.symbol;
  const currentPrice = cryptoPrices[symbol] || pos.current_price || pos.entry_price;
  const priceSource = cryptoPrices[symbol] > 0 ? 'live' : 'entry';

  // P&L calculation for spot crypto (no multiplier)
  const pnl = (currentPrice - pos.entry_price) * pos.quantity;
  const pnlPercent = pos.entry_price > 0
    ? ((currentPrice - pos.entry_price) / pos.entry_price) * 100
    : 0;

  return {
    id: pos.id,
    symbol,
    ticker: symbol,
    assetClass: 'crypto',
    type: pos.quantity > 0 ? 'long' : 'short',
    quantity: pos.quantity,
    avgPrice: pos.entry_price,
    currentPrice,
    pnl,
    pnlPercent,
    priceSource,
    name: notes.name as string | undefined,
    image: notes.image as string | undefined,
  };
}

// Transform CFD position
function transformCFDPosition(
  pos: { id: string; symbol: string; quantity: number; entry_price: number; current_price?: number | null; cost_basis?: number | null },
  notes: Record<string, unknown>,
  cfdPrices: Record<string, { bid: number; ask: number; mid: number }>
): TransformedPosition {
  const symbol = pos.symbol;
  const cfdQuote = cfdPrices[symbol];
  const positionType = (notes.position_type as string | undefined) || 'long';

  // Use bid for long positions (selling price), ask for short positions (buying price to close)
  const currentPrice = cfdQuote
    ? (positionType === 'long' ? cfdQuote.bid : cfdQuote.ask)
    : pos.current_price || pos.entry_price;

  const priceSource = cfdQuote ? 'live' : 'entry';
  const leverage = (notes.leverage as number | undefined) || 1;

  // P&L calculation for CFDs (no multiplier, but account for position direction)
  const priceDiff = positionType === 'long'
    ? (currentPrice - pos.entry_price)
    : (pos.entry_price - currentPrice);

  const pnl = priceDiff * pos.quantity * leverage;
  const pnlPercent = pos.entry_price > 0
    ? (priceDiff / pos.entry_price) * 100 * leverage
    : 0;

  const positionValue = pos.quantity * currentPrice * leverage;
  const marginUsed = pos.cost_basis || (pos.quantity * pos.entry_price * leverage);

  return {
    id: pos.id,
    symbol,
    ticker: symbol,
    assetClass: 'cfd',
    type: positionType as 'long' | 'short',
    quantity: pos.quantity,
    avgPrice: pos.entry_price,
    currentPrice,
    pnl,
    pnlPercent,
    priceSource,
    leverage,
    marginUsed,
    positionValue,
  };
}

// Transform option position (original logic)
function transformOptionPosition(
  pos: { id: string; symbol: string; quantity: number; entry_price: number; strike_price?: number | null; expiration_date?: string | null; option_type?: string | null; position_type?: string | null; delta?: number | null; gamma?: number | null; theta?: number | null; vega?: number | null; implied_volatility?: number | null; strategy?: string | null },
  notes: Record<string, unknown>,
  underlyingPrices: Record<string, number>
): TransformedPosition {
      // Try to parse the symbol if strike/expiry are missing
      const parsed = parseOptionSymbol(pos.symbol);

      const ticker = parsed?.ticker || pos.symbol.split('-')[0] || pos.symbol;
      const strike = pos.strike_price || parsed?.strike || 0;
      const expiry = pos.expiration_date || parsed?.expiry || '';
      const optionType = (parsed?.optionType ||
        (pos.symbol.toLowerCase().includes('put') ? 'put' :
         pos.symbol.toLowerCase().includes('call') ? 'call' :
         pos.option_type || pos.position_type)) as 'call' | 'put';

      // Calculate days to expiry
      const expiryDate = expiry ? new Date(expiry) : new Date();
      const daysToExpiry = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      const timeToExpiry = daysToExpiry / 365;

      // Get current underlying price
      const underlyingPrice = underlyingPrices[ticker] || 0;

      // Calculate current option price using Black-Scholes if we have underlying price
      let currentPrice = pos.entry_price;
      let priceSource: 'live' | 'estimated' | 'entry' = 'entry';
      let greeks = { delta: 0, gamma: 0, theta: 0, vega: 0 };
      const impliedVolatility = pos.implied_volatility || 0.30; // Default 30% IV

      if (underlyingPrice > 0 && strike > 0 && daysToExpiry > 0) {
        try {
          const bsResult = calculateBlackScholes({
            spotPrice: underlyingPrice,
            strikePrice: strike,
            timeToExpiry,
            riskFreeRate: 0.05, // 5% risk-free rate
            volatility: impliedVolatility,
            optionType
          });
          currentPrice = bsResult.price;
          greeks = {
            delta: bsResult.greeks.delta,
            gamma: bsResult.greeks.gamma,
            theta: bsResult.greeks.theta,
            vega: bsResult.greeks.vega
          };
          priceSource = 'live';
        } catch (e) {
          console.error('Black-Scholes calculation failed:', e);
          // Fall back to estimated Greeks
          greeks = estimateGreeks(optionType, strike, daysToExpiry, pos.entry_price);
          priceSource = 'estimated';
        }
      } else if (daysToExpiry === 0) {
        // Expired option - intrinsic value only
        currentPrice = optionType === 'call'
          ? Math.max(0, underlyingPrice - strike)
          : Math.max(0, strike - underlyingPrice);
        priceSource = underlyingPrice > 0 ? 'live' : 'entry';
      } else {
        // Fallback to stored or estimated Greeks
        const hasGreeks = pos.delta !== null && pos.delta !== 0;
        greeks = hasGreeks
          ? { delta: pos.delta || 0, gamma: pos.gamma || 0, theta: pos.theta || 0, vega: pos.vega || 0 }
          : estimateGreeks(optionType, strike, daysToExpiry, pos.entry_price);
      }

      // Calculate intrinsic and time value
      const intrinsicValue = optionType === 'call'
        ? Math.max(0, underlyingPrice - strike)
        : Math.max(0, strike - underlyingPrice);
      const timeValue = Math.max(0, currentPrice - intrinsicValue);

      // Calculate breakeven (for long positions)
      const breakeven = optionType === 'call'
        ? strike + pos.entry_price
        : strike - pos.entry_price;

      // Calculate P&L
      const pnl = (currentPrice - pos.entry_price) * pos.quantity * 100;
      const pnlPercent = pos.entry_price > 0
        ? ((currentPrice - pos.entry_price) / pos.entry_price) * 100
        : 0;

      return {
        id: pos.id,
        symbol: pos.symbol,
        ticker,
        assetClass: 'option' as const,
        type: optionType,
        strike,
        expiry,
        quantity: pos.quantity,
        avgPrice: pos.entry_price,
        currentPrice,
        pnl,
        pnlPercent,
        delta: greeks.delta || 0,
        theta: greeks.theta || 0,
        gamma: greeks.gamma || 0,
        vega: greeks.vega || 0,
        daysToExpiry,
        strategy: pos.strategy || undefined,
        underlyingPrice,
        intrinsicValue,
        timeValue,
        breakeven,
        priceSource,
        impliedVolatility: impliedVolatility * 100, // Convert to percentage
      };
}

// Detect multi-leg option strategies from positions
function detectStrategies(positions: TransformedPosition[]): TransformedPosition[] {
  if (positions.length < 2) {
    return positions;
  }

  // Only detect strategies for options
  const optionPositions = positions.filter(p => p.assetClass === 'option');
  const nonOptionPositions = positions.filter(p => p.assetClass !== 'option');

  if (optionPositions.length < 2) {
    return positions;
  }

  // Group positions by ticker
  const byTicker: Record<string, TransformedPosition[]> = {};
  for (const pos of optionPositions) {
    if (!byTicker[pos.ticker]) {
      byTicker[pos.ticker] = [];
    }
    byTicker[pos.ticker].push(pos);
  }

  const result: TransformedPosition[] = [...nonOptionPositions];

  for (const ticker of Object.keys(byTicker)) {
    const tickerPositions = byTicker[ticker];

    if (tickerPositions.length === 1) {
      // Single position - no strategy
      result.push({ ...tickerPositions[0], strategy: 'Single Leg' });
      continue;
    }

    // Sort by strike for strategy detection
    tickerPositions.sort((a, b) => (a.strike || 0) - (b.strike || 0));

    const calls = tickerPositions.filter(p => p.type === 'call');
    const puts = tickerPositions.filter(p => p.type === 'put');

    // Detect strategy types
    if (calls.length === 1 && puts.length === 1) {
      // Check for strangle or straddle
      const call = calls[0];
      const put = puts[0];

      if (call.strike === put.strike) {
        // Same strike = Straddle
        result.push({ ...call, strategy: 'Straddle (Call Leg)' });
        result.push({ ...put, strategy: 'Straddle (Put Leg)' });
      } else {
        // Different strikes = Strangle
        result.push({ ...call, strategy: 'Strangle (Call Leg)' });
        result.push({ ...put, strategy: 'Strangle (Put Leg)' });
      }
    } else if (calls.length === 2 && puts.length === 0) {
      // Call spread
      const [lower, higher] = calls;
      if (lower.quantity > 0 && higher.quantity < 0) {
        result.push({ ...lower, strategy: 'Bull Call Spread (Long Leg)' });
        result.push({ ...higher, strategy: 'Bull Call Spread (Short Leg)' });
      } else if (lower.quantity < 0 && higher.quantity > 0) {
        result.push({ ...lower, strategy: 'Bear Call Spread (Short Leg)' });
        result.push({ ...higher, strategy: 'Bear Call Spread (Long Leg)' });
      } else {
        result.push(...calls.map(c => ({ ...c, strategy: 'Call Spread' })));
      }
    } else if (puts.length === 2 && calls.length === 0) {
      // Put spread
      const [lower, higher] = puts;
      if (lower.quantity < 0 && higher.quantity > 0) {
        result.push({ ...lower, strategy: 'Bear Put Spread (Short Leg)' });
        result.push({ ...higher, strategy: 'Bear Put Spread (Long Leg)' });
      } else if (lower.quantity > 0 && higher.quantity < 0) {
        result.push({ ...lower, strategy: 'Bull Put Spread (Long Leg)' });
        result.push({ ...higher, strategy: 'Bull Put Spread (Short Leg)' });
      } else {
        result.push(...puts.map(p => ({ ...p, strategy: 'Put Spread' })));
      }
    } else if (calls.length === 2 && puts.length === 2) {
      // Iron Condor or Iron Butterfly
      result.push(...tickerPositions.map(p => ({ ...p, strategy: 'Iron Condor/Butterfly' })));
    } else {
      // Complex multi-leg position
      result.push(...tickerPositions.map(p => ({ ...p, strategy: 'Multi-Leg' })));
    }
  }

  return result;
}
