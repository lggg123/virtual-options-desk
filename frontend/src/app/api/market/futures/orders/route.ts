import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FuturesOrderRequest {
  symbol: string;
  contract: string;
  orderType: 'buy' | 'sell';
  quantity: number;
  price: number;
  contractSize: number;
  marginRequirement: number;
  tickValue: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // For development, allow mock user
    const userId = user?.id || 'demo-user-id';
    const isDemo = !user;

    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    const body = await request.json() as FuturesOrderRequest;
    const { symbol, contract, orderType, quantity, price, contractSize, marginRequirement, tickValue } = body;

    // Validate required fields
    if (!symbol || !orderType || !quantity || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['buy', 'sell'].includes(orderType)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 });
    }

    // Calculate notional value and margin required
    const notionalValue = price * contractSize * quantity;
    const marginRequired = notionalValue * (marginRequirement / 100);

    // Get or create portfolio
    let portfolio;
    if (user) {
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (portfolioError && portfolioError.code !== 'PGRST116') {
        console.error('Portfolio error:', portfolioError);
        return NextResponse.json({ error: 'Portfolio lookup failed' }, { status: 500 });
      }

      if (!portfolioData) {
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert({
            user_id: userId,
            cash_balance: 2000000,
            total_value: 2000000,
          })
          .select()
          .single();

        if (createError) {
          console.error('Portfolio creation error:', createError);
          return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 });
        }

        portfolio = newPortfolio;
      } else {
        portfolio = portfolioData;
      }
    } else {
      // Mock portfolio for demo
      portfolio = {
        id: 'mock-portfolio-id',
        user_id: userId,
        cash_balance: 2000000,
        total_value: 2000000,
      };
    }

    // Check margin requirement for buy orders
    if (orderType === 'buy' && portfolio.cash_balance < marginRequired) {
      return NextResponse.json({
        error: `Insufficient margin. Required: $${marginRequired.toFixed(2)}, Available: $${portfolio.cash_balance.toFixed(2)}`
      }, { status: 400 });
    }

    // For demo mode, simulate the order
    if (isDemo) {
      const newBalance = orderType === 'buy'
        ? portfolio.cash_balance - marginRequired
        : portfolio.cash_balance + marginRequired;

      return NextResponse.json({
        success: true,
        order: {
          id: 'mock-order-' + Date.now(),
          user_id: userId,
          symbol,
          contract,
          order_type: orderType,
          quantity,
          price,
          notional_value: notionalValue,
          margin_required: marginRequired,
          contract_size: contractSize,
          tick_value: tickValue,
          status: 'filled',
          asset_class: 'futures',
          created_at: new Date().toISOString()
        },
        newBalance,
        message: 'Futures order simulated successfully (demo mode)',
      });
    }

    // Real database operations for authenticated users
    try {
      const { data: userPortfolio } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!userPortfolio) {
        throw new Error('Failed to find portfolio');
      }

      // Update portfolio balance (deduct margin for buy)
      const newBalance = orderType === 'buy'
        ? portfolio.cash_balance - marginRequired
        : portfolio.cash_balance + marginRequired;

      await supabase
        .from('portfolios')
        .update({
          cash_balance: newBalance,
          total_value: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Create trade record
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .insert({
          portfolio_id: userPortfolio.id,
          user_id: userId,
          symbol: `${symbol}-${contract}`,
          trade_type: orderType,
          position_type: 'spread', // Using 'spread' as closest match for futures
          quantity,
          price,
          total_cost: marginRequired,
          executed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (tradeError) {
        console.error('Trade creation error:', tradeError);
        throw new Error(`Failed to create trade record: ${tradeError.message}`);
      }

      // Create or update position
      const { data: existingPosition } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('symbol', `${symbol}-${contract}`)
        .eq('status', 'open')
        .single();

      if (existingPosition && orderType === 'buy') {
        // Add to existing position
        const newQuantity = existingPosition.quantity + quantity;
        const newCostBasis = existingPosition.cost_basis + marginRequired;

        await supabase
          .from('positions')
          .update({
            quantity: newQuantity,
            cost_basis: newCostBasis,
            entry_price: newCostBasis / newQuantity,
            current_price: price,
            market_value: newQuantity * price * contractSize,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPosition.id);
      } else if (orderType === 'buy') {
        // Create new position
        await supabase
          .from('positions')
          .insert({
            portfolio_id: userPortfolio.id,
            user_id: userId,
            symbol: `${symbol}-${contract}`,
            position_type: 'spread', // Using as closest match for futures
            quantity,
            entry_price: price,
            current_price: price,
            cost_basis: marginRequired,
            market_value: notionalValue,
            status: 'open'
          });
      }

      return NextResponse.json({
        success: true,
        order: {
          ...trade,
          asset_class: 'futures',
          notional_value: notionalValue,
          margin_required: marginRequired,
        },
        newBalance,
        message: 'Futures order executed successfully',
      });

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return NextResponse.json({
        error: 'Database operation failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing futures order:', error);
    return NextResponse.json({
      error: 'Failed to process futures order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
