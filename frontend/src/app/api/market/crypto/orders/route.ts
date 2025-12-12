import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CryptoOrderRequest {
  symbol: string;
  name: string;
  orderType: 'buy' | 'sell';
  quantity: number;
  price: number;
  image?: string;
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

    const body = await request.json() as CryptoOrderRequest;
    const { symbol, name, orderType, quantity, price, image } = body;

    // Validate required fields
    if (!symbol || !orderType || !quantity || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['buy', 'sell'].includes(orderType)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 });
    }

    // Calculate total cost (crypto is bought in fractional units)
    const totalCost = quantity * price;
    const fees = totalCost * 0.001; // 0.1% trading fee (simulated)
    const totalWithFees = totalCost + fees;

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

    // Check funds for buy orders
    if (orderType === 'buy' && portfolio.cash_balance < totalWithFees) {
      return NextResponse.json({
        error: `Insufficient funds. Required: $${totalWithFees.toFixed(2)} (including $${fees.toFixed(2)} fee), Available: $${portfolio.cash_balance.toFixed(2)}`
      }, { status: 400 });
    }

    // For demo mode, simulate the order
    if (isDemo) {
      const newBalance = orderType === 'buy'
        ? portfolio.cash_balance - totalWithFees
        : portfolio.cash_balance + (totalCost - fees);

      return NextResponse.json({
        success: true,
        order: {
          id: 'mock-order-' + Date.now(),
          user_id: userId,
          symbol: symbol.toUpperCase(),
          name,
          order_type: orderType,
          quantity,
          price,
          total_cost: totalCost,
          fees,
          total_with_fees: totalWithFees,
          status: 'filled',
          asset_class: 'crypto',
          image,
          created_at: new Date().toISOString()
        },
        newBalance,
        message: 'Crypto order simulated successfully (demo mode)',
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
        ? portfolio.cash_balance - totalWithFees
        : portfolio.cash_balance + (totalCost - fees);

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
          symbol: symbol.toUpperCase(),
          trade_type: orderType,
          position_type: 'stock', // Using 'stock' for crypto (spot trading)
          quantity,
          price,
          total_cost: totalWithFees,
          fees,
          notes: JSON.stringify({
            asset_class: 'crypto',
            name,
            image
          }),
          executed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (tradeError) {
        console.error('Trade creation error:', tradeError);
        throw new Error(`Failed to create trade record: ${tradeError.message}`);
      }

      // Create or update position for buy orders
      if (orderType === 'buy') {
        const { data: existingPosition } = await supabase
          .from('positions')
          .select('*')
          .eq('user_id', userId)
          .eq('symbol', symbol.toUpperCase())
          .eq('status', 'open')
          .single();

        if (existingPosition) {
          const newQuantity = existingPosition.quantity + quantity;
          const newCostBasis = existingPosition.cost_basis + totalWithFees;
          const newEntryPrice = newCostBasis / newQuantity;

          await supabase
            .from('positions')
            .update({
              quantity: newQuantity,
              cost_basis: newCostBasis,
              entry_price: newEntryPrice,
              current_price: price,
              market_value: newQuantity * price,
              notes: JSON.stringify({
                asset_class: 'crypto',
                name,
                image
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
              symbol: symbol.toUpperCase(),
              position_type: 'stock',
              quantity,
              entry_price: price,
              current_price: price,
              cost_basis: totalWithFees,
              market_value: totalCost,
              status: 'open',
              notes: JSON.stringify({
                asset_class: 'crypto',
                name,
                image
              })
            });
        }
      } else {
        // Handle sell - reduce or close position
        const { data: existingPosition } = await supabase
          .from('positions')
          .select('*')
          .eq('user_id', userId)
          .eq('symbol', symbol.toUpperCase())
          .eq('status', 'open')
          .single();

        if (existingPosition) {
          const newQuantity = existingPosition.quantity - quantity;

          if (newQuantity <= 0) {
            // Close position
            const realizedPL = (price - existingPosition.entry_price) * existingPosition.quantity - fees;

            await supabase
              .from('positions')
              .update({
                quantity: 0,
                current_price: price,
                market_value: 0,
                status: 'closed',
                unrealized_pl: 0,
                notes: JSON.stringify({
                  asset_class: 'crypto',
                  name,
                  image,
                  realized_pl: realizedPL
                }),
                closed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', existingPosition.id);
          } else {
            // Reduce position
            const costBasisReduction = (quantity / existingPosition.quantity) * existingPosition.cost_basis;

            await supabase
              .from('positions')
              .update({
                quantity: newQuantity,
                cost_basis: existingPosition.cost_basis - costBasisReduction,
                current_price: price,
                market_value: newQuantity * price,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingPosition.id);
          }
        }
      }

      return NextResponse.json({
        success: true,
        order: {
          ...trade,
          asset_class: 'crypto',
          name,
          image,
        },
        newBalance,
        message: 'Crypto order executed successfully',
      });

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return NextResponse.json({
        error: 'Database operation failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error processing crypto order:', error);
    return NextResponse.json({
      error: 'Failed to process crypto order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
