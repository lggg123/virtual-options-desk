import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServer();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Fetching positions for user:', user.id);

    // Fetch open positions from the positions table
    const { data: positions, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }

    // Transform database positions to match frontend interface
    const transformedPositions = (positions || []).map(pos => ({
      id: pos.id,
      symbol: pos.symbol,
      type: pos.option_type || pos.position_type,
      strike: pos.strike_price || 0,
      expiry: pos.expiration_date || '',
      quantity: pos.quantity,
      avgPrice: pos.entry_price,
      currentPrice: pos.current_price || pos.entry_price,
      pnl: pos.unrealized_pl || ((pos.current_price || pos.entry_price) - pos.entry_price) * pos.quantity * 100,
      pnlPercent: pos.unrealized_pl_percent || (pos.entry_price > 0 ? (((pos.current_price || pos.entry_price) - pos.entry_price) / pos.entry_price) * 100 : 0),
      delta: pos.delta || 0,
      theta: pos.theta || 0,
      gamma: pos.gamma || 0,
      vega: pos.vega || 0,
    }));

    return NextResponse.json({ positions: transformedPositions });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}
