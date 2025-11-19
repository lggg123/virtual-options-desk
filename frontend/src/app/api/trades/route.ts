import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch recent trades for the user
    const { data: trades, error: tradesError } = await supabase
      .from('user_trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (tradesError) {
      console.error('Error fetching trades:', tradesError);
      
      // Return empty array if table doesn't exist or no trades
      if (tradesError.code === 'PGRST116' || tradesError.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'No trades found'
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch trades' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: trades || []
    });
  } catch (error) {
    console.error('Unexpected error in trades API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { symbol, type, action, strike, expiry, quantity, price, total_cost, fees } = body;

    // Validate required fields
    if (!symbol || !type || !action || !strike || !expiry || !quantity || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert trade
    const { data: trade, error: insertError } = await supabase
      .from('user_trades')
      .insert({
        user_id: user.id,
        symbol,
        type,
        action,
        strike,
        expiry,
        quantity,
        price,
        total_cost: total_cost || price * quantity * 100,
        fees: fees || 0,
        status: 'filled'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating trade:', insertError);
      return NextResponse.json(
        { error: 'Failed to create trade' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: trade,
      message: 'Trade recorded successfully'
    });
  } catch (error) {
    console.error('Unexpected error in trades POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
