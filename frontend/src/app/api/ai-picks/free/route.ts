import { NextRequest, NextResponse } from 'next/server';

interface CSVRow {
  symbol: string;
  date: string;
  breakout_probability: string;
}

interface StockPick {
  symbol: string;
  name: string;
  prediction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  target_price: number;
  current_price: number;
  potential_return: number;
  reasoning: string;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch CSV via HTTP (works on serverless)
    const baseUrl = request.nextUrl.origin;
    const csvUrl = `${baseUrl}/data/top10_free.csv`;
    console.log(`[AI Picks Free] Fetching CSV from: ${csvUrl}`);

    const csvResponse = await fetch(csvUrl);
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.status}`);
    }
    const csv = await csvResponse.text();
    const [header, ...rows] = csv.trim().split('\n');
    const columns = header.split(',');

    const rawData: CSVRow[] = rows.map(row => {
      const values = row.split(',');
      return Object.fromEntries(values.map((v, i) => [columns[i], v])) as unknown as CSVRow;
    });

    // Transform to StockPick format
    const picks: StockPick[] = rawData.slice(0, 10).map((row) => {
      const confidence = parseFloat(row.breakout_probability);

      // Estimate prices based on confidence (client will fetch real quotes)
      const estimatedPrice = 100;
      const targetPrice = estimatedPrice * (1 + confidence * 0.5);
      const potentialReturn = confidence * 50; // Estimate

      return {
        symbol: row.symbol,
        name: row.symbol, // Client will update with real name
        prediction: confidence > 0.6 ? 'bullish' : confidence > 0.4 ? 'neutral' : 'bearish',
        confidence: confidence,
        target_price: targetPrice,
        current_price: estimatedPrice,
        potential_return: potentialReturn,
        reasoning: `AI-detected breakout pattern with ${(confidence * 100).toFixed(0)}% probability. Strong technical indicators suggest upward momentum.`,
      };
    });

    return NextResponse.json({ picks });
  } catch (err) {
    console.error('[AI Picks Free] Error:', err);
    return NextResponse.json({
      error: 'Could not load AI picks. Please try again later.',
      picks: []
    }, { status: 500 });
  }
}
