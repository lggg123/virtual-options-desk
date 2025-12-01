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

    // Calculate total positions value
    const positionsValue = (positions || []).reduce((sum, pos) => {
      return sum + (pos.market_value || pos.cost_basis || 0);
    }, 0);

    // Calculate unrealized P&L from positions
    const unrealizedPL = (positions || []).reduce((sum, pos) => {
      return sum + (pos.unrealized_pl || 0);
    }, 0);

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
