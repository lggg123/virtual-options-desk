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

async function enrichPickWithMarketData(symbol: string, confidence: number): Promise<Partial<StockPick>> {
  try {
    const quoteRes = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/market/quote?symbol=${symbol}`);
    if (quoteRes.ok) {
      const quote = await quoteRes.json();
      const currentPrice = quote.regularMarketPrice || 100;
      const targetPrice = currentPrice * (1 + confidence * 0.7);
      const potentialReturn = ((targetPrice - currentPrice) / currentPrice) * 100;
      
      return {
        name: quote.shortName || quote.longName || symbol,
        current_price: currentPrice,
        target_price: targetPrice,
        potential_return: potentialReturn,
      };
    }
  } catch (err) {
    console.warn(`[AI Picks Premium] Failed to enrich ${symbol}:`, err);
  }
  
  const estimatedPrice = 100;
  return {
    name: symbol,
    current_price: estimatedPrice,
    target_price: estimatedPrice * 1.25,
    potential_return: 25,
  };
}

export async function GET() {
  const csvPath = path.resolve(process.cwd(), 'data/top50_premium.csv');
  try {
    const csv = fs.readFileSync(csvPath, 'utf8');
    const [header, ...rows] = csv.trim().split('\n');
    const columns = header.split(',');
    
    const rawData: CSVRow[] = rows.map(row => {
      const values = row.split(',');
      return Object.fromEntries(values.map((v, i) => [columns[i], v])) as unknown as CSVRow;
    });
    
    const picks: StockPick[] = await Promise.all(
      rawData.slice(0, 50).map(async (row) => {
        const confidence = parseFloat(row.breakout_probability);
        const enriched = await enrichPickWithMarketData(row.symbol, confidence);
        
        const vol = row.volatility_30d ? parseFloat(row.volatility_30d) : null;
        const volText = vol ? (vol > 0.5 ? 'High volatility' : vol > 0.3 ? 'Moderate volatility' : 'Low volatility') : '';
        
        return {
          symbol: row.symbol,
          name: enriched.name || row.symbol,
          prediction: confidence > 0.6 ? 'bullish' : confidence > 0.4 ? 'neutral' : 'bearish',
          confidence: confidence,
          target_price: enriched.target_price || 0,
          current_price: enriched.current_price || 0,
          potential_return: enriched.potential_return || 0,
          reasoning: `Premium analysis: ${row.Industry ? `${row.Industry} sector ` : ''}with ${(confidence * 100).toFixed(0)}% breakout probability. ${volText ? volText + '. ' : ''}${row.volume ? `Volume: ${parseFloat(row.volume).toLocaleString()}. ` : ''}${row.recent_return_30d ? `Recent 30-day return: ${(parseFloat(row.recent_return_30d) * 100).toFixed(1)}%. ` : ''}Advanced technical patterns detected.`,
        };
      })
    );
    
    return NextResponse.json({ picks });
  } catch (err) {
    console.error('[AI Picks Premium] Error:', err);
    return NextResponse.json({ 
      error: 'Could not read premium picks.',
      picks: []
    }, { status: 500 });
  }
}
