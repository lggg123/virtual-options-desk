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

    // Return empty positions for now - user will build positions by trading
    // Once user_positions table is created in Supabase, uncomment below:
    /*
    const { data: positions, error } = await supabase
      .from('user_positions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    
    return NextResponse.json({ positions: positions || [] });
    */

    return NextResponse.json({ positions: [] });
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}
