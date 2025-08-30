import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServer();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Check for authentication error
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    // For development/testing, create a mock user if not authenticated
    const mockUser = user || {
      id: 'demo-user-id',
      email: 'demo@example.com'
    };
    
    console.log('Positions API - Auth user:', user ? 'authenticated' : 'using mock user for testing');
    
    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For mock user, return some sample positions for testing
    if (!user) {
      const mockPositions = [
        {
          id: 1,
          symbol: 'AAPL',
          type: 'Call',
          strike: 180,
          expiry: '2024-02-16',
          quantity: 1,
          avgPrice: 3.25,
          currentPrice: 3.85,
          pnl: 60,
          pnlPercent: 18.46,
          delta: 0.65,
          theta: -0.08,
          gamma: 0.015,
          vega: 0.12
        }
      ];
      
      return NextResponse.json({ positions: mockPositions });
    }

    // Fetch user's positions with calculated P&L
    const { data: positions, error } = await supabase
      .from('positions')
      .select(`
        *,
        orders!inner(option_id, price)
      `)
      .eq('user_id', mockUser.id)
      .is('closed_at', null);

    if (error) {
      throw error;
    }

    // Transform positions data for frontend
    const transformedPositions = positions?.map(position => {
      // Parse option details from option_id (format: SYMBOL-EXPIRY-STRIKE-TYPE)
      const [symbol, expiry, strike, type] = position.option_id.split('-');
      
      // Calculate current value and P&L (simplified)
      const currentPrice = position.average_cost * (1 + Math.random() * 0.2 - 0.1); // Mock price movement
      const currentValue = position.quantity * currentPrice * 100;
      const totalCost = position.quantity * position.average_cost * 100;
      const pnl = currentValue - totalCost;
      const pnlPercent = (pnl / totalCost) * 100;

      return {
        id: position.id,
        symbol: symbol,
        type: type === 'call' ? 'Call' : 'Put',
        strike: parseFloat(strike),
        expiry: expiry,
        quantity: position.quantity,
        avgPrice: position.average_cost,
        currentPrice: currentPrice,
        pnl: pnl,
        pnlPercent: pnlPercent,
        delta: Math.random() * 0.8 + 0.1, // Mock Greeks
        theta: -(Math.random() * 0.2),
        gamma: Math.random() * 0.03,
        vega: Math.random() * 0.2
      };
    }) || [];

    return NextResponse.json({ positions: transformedPositions });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}
