import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get approved comments for a blog post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const slug = searchParams.get('slug');

    if (!postId && !slug) {
      return NextResponse.json({ error: 'postId or slug parameter required' }, { status: 400 });
    }

    let blogPostId = postId;

    // If slug is provided, get the post ID
    if (slug && !postId) {
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single();

      if (postError || !post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      blogPostId = post.id;
    }

    // Fetch approved comments
    const { data: comments, error } = await supabase
      .from('blog_comments')
      .select('id, author_name, content, created_at')
      .eq('blog_post_id', blogPostId!)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json({ comments: comments || [] });

  } catch (error) {
    console.error('Comments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Submit a new comment (pending moderation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, slug, authorName, authorEmail, content } = body;

    // Validate required fields
    if (!authorName || !authorEmail || !content) {
      return NextResponse.json(
        { error: 'Name, email, and comment are required' },
        { status: 400 }
      );
    }

    if (!postId && !slug) {
      return NextResponse.json(
        { error: 'postId or slug is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate content length
    if (content.length < 3) {
      return NextResponse.json({ error: 'Comment is too short' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Comment is too long (max 2000 characters)' }, { status: 400 });
    }

    let blogPostId = postId;

    // If slug is provided, get the post ID
    if (slug && !postId) {
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single();

      if (postError || !post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      blogPostId = post.id;
    }

    // Get client info for spam detection
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Simple spam check - block if same IP submitted within last minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentComments } = await supabase
      .from('blog_comments')
      .select('id')
      .eq('ip_address', ipAddress)
      .gte('created_at', oneMinuteAgo);

    if (recentComments && recentComments.length >= 3) {
      return NextResponse.json(
        { error: 'Too many comments. Please wait a moment before posting again.' },
        { status: 429 }
      );
    }

    // Insert comment with pending status
    const { data: comment, error } = await supabase
      .from('blog_comments')
      .insert({
        blog_post_id: blogPostId,
        author_name: authorName.trim(),
        author_email: authorEmail.trim().toLowerCase(),
        content: content.trim(),
        status: 'pending',
        ip_address: ipAddress,
        user_agent: userAgent.substring(0, 500),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Comment submitted successfully. It will appear after moderation.',
      commentId: comment.id,
    });

  } catch (error) {
    console.error('Comments POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
