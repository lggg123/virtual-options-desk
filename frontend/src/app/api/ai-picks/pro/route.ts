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
      const targetPrice = currentPrice * (1 + confidence * 0.6);
      const potentialReturn = ((targetPrice - currentPrice) / currentPrice) * 100;
      
      return {
        name: quote.shortName || quote.longName || symbol,
        current_price: currentPrice,
        target_price: targetPrice,
        potential_return: potentialReturn,
      };
    }
  } catch (err) {
    console.warn(`[AI Picks Pro] Failed to enrich ${symbol}:`, err);
  }
  
  const estimatedPrice = 100;
  return {
    name: symbol,
    current_price: estimatedPrice,
    target_price: estimatedPrice * 1.2,
    potential_return: 20,
  };
}

export async function GET() {
  const csvPath = path.resolve(process.cwd(), 'data/top25_pro.csv');
  try {
    const csv = fs.readFileSync(csvPath, 'utf8');
    const [header, ...rows] = csv.trim().split('\n');
    const columns = header.split(',');
    
    const rawData: CSVRow[] = rows.map(row => {
      const values = row.split(',');
      return Object.fromEntries(values.map((v, i) => [columns[i], v])) as CSVRow;
    });
    
    const picks: StockPick[] = await Promise.all(
      rawData.slice(0, 25).map(async (row) => {
        const confidence = parseFloat(row.breakout_probability);
        const enriched = await enrichPickWithMarketData(row.symbol, confidence);
        
        return {
          symbol: row.symbol,
          name: enriched.name || row.symbol,
          prediction: confidence > 0.6 ? 'bullish' : confidence > 0.4 ? 'neutral' : 'bearish',
          confidence: confidence,
          target_price: enriched.target_price || 0,
          current_price: enriched.current_price || 0,
          potential_return: enriched.potential_return || 0,
          reasoning: `${row.Industry ? `${row.Industry} sector` : 'Stock'} showing ${(confidence * 100).toFixed(0)}% breakout probability. ${row.volume ? `Strong volume of ${parseFloat(row.volume).toLocaleString()}.` : ''} Technical analysis suggests continued momentum.`,
        };
      })
    );
    
    return NextResponse.json({ picks });
  } catch (err) {
    console.error('[AI Picks Pro] Error:', err);
    return NextResponse.json({ 
      error: 'Could not read pro picks.',
      picks: []
    }, { status: 500 });
  }
}
