// app/api/blog/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBlogAgent } from '@/lib/blog';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, topic, apiKey } = body;
    
    const blogAgent = getBlogAgent(apiKey);
    
    let blogPost;
    if (type === 'daily') {
      blogPost = await blogAgent.generateDailyBlog();
    } else if (type === 'custom' && topic) {
      blogPost = await blogAgent.generateCustomBlog(topic);
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Specify type as "daily" or "custom" with topic.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      blog: blogPost
    });
    
  } catch (error) {
    console.error('Blog generation API error:', error);
    return NextResponse.json(
      { error: 'Blog generation failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Blog Generation API',
    endpoints: {
      'POST /api/blog/generate': {
        description: 'Generate a blog post',
        body: {
          type: '"daily" | "custom"',
          topic: 'string (required for custom type)',
          apiKey: 'string (optional - for enhanced analysis)'
        }
      }
    }
  });
}