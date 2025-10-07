import { NextResponse } from 'next/server';

const PATTERN_SERVICE_URL = process.env.PATTERN_SERVICE_URL || 'http://localhost:8003';

export async function GET() {
  try {
    const response = await fetch(`${PATTERN_SERVICE_URL}/patterns/types`);

    if (!response.ok) {
      throw new Error(`Failed to fetch pattern types: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching pattern types:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch pattern types',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
