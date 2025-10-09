import { NextResponse } from 'next/server';

const PAYMENT_API_URL = (process.env.PAYMENT_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export async function GET() {
  try {
    console.log('Health check - Payment API URL:', PAYMENT_API_URL);
    
    // Try to reach the payment API
    const response = await fetch(`${PAYMENT_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: 'ok',
        paymentApi: 'reachable',
        paymentApiUrl: PAYMENT_API_URL,
        paymentApiResponse: data,
      });
    } else {
      return NextResponse.json({
        status: 'error',
        paymentApi: 'unreachable',
        paymentApiUrl: PAYMENT_API_URL,
        statusCode: response.status,
        error: await response.text(),
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      paymentApi: 'unreachable',
      paymentApiUrl: PAYMENT_API_URL,
      error: error instanceof Error ? error.message : String(error),
      hint: 'Make sure the payment API is running',
    }, { status: 503 });
  }
}
