import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import type { Database } from '@/lib/types';

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServer();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Extract id from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return NextResponse.json({ error: 'Position id required' }, { status: 400 });
    }

    // Debug: log request path and id
    const url = new URL(request.url);
    console.log('Closing position request', { path: url.pathname, id, userId: user.id });

    // Try to fetch the position first to provide clearer errors
    const { data: existingPos, error: fetchError } = await supabase
      .from('positions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching position for debug:', fetchError);
    }

    if (!existingPos) {
      // Provide sample of user's positions to help debug mismatches
      const { data: userPositions, error: userPosError } = await supabase
        .from('positions')
        .select('id,status,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('Position not found for id, sample user positions:', { sample: userPositions, sampleError: userPosError });

      return NextResponse.json({ error: 'Position not found', debug: { requestedId: id, userPositionsSample: userPositions || [] } }, { status: 404 });
    }

    // Attempt to mark the position as closed
    const { data, error } = await supabase
      .from('positions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Error closing position:', error);
      return NextResponse.json({ error: error.message || 'Failed to close position', details: error }, { status: 500 });
    }

    // If no rows updated, return not found
    const updated = data as Database['public']['Tables']['positions']['Row'][] | null;
    if (!updated || updated.length === 0) {
      console.error('Update returned no rows despite existingPos present', { existingPos });
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    console.log('Position closed result:', { rows: updated });
    return NextResponse.json({ success: true, rows: updated });
  } catch (e) {
    console.error('Unexpected error closing position:', e);
    return NextResponse.json({ error: 'Failed to close position' }, { status: 500 });
  }
}
