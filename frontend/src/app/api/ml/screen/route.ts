/**
 * Next.js API Route: Monthly Stock Screening
 * Run ML-based screening on a universe of stocks
 */

import { NextRequest, NextResponse } from 'next/server';

// Remove trailing slash from ML_SERVICE_URL to avoid double slashes
const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:8002').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { universe, top_n = 1000 } = body;

    if (!universe || !Array.isArray(universe) || universe.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of stock symbols (universe)' },
        { status: 400 }
      );
    }

    console.log(`Running screening on ${universe.length} stocks, selecting top ${top_n}...`);

    // Call Python ML API
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/screen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        universe,
        top_n,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Screening failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      ...data,
      summary: {
        total_screened: universe.length,
        top_picks_count: data.top_picks?.length || 0,
        generated_at: data.generated_at,
      },
    });
  } catch (error) {
    console.error('ML screening error:', error);
    return NextResponse.json(
      { error: 'Failed to run screening. Is the ML service running?' },
      { status: 500 }
    );
  }
}
