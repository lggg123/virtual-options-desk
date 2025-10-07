import { NextRequest, NextResponse } from 'next/server';

const PATTERN_SERVICE_URL = process.env.PATTERN_SERVICE_URL || 'http://localhost:8003';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${PATTERN_SERVICE_URL}/detect/realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Realtime detection failed: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Realtime detection error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to detect realtime pattern',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
