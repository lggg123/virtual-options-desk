import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

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
  type: 'call' | 'put';
  strike: number;
  expiry: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  delta: number;
  theta: number;
  gamma: number;
  vega: number;
  daysToExpiry: number;
  strategy?: string;
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

    // Transform database positions to match frontend interface
    const transformedPositions: TransformedPosition[] = (positions || []).map(pos => {
      // Try to parse the symbol if strike/expiry are missing
      const parsed = parseOptionSymbol(pos.symbol);

      const ticker = parsed?.ticker || pos.symbol.split('-')[0] || pos.symbol;
      const strike = pos.strike_price || parsed?.strike || 0;
      const expiry = pos.expiration_date || parsed?.expiry || '';
      const optionType = parsed?.optionType ||
        (pos.symbol.toLowerCase().includes('put') ? 'put' :
         pos.symbol.toLowerCase().includes('call') ? 'call' :
         pos.option_type || pos.position_type);

      // Calculate days to expiry
      const expiryDate = expiry ? new Date(expiry) : new Date();
      const daysToExpiry = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      // Use stored Greeks or estimate them
      const hasGreeks = pos.delta !== null && pos.delta !== 0;
      const greeks = hasGreeks
        ? { delta: pos.delta, gamma: pos.gamma, theta: pos.theta, vega: pos.vega }
        : estimateGreeks(optionType as 'call' | 'put', strike, daysToExpiry, pos.entry_price);

      return {
        id: pos.id,
        symbol: pos.symbol,
        ticker,
        type: optionType as 'call' | 'put',
        strike,
        expiry,
        quantity: pos.quantity,
        avgPrice: pos.entry_price,
        currentPrice: pos.current_price || pos.entry_price,
        pnl: pos.unrealized_pl || ((pos.current_price || pos.entry_price) - pos.entry_price) * pos.quantity * 100,
        pnlPercent: pos.unrealized_pl_percent || (pos.entry_price > 0 ? (((pos.current_price || pos.entry_price) - pos.entry_price) / pos.entry_price) * 100 : 0),
        delta: greeks.delta || 0,
        theta: greeks.theta || 0,
        gamma: greeks.gamma || 0,
        vega: greeks.vega || 0,
        daysToExpiry,
        strategy: pos.strategy || undefined,
      };
    });

    // Detect strategies from position combinations
    const positionsWithStrategies = detectStrategies(transformedPositions);

    return NextResponse.json({ positions: positionsWithStrategies });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

// Detect multi-leg option strategies from positions
function detectStrategies(positions: TransformedPosition[]): TransformedPosition[] {
  if (positions.length < 2) {
    return positions;
  }

  // Group positions by ticker
  const byTicker: Record<string, TransformedPosition[]> = {};
  for (const pos of positions) {
    if (!byTicker[pos.ticker]) {
      byTicker[pos.ticker] = [];
    }
    byTicker[pos.ticker].push(pos);
  }

  const result: TransformedPosition[] = [];

  for (const ticker of Object.keys(byTicker)) {
    const tickerPositions = byTicker[ticker];

    if (tickerPositions.length === 1) {
      // Single position - no strategy
      result.push({ ...tickerPositions[0], strategy: 'Single Leg' });
      continue;
    }

    // Sort by strike for strategy detection
    tickerPositions.sort((a, b) => a.strike - b.strike);

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
