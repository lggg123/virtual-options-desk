'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, Clock, Eye, ArrowRight, Home, LogIn, Rss } from 'lucide-react';
import { NewsletterSignup } from '@/components/NewsletterSignup';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  author: string;
  reading_time: number;
  tags: string[];
  published_at: string;
  view_count: number;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  async function fetchBlogPosts() {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, summary, author, reading_time, tags, published_at, view_count')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicBlogHeader />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-muted-foreground">Loading blog posts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicBlogHeader />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Market Insights
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Daily market analysis and trading opportunities powered by artificial intelligence
          </p>
          <div className="mt-6">
            <a
              href="/api/blog/rss"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Rss className="w-4 h-4" />
              Subscribe to RSS Feed
            </a>
          </div>
        </div>

        {/* Blog Posts Grid */}
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">
                No blog posts yet. Check back tomorrow for fresh AI-generated insights!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 max-w-4xl mx-auto">
            {posts.map((post) => (
              <Card key={post.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Link href={`/blog/${post.slug}`}>
                    <CardTitle className="text-2xl mb-2 group-hover:text-primary transition-colors cursor-pointer">
                      {post.title}
                    </CardTitle>
                  </Link>
                  <CardDescription className="text-base">
                    {post.summary}
                  </CardDescription>
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
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
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="max-w-4xl mx-auto mt-12">
          <NewsletterSignup />
        </div>
      </div>
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
