import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBlogPostToSubscribers } from '@/lib/newsletter';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

async function generateDailyBlog() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Call the market_blog_crew API service to generate the blog post
  const crewaiServiceUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8000';
  const crewaiApiKey = process.env.CREWAI_API_KEY || 'your-secret-api-key-here';

  console.log(`📡 Calling CrewAI service at ${crewaiServiceUrl}/generate-blog`);

  const response = await fetch(`${crewaiServiceUrl}/generate-blog`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${crewaiApiKey}`
    },
    body: JSON.stringify({
      date: today
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`CrewAI service error (${response.status}): ${errorData.message || response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message || 'Blog generation failed');
  }

  const blog = result.blog;

  // Ensure required fields have fallback values
  const title = blog.title || `Market Analysis - ${new Date().toLocaleDateString()}`;
  const content = blog.content || '';
  const summary = blog.meta_description || blog.summary || 'Daily market analysis and trading insights.';

  return {
    title,
    slug: generateSlug(title),
    summary,
    content,
    tags: blog.tags || ['market-analysis'],
    readingTime: calculateReadingTime(content),
    metaDescription: summary,
    metaKeywords: blog.target_keywords || blog.tags || ['market-analysis', 'trading'],
    marketData: {
      trend: 'neutral',
      sentiment: 'mixed',
      confidence: 0.75,
      keyStocks: [],
      sectors: [blog.market_data?.top_sector || ''].filter(Boolean),
      ...blog.market_data
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 Starting automated daily blog generation via CrewAI...');

    // Generate blog post using CrewAI service
    const blogPost = await generateDailyBlog();

    // Save to Supabase
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        title: blogPost.title,
        slug: blogPost.slug,
        content: blogPost.content,
        summary: blogPost.summary,
        author: 'AI Market Analyst',
        reading_time: blogPost.readingTime,
        tags: blogPost.tags,
        meta_description: (blogPost.metaDescription || blogPost.summary || '').substring(0, 160),
        meta_keywords: blogPost.metaKeywords,
        market_data: blogPost.marketData,
        status: 'published',
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving blog post:', error);

      // Check if this is a duplicate key error (PostgreSQL error code 23505)
      if (error.code === '23505' && error.message.includes('blog_posts_slug_key')) {
        // The post already exists - check if it was created today
        console.log('⚠️  Duplicate slug detected, checking existing post...');

        const { data: existingPost } = await supabaseAdmin
          .from('blog_posts')
          .select('id, title, slug, published_at')
          .eq('slug', blogPost.slug)
          .single();

        if (existingPost) {
          const existingDate = new Date(existingPost.published_at).toISOString().split('T')[0];
          const today = new Date().toISOString().split('T')[0];

          if (existingDate === today) {
            // Post already exists for today - return success (idempotent)
            console.log(`✅ Blog post already exists for today: "${existingPost.title}" (ID: ${existingPost.id})`);
            return NextResponse.json({
              success: true,
              message: 'Daily blog already exists for today',
              post: {
                id: existingPost.id,
                title: existingPost.title,
                slug: existingPost.slug,
                published_at: existingPost.published_at
              }
            });
          }
        }
      }

      // For other errors or if duplicate is from a different day, return error
      return NextResponse.json(
        { error: 'Failed to save blog post', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Blog post published: "${data.title}" (ID: ${data.id})`);

    // Send newsletter to subscribers (non-blocking)
    sendBlogPostToSubscribers({
      id: data.id,
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      content: data.content,
      author: data.author,
      reading_time: data.reading_time,
      tags: data.tags,
      published_at: data.published_at,
    }).then(result => {
      if (result.success) {
        console.log(`📧 Newsletter sent to ${result.sent} subscribers`);
      } else {
        console.error('📧 Newsletter sending failed:', result.error);
      }
    }).catch(error => {
      console.error('📧 Newsletter sending error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Daily blog generated and published',
      post: {
        id: data.id,
        title: data.title,
        slug: data.slug,
        published_at: data.published_at
      }
    });

  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json(
      { 
        error: 'Blog generation failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Manual trigger endpoint (for testing)
export async function POST(request: NextRequest) {
  return GET(request);
}
