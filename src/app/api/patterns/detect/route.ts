import { NextRequest, NextResponse } from 'next/server';

const PATTERN_SERVICE_URL = process.env.PATTERN_SERVICE_URL || 'http://localhost:8003';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${PATTERN_SERVICE_URL}/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Pattern detection failed: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Pattern detection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to detect patterns',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Use POST to detect patterns',
      endpoint: '/api/patterns/detect',
      requiredFields: ['symbol', 'timeframe', 'candles'],
      optionalFields: ['context']
    },
    { status: 200 }
  );
}
