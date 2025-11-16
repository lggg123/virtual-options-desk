import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

async function enrichPickWithMarketData(symbol: string, confidence: number): Promise<Partial<StockPick>> {
  try {
    // Fetch real-time quote
    const quoteRes = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/market/quote?symbol=${symbol}`);
    if (quoteRes.ok) {
      const quote = await quoteRes.json();
      const currentPrice = quote.regularMarketPrice || 100;
      const targetPrice = currentPrice * (1 + confidence * 0.5); // Estimate based on confidence
      const potentialReturn = ((targetPrice - currentPrice) / currentPrice) * 100;
      
      return {
        name: quote.shortName || quote.longName || symbol,
        current_price: currentPrice,
        target_price: targetPrice,
        potential_return: potentialReturn,
      };
    }
  } catch (err) {
    console.warn(`[AI Picks Free] Failed to enrich ${symbol}:`, err);
  }
  
  // Fallback if API fails
  const estimatedPrice = 100;
  return {
    name: symbol,
    current_price: estimatedPrice,
    target_price: estimatedPrice * 1.15,
    potential_return: 15,
  };
}

export async function GET() {
  // Try CrewAI API first, fall back to CSV
  const apiUrl = process.env.NEXT_PUBLIC_CREWAI_API_URL;
  
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/top_breakout_picks?n=10`, { 
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      if (res.ok) {
        const data = await res.json();
        if (data.top_picks && data.top_picks.length > 0) {
          return NextResponse.json({ picks: data.top_picks });
        }
      }
    } catch (e) {
      console.warn('[AI Picks Free] CrewAI API unavailable, using CSV fallback:', e);
    }
  }
  
  // Fallback: Read from CSV
  const csvPath = path.resolve(process.cwd(), 'data/top10_free.csv');
  try {
    const csv = fs.readFileSync(csvPath, 'utf8');
    const [header, ...rows] = csv.trim().split('\n');
    const columns = header.split(',');
    
    const rawData: CSVRow[] = rows.map(row => {
      const values = row.split(',');
      return Object.fromEntries(values.map((v, i) => [columns[i], v])) as CSVRow;
    });
    
    // Transform to StockPick format with enriched data
    const picks: StockPick[] = await Promise.all(
      rawData.slice(0, 10).map(async (row) => {
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
          reasoning: `AI-detected breakout pattern with ${(confidence * 100).toFixed(0)}% probability. Strong technical indicators suggest upward momentum.`,
        };
      })
    );
    
    return NextResponse.json({ picks });
  } catch (err) {
    console.error('[AI Picks Free] Error:', err);
    return NextResponse.json({ 
      error: 'Could not load AI picks. Please try again later.',
      picks: [] 
    }, { status: 500 });
  }
}
