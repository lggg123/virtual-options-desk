/**
 * Next.js API Route: ML Feature Importance
 * Get feature importance from trained models
 */

import { NextResponse } from 'next/server';

// Remove trailing slash from ML_SERVICE_URL to avoid double slashes
const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:8002').replace(/\/$/, '');

export async function GET() {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/api/ml/feature-importance`);

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.detail || 'Failed to fetch feature importance' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Feature importance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature importance' },
      { status: 500 }
    );
  }
}
