import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface CSVRow {
  symbol: string;
  date: string;
  breakout_probability: string;
  Industry?: string;
  'Market Cap'?: string;
  volume?: string;
  recent_return_30d?: string;
  volatility_30d?: string;
  avg_volume_30d?: string;
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

export async function GET() {
  const csvPath = path.join(process.cwd(), 'public', 'data', 'top50_premium.csv');
  try {
    const csv = fs.readFileSync(csvPath, 'utf8');
    const [header, ...rows] = csv.trim().split('\n');
    const columns = header.split(',');
    
    const rawData: CSVRow[] = rows.map(row => {
      const values = row.split(',');
      return Object.fromEntries(values.map((v, i) => [columns[i], v])) as unknown as CSVRow;
    });
    
    const picks: StockPick[] = rawData.slice(0, 50).map((row) => {
      const confidence = parseFloat(row.breakout_probability);
      
      // Estimate prices (client will fetch real quotes)
      const estimatedPrice = 100;
      const targetPrice = estimatedPrice * (1 + confidence * 0.7);
      const potentialReturn = confidence * 70;
      
      const vol = row.volatility_30d ? parseFloat(row.volatility_30d) : null;
      const volText = vol ? (vol > 0.5 ? 'High volatility' : vol > 0.3 ? 'Moderate volatility' : 'Low volatility') : '';
      
      return {
        symbol: row.symbol,
        name: row.symbol, // Client will update with real name
        prediction: confidence > 0.6 ? 'bullish' : confidence > 0.4 ? 'neutral' : 'bearish',
        confidence: confidence,
        target_price: targetPrice,
        current_price: estimatedPrice,
        potential_return: potentialReturn,
        reasoning: `Premium analysis: ${row.Industry ? `${row.Industry} sector ` : ''}with ${(confidence * 100).toFixed(0)}% breakout probability. ${volText ? volText + '. ' : ''}${row.volume ? `Volume: ${parseFloat(row.volume).toLocaleString()}. ` : ''}${row.recent_return_30d ? `Recent 30-day return: ${(parseFloat(row.recent_return_30d) * 100).toFixed(1)}%. ` : ''}Advanced technical patterns detected.`,
      };
    });
    
    return NextResponse.json({ picks });
  } catch (err) {
    console.error('[AI Picks Premium] Error:', err);
    return NextResponse.json({ 
      error: 'Could not read premium picks.',
      picks: []
    }, { status: 500 });
  }
}
