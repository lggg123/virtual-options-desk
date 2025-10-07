'use client';

import { useState, useEffect } from 'react';
import { Calendar, Tag, TrendingUp, Newspaper } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  date: string;
  topic: string;
  symbols_analyzed: string[];
  content: string;
  summary: string;
  tags: string[];
  generated_by: string;
  generated_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  async function fetchBlogPosts() {
    try {
      // In production, this would fetch from a database
      // For now, we'll use localStorage
      const stored = localStorage.getItem('blog_posts');
      if (stored) {
        setPosts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateDailyBlog() {
    setGenerating(true);
    try {
      const response = await fetch('https://crewai-service-production.up.railway.app/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'daily market analysis',
          symbols: ['SPY', 'AAPL', 'GOOGL', 'TSLA', 'NVDA'],
          apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
        })
      });

      if (response.ok) {
        const newPost = await response.json();
        newPost.id = Date.now().toString();
        
        const updated = [newPost, ...posts];
        setPosts(updated);
        
        // Save to localStorage
        localStorage.setItem('blog_posts', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error generating blog:', error);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">AI Market Insights Blog</h1>
              <p className="text-gray-400">Daily market analysis powered by AI agents</p>
            </div>
            <button
              onClick={generateDailyBlog}
              disabled={generating}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Newspaper className="w-5 h-5" />
                  Generate Daily Post
                </>
              )}
            </button>
          </div>
        </div>

        {/* Blog Posts */}
        {loading ? (
          <div className="bg-slate-900 rounded-lg p-12 text-center border border-slate-800">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-400">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-slate-900 rounded-lg p-12 text-center border border-slate-800">
            <Newspaper className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No blog posts yet</p>
            <button
              onClick={generateDailyBlog}
              disabled={generating}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Generate First Post
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors"
              >
                <div className="p-8">
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-white mb-4">{post.title}</h2>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {post.symbols_analyzed.join(', ')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Generated by {post.generated_by}
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-gray-300 mb-6 leading-relaxed">{post.summary}</p>

                  {/* Content */}
                  <div className="prose prose-invert max-w-none mb-6">
                    <p className="text-gray-400">{post.content}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-800 text-gray-300 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
