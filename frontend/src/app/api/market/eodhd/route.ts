import { NextRequest, NextResponse } from 'next/server';
// Direct server-side fetch to EODHD API

// Server-side API route to fetch EODHD market data securely
export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get('symbols');
  const exchangeParam = request.nextUrl.searchParams.get('exchange') || 'US';
  // Normalize and validate symbols: trim, uppercase, filter empty
  const symbols = symbolsParam
    ? symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    : ['AAPL', 'GOOG', 'GOOGL', 'MSFT', 'INTC'];

  try {
    const apiKey = process.env.EODHD_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'EODHD_API_KEY not set' }, { status: 500 });
    }
    const baseUrl = 'https://eodhd.com/api/real-time/';
    const fetchPromises = symbols.map(async origSymbol => {
      // If symbol already contains a dot, assume it's fully qualified
      let symbol = origSymbol;
      if (!symbol.includes('.')) {
        // Only append exchange if not present and exchangeParam is set
        if (exchangeParam) {
          symbol = `${symbol}.${exchangeParam}`;
        }
      }
      // Validate symbol: must be [A-Z0-9.]+
      if (!/^[A-Z0-9.]+$/.test(symbol)) {
        console.error(`[EODHD] Invalid symbol: ${symbol}`);
        return null;
      }
      const url = `${baseUrl}${symbol}?fmt=json`;
      try {
        const res = await fetch(url, {
          headers: {
            'X-API-Token': apiKey,
            'Accept': 'application/json',
          },
        });
        if (!res.ok) {
          throw new Error(`Fetch failed for ${symbol}: status ${res.status}`);
        }
        const data = await res.json();
        if (data && typeof data.close === 'number') {
          return {
            symbol,
            timestamp: data.timestamp ? new Date(data.timestamp * 1000).toISOString() : undefined,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume ?? 0,
          };
        } else {
          throw new Error(`No close price for ${symbol}`);
        }
      } catch (err) {
        let msg: string;
        if (err instanceof Error) {
          msg = err.message;
        } else if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
          msg = (err as any).message;
        } else {
          msg = String(err);
        }
        console.error(`[EODHD] Error for symbol: ${symbol}:`, msg);
        return null;
      }
    });
    const results = await Promise.all(fetchPromises);
    const marketData = results.filter(Boolean);
    if (marketData.length === 0) {
      return NextResponse.json({ success: false, message: 'No market data retrieved' }, { status: 404 });
    }
    // Optionally, could check for partial success here
    return NextResponse.json({ success: true, data: marketData });
  } catch (error) {
    let msg: string;
    if (error instanceof Error) {
      msg = error.message;
    } else if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
      msg = (error as any).message;
    } else {
      msg = String(error);
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
