import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

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
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const prompt = `You are an expert market analyst and financial writer. Write a comprehensive, SEO-optimized blog post about today's market insights and trading opportunities.

Today's Date: ${today}

Requirements:
1. Write an engaging, informative blog post (800-1200 words)
2. Include current market trends, key sectors, and trading opportunities
3. Discuss volatility, sentiment, and potential catalysts
4. Provide actionable insights for options traders
5. Use markdown formatting with headers, lists, and emphasis
6. Include specific stock tickers and sectors
7. Write in a professional yet accessible tone

Format your response as JSON with the following structure:
{
  "title": "Compelling SEO-friendly title",
  "summary": "2-3 sentence summary for preview",
  "content": "Full blog post in markdown format",
  "tags": ["tag1", "tag2", "tag3"],
  "marketData": {
    "trend": "bullish|bearish|neutral",
    "sentiment": "positive|negative|mixed",
    "confidence": 0.75,
    "keyStocks": ["AAPL", "TSLA", "NVDA"],
    "sectors": ["Technology", "Energy"]
  }
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert financial analyst and content writer. Always respond with valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');
  
  return {
    title: result.title,
    slug: generateSlug(result.title),
    summary: result.summary,
    content: result.content,
    tags: result.tags || [],
    readingTime: calculateReadingTime(result.content),
    marketData: result.marketData || {}
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 Starting automated daily blog generation...');

    // Generate blog post
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
        meta_description: blogPost.summary.substring(0, 160),
        meta_keywords: blogPost.tags,
        market_data: blogPost.marketData,
        status: 'published',
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving blog post:', error);
      return NextResponse.json(
        { error: 'Failed to save blog post', details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Blog post published: "${data.title}" (ID: ${data.id})`);

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
