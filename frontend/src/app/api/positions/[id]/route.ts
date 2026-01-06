import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

// Fetch current CFD price from internal API
async function fetchCFDPrice(symbol: string): Promise<{ bid: number; ask: number; mid: number }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/market/cfd?symbol=${symbol}`,
      { cache: 'no-store' }
    );

    if (response.ok) {
      const quote = await response.json();
      if (quote && quote.bid && quote.ask) {
        return {
          bid: quote.bid,
          ask: quote.ask,
          mid: quote.price || (quote.bid + quote.ask) / 2
        };
      }
    }
  } catch (e) {
    console.error('Failed to fetch CFD price for', symbol, e);
  }
  return { bid: 0, ask: 0, mid: 0 };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServer();
    const { id: positionId } = await params;

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, fetch the position to verify ownership and get current data
    const { data: position, error: fetchError } = await supabase
      .from('positions')
      .select('*')
      .eq('id', positionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !position) {
      return NextResponse.json(
        { error: 'Position not found or access denied' },
        { status: 404 }
      );
    }

    // Check if position is already closed
    if (position.status === 'closed') {
      return NextResponse.json(
        { error: 'Position is already closed' },
        { status: 400 }
      );
    }

    // Parse notes to determine asset class and position details
    let notes: Record<string, unknown> = {};
    let assetClass: 'option' | 'crypto' | 'cfd' | 'stock' = 'option';

    try {
      if (position.notes) {
        notes = typeof position.notes === 'string' ? JSON.parse(position.notes) : position.notes;
        assetClass = (notes.asset_class as 'option' | 'crypto' | 'cfd' | 'stock' | undefined) || 'option';
      }
    } catch (e) {
      console.error('Failed to parse position notes:', e);
    }

    // Calculate closing price and P&L based on asset class
    let closingPrice = position.current_price || position.entry_price;
    let realizedPL = 0;
    let currentValue = position.market_value || position.cost_basis;

    if (assetClass === 'cfd') {
      // Fetch live CFD price
      const cfdPrices = await fetchCFDPrice(position.symbol);
      const positionType = (notes.position_type as string | undefined) || 'long';
      const leverage = (notes.leverage as number | undefined) || 1;

      // Use bid for closing long positions, ask for closing short positions
      closingPrice = positionType === 'long' ? cfdPrices.bid : cfdPrices.ask;

      // If we couldn't fetch the price, use stored price
      if (closingPrice === 0) {
        closingPrice = position.current_price || position.entry_price;
      }

      // Calculate P&L for CFD (accounting for position type and leverage)
      const priceDiff = positionType === 'long'
        ? (closingPrice - position.entry_price)
        : (position.entry_price - closingPrice);

      realizedPL = priceDiff * position.quantity * leverage;
      currentValue = position.cost_basis + realizedPL; // Return margin + P&L
    } else {
      // For options and other assets, use existing logic
      realizedPL = position.unrealized_pl || 0;
      currentValue = position.market_value || position.cost_basis;
    }

    // Update the position status to 'closed'
    const { error: updateError } = await supabase
      .from('positions')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        unrealized_pl: 0, // Move unrealized to realized
        unrealized_pl_percent: 0,
      })
      .eq('id', positionId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating position:', updateError);
      return NextResponse.json(
        { error: 'Failed to close position', details: updateError.message },
        { status: 500 }
      );
    }

    // Create a closing trade record
    const fees = assetClass === 'cfd' ? 0 : position.quantity * 0.65; // No fees for CFDs, $0.65 per option contract
    const realizedPLPercent = position.entry_price > 0
      ? ((closingPrice - position.entry_price) / position.entry_price) * 100
      : 0;

    const { error: tradeError } = await supabase
      .from('trades')
      .insert({
        portfolio_id: position.portfolio_id,
        user_id: user.id,
        position_id: positionId,
        symbol: position.symbol,
        trade_type: 'sell', // Closing is always a sell
        position_type: position.position_type,
        strike_price: position.strike_price,
        expiration_date: position.expiration_date,
        option_type: position.option_type,
        quantity: position.quantity,
        price: closingPrice,
        total_cost: currentValue,
        fees: fees,
        realized_pl: realizedPL,
        realized_pl_percent: realizedPLPercent,
        strategy: position.strategy,
        notes: assetClass === 'cfd' ? `CFD position closed at ${closingPrice}` : 'Position closed from portfolio',
      });

    if (tradeError) {
      console.error('Error creating trade record:', tradeError);
      // Continue even if trade record fails - position is still closed
    }

    // Update portfolio cash balance with the proceeds
    const { data: portfolio, error: portfolioFetchError } = await supabase
      .from('portfolios')
      .select('cash_balance, unrealized_pl, realized_pl')
      .eq('id', position.portfolio_id)
      .single();

    if (!portfolioFetchError && portfolio) {
      const newCashBalance = (portfolio.cash_balance || 0) + currentValue;
      const newRealizedPL = (portfolio.realized_pl || 0) + realizedPL;
      const newUnrealizedPL = (portfolio.unrealized_pl || 0) - realizedPL;

      await supabase
        .from('portfolios')
        .update({
          cash_balance: newCashBalance,
          realized_pl: newRealizedPL,
          unrealized_pl: newUnrealizedPL,
        })
        .eq('id', position.portfolio_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Position closed successfully',
      realizedPL,
      closedPosition: {
        symbol: position.symbol,
        quantity: position.quantity,
        position_type: position.position_type,
      },
    });

  } catch (error) {
    console.error('Error closing position:', error);
    return NextResponse.json(
      {
        error: 'Failed to close position',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
