import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const PAYMENT_API_URL = (process.env.PAYMENT_API_URL || 'http://localhost:3001').replace(/\/$/, '');

// Payment checkout API route - handles Stripe checkout session creation
export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();
    
    console.log('=== Checkout API Route ===');
    console.log('Checkout request received for plan:', planId);
    console.log('Payment API URL:', PAYMENT_API_URL);
    
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    // Get authenticated user using SSR client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {
            // No-op in API routes - cookies are read-only
          },
          remove() {
            // No-op in API routes - cookies are read-only
          },
        },
      }
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth check result:', { 
      hasUser: !!user, 
      userId: user?.id,
      email: user?.email,
      error: authError?.message 
    });
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Auth session is missing. Please log in again.' },
        { status: 401 }
      );
    }
    
    console.log('✅ User authenticated:', user.id, user.email);
    
    // Call payment API to create checkout session
    const paymentApiUrl = `${PAYMENT_API_URL}/api/checkout/create`;
    console.log('Calling payment API:', paymentApiUrl);
    console.log('Request payload:', {
      planId,
      userId: user.id,
      successUrl: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    });
    
    const response = await fetch(paymentApiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        userId: user.id,
        successUrl: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      }),
    });

    console.log('Payment API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Payment API error:', response.status, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.error('❌ Parsed error data:', errorData);
      } catch {
        errorData = { error: errorText };
      }
      
      return NextResponse.json(
        { 
          error: errorData.error || 'Failed to create checkout session',
          details: errorData.details || errorText,
          hint: 'Check if Stripe price IDs are configured in payment API environment variables'
        },
        { status: response.status }
      );
    }    const data = await response.json();
    console.log('Checkout session created successfully');
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
