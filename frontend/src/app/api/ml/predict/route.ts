/**
 * Next.js API Route: ML Predictions
 * Get stock predictions from trained ML models
 */

import { NextRequest, NextResponse } from 'next/server';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8002';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, top_n = 100 } = body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of stock symbols' },
        { status: 400 }
      );
    }

    // Call Python ML API
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbols,
        top_n,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Prediction failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('ML prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions. Is the ML service running?' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols')?.split(',') || [];
    const top_n = parseInt(searchParams.get('top_n') || '100');

    if (symbols.length === 0) {
      return NextResponse.json(
        { error: 'Please provide stock symbols as query parameter' },
        { status: 400 }
      );
    }

    // Call Python ML API
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbols,
        top_n,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Prediction failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('ML prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}
