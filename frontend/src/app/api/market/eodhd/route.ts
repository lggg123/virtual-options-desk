import { NextRequest, NextResponse } from 'next/server';
import { fetchEODHDMarketDataServer } from '@/server/eodhd-server-fetch';

// Server-side API route to fetch EODHD market data securely
export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get('symbols');
  const symbols = symbolsParam ? symbolsParam.split(',') : ['AAPL', 'GOOG', 'GOOGL', 'MSFT', 'INTC'];

  try {
    // Only run server-side
    if (typeof window !== 'undefined') {
      return NextResponse.json({ success: false, error: 'Server-side only' }, { status: 400 });
    }
    const apiKey = process.env.EODHD_API_KEY;
    const marketData = await fetchEODHDMarketDataServer(symbols, apiKey);
    return NextResponse.json({ success: true, data: marketData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
