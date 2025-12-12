import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CFDOrderRequest {
  symbol: string;
  name: string;
  orderType: 'buy' | 'sell';
  positionType: 'long' | 'short';
  quantity: number;
  price: number;
  leverage: number;
  pipValue: number;
  stopLoss?: number;
  takeProfit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    const userId = user?.id || 'demo-user-id';
    const isDemo = !user;

    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    const body = await request.json() as CFDOrderRequest;
    const {
      symbol,
      name,
      orderType,
      positionType,
      quantity,
      price,
      leverage,
      pipValue,
      stopLoss,
      takeProfit
    } = body;

    // Validate required fields
    if (!symbol || !orderType || !quantity || !price || !leverage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['buy', 'sell'].includes(orderType)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 });
    }

    // Calculate position value and margin
    const positionValue = price * quantity;
    const marginUsed = positionValue / leverage;

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
      portfolio = {
        id: 'mock-portfolio-id',
        user_id: userId,
        cash_balance: 2000000,
        total_value: 2000000,
      };
    }

    // Check margin for opening positions
    if (orderType === 'buy' && portfolio.cash_balance < marginUsed) {
      return NextResponse.json({
        error: `Insufficient margin. Required: $${marginUsed.toFixed(2)}, Available: $${portfolio.cash_balance.toFixed(2)}`
      }, { status: 400 });
    }

    // For demo mode, simulate the order
    if (isDemo) {
      const newBalance = orderType === 'buy'
        ? portfolio.cash_balance - marginUsed
        : portfolio.cash_balance + marginUsed;

      return NextResponse.json({
        success: true,
        order: {
          id: 'mock-order-' + Date.now(),
          user_id: userId,
          symbol,
          name,
          order_type: orderType,
          position_type: positionType,
          quantity,
          price,
          leverage,
          margin_used: marginUsed,
          position_value: positionValue,
          pip_value: pipValue,
          stop_loss: stopLoss,
          take_profit: takeProfit,
          status: 'filled',
          asset_class: 'cfd',
          created_at: new Date().toISOString()
        },
        newBalance,
        message: 'CFD order simulated successfully (demo mode)',
      });
    }

    // Real database operations
    try {
      const { data: userPortfolio } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!userPortfolio) {
        throw new Error('Failed to find portfolio');
      }

      const newBalance = orderType === 'buy'
        ? portfolio.cash_balance - marginUsed
        : portfolio.cash_balance + marginUsed;

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
          symbol: symbol,
          trade_type: orderType,
          position_type: 'spread', // Using as closest match for CFDs
          quantity,
          price,
          total_cost: marginUsed,
          notes: JSON.stringify({
            asset_class: 'cfd',
            leverage,
            position_type: positionType,
            stop_loss: stopLoss,
            take_profit: takeProfit,
            pip_value: pipValue
          }),
          executed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (tradeError) {
        console.error('Trade creation error:', tradeError);
        throw new Error(`Failed to create trade record: ${tradeError.message}`);
      }

      // Create or update position
      if (orderType === 'buy') {
        const { data: existingPosition } = await supabase
          .from('positions')
          .select('*')
          .eq('user_id', userId)
          .eq('symbol', symbol)
          .eq('status', 'open')
          .single();

        if (existingPosition) {
          const newQuantity = existingPosition.quantity + quantity;
          const newCostBasis = existingPosition.cost_basis + marginUsed;

          await supabase
            .from('positions')
            .update({
              quantity: newQuantity,
              cost_basis: newCostBasis,
              entry_price: (existingPosition.entry_price * existingPosition.quantity + price * quantity) / newQuantity,
              current_price: price,
              market_value: newQuantity * price,
              notes: JSON.stringify({
                asset_class: 'cfd',
                leverage,
                position_type: positionType,
                stop_loss: stopLoss,
                take_profit: takeProfit
              }),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPosition.id);
        } else {
          await supabase
            .from('positions')
            .insert({
              portfolio_id: userPortfolio.id,
              user_id: userId,
              symbol,
              position_type: 'spread',
              quantity,
              entry_price: price,
              current_price: price,
              cost_basis: marginUsed,
              market_value: positionValue,
              status: 'open',
              notes: JSON.stringify({
                asset_class: 'cfd',
                leverage,
                position_type: positionType,
                stop_loss: stopLoss,
                take_profit: takeProfit
              })
            });
        }
      }

      return NextResponse.json({
        success: true,
        order: {
          ...trade,
          asset_class: 'cfd',
          leverage,
          margin_used: marginUsed,
          position_value: positionValue,
        },
        newBalance,
        message: 'CFD order executed successfully',
      });

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return NextResponse.json({
        error: 'Database operation failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing CFD order:', error);
    return NextResponse.json({
      error: 'Failed to process CFD order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
