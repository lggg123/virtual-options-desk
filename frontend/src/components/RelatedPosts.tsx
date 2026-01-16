'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  reading_time: number;
  tags: string[];
  published_at: string;
}

interface RelatedPostsProps {
  currentSlug: string;
  limit?: number;
}

export function RelatedPosts({ currentSlug, limit = 3 }: RelatedPostsProps) {
  const [posts, setPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelatedPosts() {
      try {
        const response = await fetch(`/api/blog/related?slug=${currentSlug}&limit=${limit}`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error('Error fetching related posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRelatedPosts();
  }, [currentSlug, limit]);

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <Card key={post.id} className="group hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader className="flex-grow">
              <Link href={`/blog/${post.slug}`}>
                <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors cursor-pointer line-clamp-2">
                  {post.title}
                </CardTitle>
              </Link>
              <CardDescription className="line-clamp-2">
                {post.summary}
              </CardDescription>

              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                {post.reading_time} min
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {post.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <Link href={`/blog/${post.slug}`}>
                <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors w-full">
                  Read More
                  <ArrowRight className="w-3 h-3 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
