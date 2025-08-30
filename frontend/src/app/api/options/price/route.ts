// app/api/options/price/route.ts
import { NextResponse } from 'next/server';
import { calculateBlackScholes } from '@/lib/calculations/black-scholes';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate inputs
    const requiredFields = ['spotPrice', 'strikePrice', 'timeToExpiry', 'riskFreeRate', 'volatility', 'optionType'];
    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    const pricing = calculateBlackScholes(body);
    
    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Error calculating option price:', error);
    return NextResponse.json(
      { error: 'Failed to calculate option price' },
      { status: 500 }
    );
  }
}