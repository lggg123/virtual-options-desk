import { NextRequest, NextResponse } from 'next/server';
import { SimpleBlogAgent } from '@/lib/blog/simple-blog-agent';

// Server-side API route to fetch EODHD market data securely
export async function GET(request: NextRequest) {
  const symbolsParam = request.nextUrl.searchParams.get('symbols');
  const symbols = symbolsParam ? symbolsParam.split(',') : ['AAPL', 'GOOG', 'GOOGL', 'MSFT', 'INTC'];

  try {
    const agent = new SimpleBlogAgent();
    const marketData = await agent.fetchEODHDMarketData(symbols);
    return NextResponse.json({ success: true, data: marketData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
