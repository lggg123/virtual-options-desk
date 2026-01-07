import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Use server-side Supabase client that reads from cookies
    const supabase = await createSupabaseServer();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user's portfolio from portfolios table
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (portfolioError) {
      // If portfolio doesn't exist, create one
      if (portfolioError.code === 'PGRST116') {
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert({
            user_id: user.id,
            name: 'Main Portfolio',
            cash_balance: 2000000.00,
            total_value: 2000000.00,
            unrealized_pl: 0.00,
            realized_pl: 0.00,
            is_default: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating portfolio:', createError);
          return NextResponse.json(
            { error: 'Failed to create portfolio' },
            { status: 500 }
          );
        }

        // Return in the format DashboardMetrics expects
        return NextResponse.json({
          account: {
            cash_balance: newPortfolio.cash_balance,
            portfolio_value: newPortfolio.total_value,
            total_pnl: newPortfolio.unrealized_pl + newPortfolio.realized_pl,
            total_pnl_percent: 0
          },
          message: 'New portfolio created with $2,000,000 virtual cash'
        });
      }

      console.error('Error fetching portfolio:', portfolioError);
      return NextResponse.json(
        { error: 'Failed to fetch portfolio' },
        { status: 500 }
      );
    }

    // Fetch open positions to calculate current portfolio value
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open');

    if (positionsError) {
      console.error('Error fetching positions:', positionsError);
    }

    // Calculate total positions value and P&L
    let positionsValue = 0;
    let unrealizedPL = 0;

    (positions || []).forEach((pos) => {
      // Parse notes to check asset class
      let assetClass = 'option';
      let contractSize = 100;
      let positionType = 'long';

      try {
        const notes = typeof pos.notes === 'string' ? JSON.parse(pos.notes) : (pos.notes || {});
        assetClass = notes.asset_class || 'option';
        contractSize = notes.contract_size || 100;
        positionType = notes.position_type || 'long';
      } catch (e) {
        // Ignore parse errors, use defaults
      }

      if (assetClass === 'future') {
        // For futures: calculate P&L using (current_price - entry_price) * quantity * contract_size
        const currentPrice = pos.current_price || pos.entry_price;
        const priceDiff = positionType === 'long'
          ? (currentPrice - pos.entry_price)
          : (pos.entry_price - currentPrice);
        const pnl = priceDiff * pos.quantity * contractSize;

        unrealizedPL += pnl;
        // Futures don't add to market value, only P&L
      } else {
        // For options/stocks/crypto: use market value and stored unrealized_pl
        positionsValue += (pos.market_value || pos.cost_basis || 0);
        unrealizedPL += (pos.unrealized_pl || 0);
      }
    });

    // Total portfolio value = cash + positions value
    const totalPortfolioValue = portfolio.cash_balance + positionsValue;

    // Total P&L (unrealized from positions + realized from closed trades)
    const totalPnL = unrealizedPL + (portfolio.realized_pl || 0);

    // Calculate P&L percentage based on initial investment (2M)
    const initialInvestment = 2000000;
    const totalPnLPercent = ((totalPortfolioValue - initialInvestment) / initialInvestment) * 100;

    // Return in the format DashboardMetrics expects
    return NextResponse.json({
      account: {
        cash_balance: portfolio.cash_balance,
        portfolio_value: totalPortfolioValue,
        total_pnl: totalPnL,
        total_pnl_percent: totalPnLPercent
      }
    });
  } catch (error) {
    console.error('Account API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
