import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
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

// Helper to find CSV file in multiple possible locations
async function findCSVFile(filename: string): Promise<string> {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'data', filename),
    path.join(process.cwd(), 'frontend', 'public', 'data', filename),
    path.join(process.cwd(), '.next', 'standalone', 'public', 'data', filename),
    path.join(process.cwd(), 'standalone', 'public', 'data', filename),
    path.resolve(__dirname, '..', '..', '..', '..', '..', 'public', 'data', filename),
  ];

  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      console.log(`[AI Picks Free] Found CSV at: ${p}`);
      return p;
    } catch {
      // Path not accessible, try next
    }
  }

  console.error(`[AI Picks Free] Could not find ${filename} in any of:`, possiblePaths);
  throw new Error(`CSV file not found: ${filename}`);
}

export async function GET() {
  try {
    // Read CSV from file system with multiple path fallbacks
    const csvPath = await findCSVFile('top10_free.csv');
    const csv = await fs.readFile(csvPath, 'utf-8');
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
