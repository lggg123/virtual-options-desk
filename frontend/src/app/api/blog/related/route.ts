import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const limit = parseInt(searchParams.get('limit') || '3');

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter required' }, { status: 400 });
    }

    // Get the current post to find its tags
    const { data: currentPost, error: currentError } = await supabase
      .from('blog_posts')
      .select('id, tags')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (currentError || !currentPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const currentTags = currentPost.tags || [];

    if (currentTags.length === 0) {
      // If no tags, return recent posts
      const { data: recentPosts, error: recentError } = await supabase
        .from('blog_posts')
        .select('id, title, slug, summary, reading_time, tags, published_at')
        .eq('status', 'published')
        .neq('id', currentPost.id)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (recentError) {
        console.error('Error fetching recent posts:', recentError);
        return NextResponse.json({ error: 'Failed to fetch related posts' }, { status: 500 });
      }

      return NextResponse.json({ posts: recentPosts || [] });
    }

    // Fetch all published posts except the current one
    const { data: allPosts, error: allError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, summary, reading_time, tags, published_at')
      .eq('status', 'published')
      .neq('id', currentPost.id)
      .order('published_at', { ascending: false })
      .limit(50); // Get more to find best matches

    if (allError) {
      console.error('Error fetching posts:', allError);
      return NextResponse.json({ error: 'Failed to fetch related posts' }, { status: 500 });
    }

    if (!allPosts || allPosts.length === 0) {
      return NextResponse.json({ posts: [] });
    }

    // Calculate relevance score based on shared tags
    const scoredPosts = allPosts.map(post => {
      const postTags = post.tags || [];
      const sharedTags = currentTags.filter(tag => postTags.includes(tag));
      const relevanceScore = sharedTags.length;

      return {
        ...post,
        relevanceScore,
        sharedTags
      };
    });

    // Sort by relevance score (descending), then by published_at (descending)
    const sortedPosts = scoredPosts
      .filter(post => post.relevanceScore > 0) // Only include posts with at least 1 shared tag
      .sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });

    // If we don't have enough related posts with shared tags, fill with recent posts
    if (sortedPosts.length < limit) {
      const additionalPosts = scoredPosts
        .filter(post => post.relevanceScore === 0)
        .slice(0, limit - sortedPosts.length);
      sortedPosts.push(...additionalPosts);
    }

    // Take only the requested number of posts and remove internal fields
    const relatedPosts = sortedPosts
      .slice(0, limit)
      .map(({ relevanceScore, sharedTags, ...post }) => post);

    return NextResponse.json({ posts: relatedPosts });

  } catch (error) {
    console.error('Related posts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
