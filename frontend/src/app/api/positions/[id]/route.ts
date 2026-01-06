import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer();
    const positionId = params.id;

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

    // Calculate realized P&L based on current price
    const realizedPL = position.unrealized_pl || 0;
    const currentValue = position.market_value || position.cost_basis;

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
        price: position.current_price || position.entry_price,
        total_cost: currentValue,
        fees: position.quantity * 0.65, // $0.65 per contract
        realized_pl: realizedPL,
        realized_pl_percent: position.unrealized_pl_percent || 0,
        strategy: position.strategy,
        notes: 'Position closed from portfolio',
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
