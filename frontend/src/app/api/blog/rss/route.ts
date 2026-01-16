import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types';

// Use service role key for server-side queries
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export async function GET(request: NextRequest) {
  try {
    // Get the base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Fetch published blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, summary, content, author, published_at, tags')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50); // RSS feeds typically show 10-50 most recent items

    if (error) {
      console.error('Error fetching blog posts for RSS:', error);
      return new NextResponse('Error generating RSS feed', { status: 500 });
    }

    // Build RSS 2.0 XML
    const rssItems = (posts || []).map(post => {
      const postUrl = `${baseUrl}/blog/${post.slug}`;
      const pubDate = new Date(post.published_at).toUTCString();

      // Get plain text description from content (first 300 chars)
      const description = post.summary || stripHtml(post.content).substring(0, 300) + '...';

      // Categories from tags
      const categories = (post.tags || []).map(tag =>
        `    <category>${escapeXml(tag)}</category>`
      ).join('\n');

      return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${escapeXml(postUrl)}</link>
    <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
    <description>${escapeXml(description)}</description>
    <pubDate>${pubDate}</pubDate>
    <author>${escapeXml(post.author || 'AI Market Analyst')}</author>
${categories}
  </item>`;
    }).join('\n');

    const lastBuildDate = posts && posts.length > 0
      ? new Date(posts[0].published_at).toUTCString()
      : new Date().toUTCString();

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI Market Insights - Virtual Options Desk</title>
    <link>${baseUrl}/blog</link>
    <description>Daily market analysis and trading opportunities powered by artificial intelligence</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/api/blog/rss" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>AI Market Insights</title>
      <link>${baseUrl}/blog</link>
    </image>
${rssItems}
  </channel>
</rss>`;

    // Return XML with proper content type
    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('RSS generation error:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
