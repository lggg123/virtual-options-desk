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
        .eq('symbol', symbol)
        .eq('status', 'open')
        .single();

      if (existingPosition) {
        // Update existing position
        const newQuantity = orderType === 'buy'
          ? existingPosition.quantity + quantity  // Buy adds to position
          : existingPosition.quantity - quantity; // Sell reduces position

        if (newQuantity === 0) {
          // Position is closed - set status to closed
          await supabase
            .from('positions')
            .update({
              status: 'closed',
              current_price: price,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPosition.id);
        } else if (newQuantity > 0) {
          // Still have a long position
          const avgEntryPrice = orderType === 'buy'
            ? ((existingPosition.entry_price * existingPosition.quantity) + (price * quantity)) / newQuantity
            : existingPosition.entry_price; // Keep same entry price when reducing

          const newCostBasis = orderType === 'buy'
            ? existingPosition.cost_basis + marginRequired
            : existingPosition.cost_basis - marginRequired;

          const priceDiff = price - avgEntryPrice;
          const unrealizedPL = priceDiff * newQuantity * contractSize;

          await supabase
            .from('positions')
            .update({
              quantity: newQuantity,
              cost_basis: Math.max(0, newCostBasis),
              entry_price: avgEntryPrice,
              current_price: price,
              market_value: 0,
              unrealized_pl: unrealizedPL,
              contract_size: contractSize,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPosition.id);
        } else {
          // newQuantity < 0 - we've flipped to a short position
          const avgEntryPrice = price; // New entry price for the flipped position
          const newCostBasis = Math.abs(newQuantity) * marginRequired;

          await supabase
            .from('positions')
            .update({
              quantity: Math.abs(newQuantity),
              cost_basis: newCostBasis,
              entry_price: avgEntryPrice,
              current_price: price,
              market_value: 0,
              unrealized_pl: 0, // Reset P&L for new position
              contract_size: contractSize,
              position_type: 'spread',
              updated_at: new Date().toISOString(),
              notes: JSON.stringify({
                asset_class: 'future',
                contract_size: contractSize,
                margin_requirement: marginRequirement,
                tick_value: tickValue,
                position_type: 'short', // Flipped to short
                notional_value: notionalValue
              })
            })
            .eq('id', existingPosition.id);
        }
      } else {
        // Create new position
        await supabase
          .from('positions')
          .insert({
            portfolio_id: userPortfolio.id,
            user_id: userId,
            symbol,
            position_type: 'spread', // Using 'spread' for futures (database constraint)
            quantity,
            entry_price: price,
            current_price: price,
            cost_basis: marginRequired,
            market_value: 0, // Futures P&L is calculated separately, not added to portfolio as market value
            unrealized_pl: 0, // Initial P&L is 0
            contract_size: contractSize,
            expiry: contract, // Store contract month in expiry field
            status: 'open',
            notes: JSON.stringify({
              asset_class: 'future',
              contract_size: contractSize,
              margin_requirement: marginRequirement,
              tick_value: tickValue,
              position_type: orderType === 'buy' ? 'long' : 'short',
              notional_value: notionalValue
            })
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
