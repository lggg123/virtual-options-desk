import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Calendar, Clock, Eye, ArrowLeft, Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import type { Database } from '@/lib/types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getBlogPost(slug: string) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) return null;

  // Increment view count
  try {
    await supabase.rpc('increment_blog_view_count', { post_slug: slug });
  } catch (err) {
    console.error('Error incrementing view count:', err);
  }

  return data;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | AI Market Insights`,
    description: post.meta_description || post.summary,
    keywords: post.meta_keywords?.join(', '),
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicBlogHeader />
      
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Link href="/blog">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        <Card>
          <CardHeader>
            {/* Title */}
            <h1 className="text-4xl font-bold mb-6">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(post.published_at)}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.reading_time} min read
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.view_count} views
              </div>
              <div>
                ✍️ {post.author}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {/* Summary */}
            <div className="mb-8 p-4 bg-muted rounded-lg border-l-4 border-primary">
              <p className="text-lg italic">{post.summary}</p>
            </div>

            {/* Content */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
                  h2: ({ ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
                  h3: ({ ...props }) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
                  p: ({ ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                  ul: ({ ...props }) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                  ol: ({ ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                  li: ({ ...props }) => <li className="ml-4" {...props} />,
                  strong: ({ ...props }) => <strong className="font-bold text-primary" {...props} />,
                  a: ({ ...props }) => <a className="text-primary hover:underline" {...props} />,
                  code: ({ ...props }) => <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} />,
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Market Data */}
            {post.market_data && (
              <div className="mt-8 p-6 bg-muted rounded-lg border">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  📊 Market Data Snapshot
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {post.market_data.trend && (
                    <div>
                      <div className="text-sm text-muted-foreground">Market Trend</div>
                      <div className="font-semibold text-lg capitalize">{post.market_data.trend}</div>
                    </div>
                  )}
                  {post.market_data.sentiment && (
                    <div>
                      <div className="text-sm text-muted-foreground">Sentiment</div>
                      <div className="font-semibold text-lg capitalize">{post.market_data.sentiment}</div>
                    </div>
                  )}
                  {post.market_data.confidence && (
                    <div>
                      <div className="text-sm text-muted-foreground">Confidence</div>
                      <div className="font-semibold text-lg">
                        {Math.round(post.market_data.confidence * 100)}%
                      </div>
                    </div>
                  )}
                  {post.market_data.keyStocks && post.market_data.keyStocks.length > 0 && (
                    <div className="col-span-2 md:col-span-3">
                      <div className="text-sm text-muted-foreground mb-2">Key Stocks</div>
                      <div className="flex flex-wrap gap-2">
                        {post.market_data.keyStocks.map((stock: string) => (
                          <Badge key={stock} variant="outline">{stock}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {post.market_data.sectors && post.market_data.sectors.length > 0 && (
                    <div className="col-span-2 md:col-span-3">
                      <div className="text-sm text-muted-foreground mb-2">Sectors</div>
                      <div className="flex flex-wrap gap-2">
                        {post.market_data.sectors.map((sector: string) => (
                          <Badge key={sector} variant="secondary">{sector}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to Blog Button */}
        <div className="mt-8 text-center">
          <Link href="/blog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Posts
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
}

// Public Blog Header Component (no auth required)
function PublicBlogHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition">
              <h1 className="text-2xl font-bold">Virtual Options Desk</h1>
            </div>
          </Link>
          <div className="hidden md:block text-sm text-muted-foreground">
            AI Market Insights
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="default" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
