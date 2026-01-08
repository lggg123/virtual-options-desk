import { NextRequest, NextResponse } from 'next/server';
// Direct server-side fetch to EODHD API

// Server-side API route to fetch EODHD market data securely
export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get('symbols');
  const symbols = symbolsParam ? symbolsParam.split(',') : ['AAPL', 'GOOG', 'GOOGL', 'MSFT', 'INTC'];

  try {
    const apiKey = process.env.EODHD_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'EODHD_API_KEY not set' }, { status: 500 });
    }
    const baseUrl = 'https://eodhd.com/api/real-time/';
    const fetchPromises = symbols.map(async symbol => {
      const url = `${baseUrl}${symbol}.US?fmt=json`;
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
            timestamp: new Date().toISOString(),
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume || 1000,
          };
        } else {
          throw new Error(`No close price for ${symbol}`);
        }
      } catch (err) {
        // Redact sensitive info in logs
        const msg = typeof err === 'object' && err !== null && 'message' in err ? (err as any).message : String(err);
        console.error(`[EODHD] Error for symbol: ${symbol}:`, msg);
        return null;
      }
    });
    const results = await Promise.all(fetchPromises);
    const marketData = results.filter(Boolean);
    return NextResponse.json({ success: true, data: marketData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
