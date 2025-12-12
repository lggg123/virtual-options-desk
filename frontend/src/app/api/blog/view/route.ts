import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types';

// Use service role key for server-side updates
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple in-memory rate limiting (resets on server restart)
const viewedPosts = new Map<string, Set<string>>();

function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}-${userAgent.slice(0, 50)}`;
}

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    // Rate limiting: prevent same client from incrementing view multiple times per session
    const clientId = getClientId(request);
    const clientViews = viewedPosts.get(clientId) || new Set();

    if (clientViews.has(slug)) {
      // Already viewed by this client, return success but don't increment
      return NextResponse.json({ success: true, message: 'Already counted' });
    }

    // Fetch current view count
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('view_count')
      .eq('slug', slug)
      .single();

    if (fetchError || !post) {
      console.error('Error fetching post:', fetchError);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment view count
    const newViewCount = (post.view_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ view_count: newViewCount })
      .eq('slug', slug);

    if (updateError) {
      console.error('Error updating view count:', updateError);
      return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 });
    }

    // Mark as viewed by this client
    clientViews.add(slug);
    viewedPosts.set(clientId, clientViews);

    // Clean up old entries periodically (keep map from growing indefinitely)
    if (viewedPosts.size > 10000) {
      const entries = Array.from(viewedPosts.entries());
      viewedPosts.clear();
      entries.slice(-5000).forEach(([k, v]) => viewedPosts.set(k, v));
    }

    return NextResponse.json({ success: true, view_count: newViewCount });
  } catch (error) {
    console.error('View count API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
