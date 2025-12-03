import { NextRequest, NextResponse } from 'next/server';

interface CSVRow {
  symbol: string;
  date: string;
  predicted_return_30d: string;
  breakout_probability: string;
  Industry?: string;
  'Market Cap'?: string;
  volume?: string;
  volatility_20d?: string;
  rsi_14?: string;
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
    const csvUrl = `${baseUrl}/data/top25_pro.csv`;
    console.log(`[AI Picks Pro] Fetching CSV from: ${csvUrl}`);

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

    const picks: StockPick[] = rawData.slice(0, 25).map((row) => {
      const predictedReturn = parseFloat(row.predicted_return_30d);
      const breakoutProb = parseFloat(row.breakout_probability);
      const volatility = row.volatility_20d ? parseFloat(row.volatility_20d) : null;
      const rsi = row.rsi_14 ? parseFloat(row.rsi_14) : null;
      const volume = row.volume ? parseFloat(row.volume) : null;

      // Determine prediction based on predicted return
      let prediction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (predictedReturn > 1) prediction = 'bullish';
      else if (predictedReturn < -1) prediction = 'bearish';

      // Confidence is a combination of model certainty and breakout probability
      const confidence = Math.min(0.99, Math.abs(predictedReturn) / 10 + breakoutProb * 0.3);

      // Estimate prices (client will fetch real quotes)
      const estimatedPrice = 100;
      const targetPrice = estimatedPrice * (1 + predictedReturn / 100);

      // Build detailed reasoning
      const reasoningParts: string[] = [];
      if (row.Industry) reasoningParts.push(`${row.Industry} sector.`);
      reasoningParts.push(`ML predicts ${predictedReturn > 0 ? '+' : ''}${predictedReturn.toFixed(1)}% return.`);
      if (breakoutProb > 0.05) reasoningParts.push(`Breakout prob: ${(breakoutProb * 100).toFixed(0)}%.`);
      if (rsi !== null) {
        if (rsi < 30) reasoningParts.push('RSI indicates oversold.');
        else if (rsi > 70) reasoningParts.push('RSI indicates overbought.');
      }
      if (volatility !== null) {
        if (volatility > 1) reasoningParts.push('High volatility.');
        else if (volatility < 0.3) reasoningParts.push('Low volatility.');
      }
      if (volume && volume > 1000000) reasoningParts.push(`Volume: ${volume.toLocaleString()}.`);

      return {
        symbol: row.symbol,
        name: row.symbol, // Client will update with real name
        prediction,
        confidence,
        target_price: targetPrice,
        current_price: estimatedPrice,
        potential_return: predictedReturn,
        reasoning: reasoningParts.join(' '),
      };
    });

    return NextResponse.json({ picks });
  } catch (err) {
    console.error('[AI Picks Pro] Error:', err);
    return NextResponse.json({
      error: 'Could not read pro picks.',
      picks: []
    }, { status: 500 });
  }
}
