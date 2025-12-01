import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch recent trades for the user from the trades table
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
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

    // Transform trades to match frontend interface
    const transformedTrades = (trades || []).map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      option_type: trade.option_type,
      strike_price: trade.strike_price,
      expiry_date: trade.expiration_date,
      action: trade.trade_type,
      quantity: trade.quantity,
      premium: trade.price,
      created_at: trade.created_at,
      updated_at: trade.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: transformedTrades
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
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { symbol, type, action, strike, expiry, quantity, price } = body;

    // Validate required fields
    if (!symbol || !type || !action || !strike || !expiry || !quantity || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert trade (map to correct column names)
    const { data: trade, error: insertError } = await supabase
      .from('options_trades')
      .insert({
        user_id: user.id,
        symbol: symbol.toUpperCase(),
        option_type: type.toLowerCase() as 'call' | 'put',
        action: action.toLowerCase() as 'buy' | 'sell',
        strike_price: strike,
        expiry_date: expiry,
        quantity,
        premium: price
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
