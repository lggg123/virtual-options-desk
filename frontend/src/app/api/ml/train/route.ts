/**
 * Next.js API Route: ML Model Training
 * Triggers ML model training on the Python backend
 */

import { NextRequest, NextResponse } from 'next/server';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8002';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { forward_days = 30, cv_splits = 5, force_retrain = false } = body;

    // Call Python ML API
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        forward_days,
        cv_splits,
        force_retrain,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Training failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('ML training error:', error);
    return NextResponse.json(
      { error: 'Failed to start training. Is the ML service running?' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get training status
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/status`);

    if (!response.ok) {
      throw new Error('Failed to fetch status');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('ML status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training status' },
      { status: 500 }
    );
  }
}
