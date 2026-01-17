import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { postToSocialMedia, getConfiguredPlatforms } from '@/lib/social-media';
import type { Database } from '@/lib/types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get social media post status for a blog post
export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (postId) {
      // Get status for specific post
      const { data: socialPosts, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('blog_post_id', postId);

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
      }

      return NextResponse.json({
        socialPosts: socialPosts || [],
        configuredPlatforms: getConfiguredPlatforms(),
      });
    }

    // Return configured platforms
    return NextResponse.json({
      configuredPlatforms: getConfiguredPlatforms(),
    });

  } catch (error) {
    console.error('Social post GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Trigger social media posting for a blog post
export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, platforms } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    // Fetch the blog post
    const { data: blogPost, error: postError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, summary, tags')
      .eq('id', postId)
      .single();

    if (postError || !blogPost) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Determine which platforms to post to
    const configuredPlatforms = getConfiguredPlatforms();
    const targetPlatforms = platforms
      ? platforms.filter((p: string) => configuredPlatforms.includes(p as 'twitter' | 'linkedin' | 'facebook' | 'reddit'))
      : configuredPlatforms;

    if (targetPlatforms.length === 0) {
      return NextResponse.json({
        error: 'No social media platforms configured',
        configuredPlatforms,
      }, { status: 400 });
    }

    // Post to social media
    const results = await postToSocialMedia(blogPost, targetPlatforms);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Posted to ${successCount} platform(s)${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results,
    });

  } catch (error) {
    console.error('Social post POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
