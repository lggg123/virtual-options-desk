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

    // Attempt to mark the position as closed or delete it
    const { data, error } = await supabase
      .from('positions')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error closing position:', error);
      return NextResponse.json({ error: 'Failed to close position' }, { status: 500 });
    }

    // If no rows updated, return not found
    const updated = data as Database['public']['Tables']['positions']['Row'][] | null;
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Unexpected error closing position:', e);
    return NextResponse.json({ error: 'Failed to close position' }, { status: 500 });
  }
}
