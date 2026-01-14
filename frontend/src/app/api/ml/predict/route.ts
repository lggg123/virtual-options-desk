/**
 * Next.js API Route: ML Predictions
 * Get stock predictions from trained ML models
 */

import { NextRequest, NextResponse } from 'next/server';

// Remove trailing slash from ML_SERVICE_URL to avoid double slashes
const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:8002').replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, top_n = 100 } = body;

    console.log('[ML Predict API] Request received:', { symbols: symbols?.length, top_n });
    console.log('[ML Predict API] ML_SERVICE_URL:', ML_SERVICE_URL);

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      console.error('[ML Predict API] Invalid symbols:', symbols);
      return NextResponse.json(
        { error: 'Please provide an array of stock symbols' },
        { status: 400 }
      );
    }

    // Call Python ML API
    console.log('[ML Predict API] Calling ML service...');
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

    console.log('[ML Predict API] ML service response status:', response.status);

    if (!response.ok) {
      let errorMessage = 'Prediction failed';
      let responseText = '';
      
      try {
        responseText = await response.text();
        const error = JSON.parse(responseText);
        errorMessage = error.detail || errorMessage;
        console.error('[ML Predict API] ML service error:', error);
      } catch (e) {
        // Response was not JSON (might be HTML or plain text)
        console.error('[ML Predict API] ML service response (non-JSON):', responseText.substring(0, 200));
        errorMessage = 'ML service returned an error. The models may need to be retrained.';
      }
      
      return NextResponse.json(
        { error: errorMessage, ml_service_url: ML_SERVICE_URL },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[ML Predict API] Success, predictions:', data.predictions?.length || 0);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[ML Predict API] Exception:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate predictions. Check server logs for details.',
        details: error instanceof Error ? error.message : String(error)
      },
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
