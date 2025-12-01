// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

// Type definitions for better type safety
type OrderType = 'buy' | 'sell';

interface OrderRequest {
  optionId: string;
  orderType: OrderType;
  quantity: number;
  price: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // Get authenticated user - REQUIRED
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json() as OrderRequest;
    const { optionId, orderType, quantity, price } = body;

    // Validate required fields
    if (!optionId || !orderType || !quantity || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate orderType
    if (!['buy', 'sell'].includes(orderType)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 });
    }

    // Get or create user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 });
    }

    // Create profile if it doesn't exist
    if (!profile) {
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.email?.split('@')[0] || 'User',
          updated_at: new Date().toISOString()
        });

      if (createProfileError) {
        console.error('Profile creation error:', createProfileError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }
    }

    // Get or create portfolio
    let { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (portfolioError && portfolioError.code !== 'PGRST116') {
      console.error('Portfolio error:', portfolioError);
      return NextResponse.json({ error: 'Portfolio lookup failed' }, { status: 500 });
    }

    // Create portfolio if it doesn't exist
    if (!portfolio) {
      const { data: newPortfolio, error: createError } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          name: 'Main Portfolio',
          cash_balance: 2000000, // $2,000,000 starting balance
          total_value: 2000000,
          unrealized_pl: 0,
          realized_pl: 0,
          is_default: true
        })
        .select()
        .single();

      if (createError || !newPortfolio) {
        console.error('Portfolio creation error:', createError);
        return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 });
      }

      portfolio = newPortfolio;
    }

    // Calculate total cost (options are quoted per share, 100 shares per contract)
    const totalCost = quantity * price * 100;

    // Check if user has sufficient funds for buy orders
    if (orderType === 'buy' && portfolio.cash_balance < totalCost) {
      return NextResponse.json({
        error: `Insufficient funds. Required: $${totalCost.toFixed(2)}, Available: $${portfolio.cash_balance.toFixed(2)}`
      }, { status: 400 });
    }

    // Parse optionId to extract option details (format: SYMBOL_STRIKE_EXPIRY_TYPE)
    // Example: AAPL_150_2024-01-19_call
    const optionParts = optionId.split('_');
    const symbol = optionParts[0] || 'UNKNOWN';
    const strikePrice = parseFloat(optionParts[1]) || 0;
    const expirationDate = optionParts[2] || null;
    const optionType = optionParts[3] as 'call' | 'put' || 'call';

    // Update portfolio balance
    const newBalance = orderType === 'buy'
      ? portfolio.cash_balance - totalCost
      : portfolio.cash_balance + totalCost;

    const { error: portfolioUpdateError } = await supabase
      .from('portfolios')
      .update({
        cash_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (portfolioUpdateError) {
      console.error('Portfolio update error:', portfolioUpdateError);
      return NextResponse.json({ error: 'Failed to update portfolio balance' }, { status: 500 });
    }

    // Handle positions for buy orders
    if (orderType === 'buy') {
      const { data: existingPosition, error: positionError } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', symbol)
        .eq('strike_price', strikePrice)
        .eq('option_type', optionType)
        .eq('status', 'open')
        .single();

      if (positionError && positionError.code !== 'PGRST116') {
        console.error('Position lookup error:', positionError);
        return NextResponse.json({ error: 'Failed to lookup position' }, { status: 500 });
      }

      if (existingPosition) {
        // Update existing position
        const newQuantity = existingPosition.quantity + quantity;
        const newCostBasis = existingPosition.cost_basis + totalCost;
        const newEntryPrice = newCostBasis / (newQuantity * 100);

        const { error: updatePositionError } = await supabase
          .from('positions')
          .update({
            quantity: newQuantity,
            cost_basis: newCostBasis,
            entry_price: newEntryPrice,
            current_price: price,
            market_value: newQuantity * price * 100,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPosition.id);

        if (updatePositionError) {
          console.error('Position update error:', updatePositionError);
          return NextResponse.json({ error: 'Failed to update position' }, { status: 500 });
        }
      } else {
        // Create new position
        const { error: createPositionError } = await supabase
          .from('positions')
          .insert({
            portfolio_id: portfolio.id,
            user_id: user.id,
            symbol,
            position_type: optionType,
            strike_price: strikePrice,
            expiration_date: expirationDate,
            option_type: optionType,
            quantity,
            entry_price: price,
            current_price: price,
            cost_basis: totalCost,
            market_value: totalCost,
            status: 'open'
          });

        if (createPositionError) {
          console.error('Position creation error:', createPositionError);
          return NextResponse.json({ error: 'Failed to create position' }, { status: 500 });
        }
      }
    }

    // Create trade record in the trades table
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        portfolio_id: portfolio.id,
        user_id: user.id,
        symbol,
        trade_type: orderType,
        position_type: optionType,
        strike_price: strikePrice,
        expiration_date: expirationDate,
        option_type: optionType,
        quantity,
        price,
        total_cost: totalCost,
        executed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (tradeError) {
      console.error('Trade creation error:', tradeError);
      return NextResponse.json({ error: 'Failed to create trade record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      order: trade,
      newBalance,
      message: 'Order processed successfully'
    });

  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json({
      error: 'Failed to process order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add other HTTP methods if needed
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
