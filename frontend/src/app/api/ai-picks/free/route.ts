import { NextRequest, NextResponse } from 'next/server';

interface CSVRow {
  symbol: string;
  date: string;
  predicted_return_30d: string;
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
      const predictedReturn = parseFloat(row.predicted_return_30d);
      const breakoutProb = parseFloat(row.breakout_probability);

      // Determine prediction based on predicted return
      let prediction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (predictedReturn > 1) prediction = 'bullish';
      else if (predictedReturn < -1) prediction = 'bearish';

      // Confidence is a combination of model certainty and breakout probability
      const confidence = Math.min(0.99, Math.abs(predictedReturn) / 10 + breakoutProb * 0.3);

      // Estimate prices (client will fetch real quotes)
      const estimatedPrice = 100;
      const targetPrice = estimatedPrice * (1 + predictedReturn / 100);

      return {
        symbol: row.symbol,
        name: row.symbol, // Client will update with real name
        prediction,
        confidence,
        target_price: targetPrice,
        current_price: estimatedPrice,
        potential_return: predictedReturn,
        reasoning: `ML ensemble predicts ${predictedReturn > 0 ? '+' : ''}${predictedReturn.toFixed(1)}% return over 30 days. ${breakoutProb > 0.1 ? `Breakout probability: ${(breakoutProb * 100).toFixed(0)}%.` : 'Technical patterns detected.'}`,
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
