'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface BlogCommentsProps {
  slug: string;
}

export function BlogComments({ slug }: BlogCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [slug]);

  async function fetchComments() {
    try {
      const response = await fetch(`/api/blog/comments?slug=${slug}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!authorName.trim() || !authorEmail.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Comment submitted for review!');
        setAuthorName('');
        setAuthorEmail('');
        setContent('');
        setShowForm(false);
      } else {
        toast.error(data.error || 'Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mt-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Comment List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to share your thoughts!
            </div>
          ) : (
            <div className="space-y-6 mb-8">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{comment.author_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground ml-10 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Comment Form Toggle */}
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Leave a Comment
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-medium">Leave a Comment</h3>
              <p className="text-sm text-muted-foreground">
                Your comment will be visible after moderation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="authorName">Name *</Label>
                  <Input
                    id="authorName"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Your name"
                    disabled={submitting}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="authorEmail">Email *</Label>
                  <Input
                    id="authorEmail"
                    type="email"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={submitting}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your email will not be published.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Comment *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={4}
                  disabled={submitting}
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {content.length}/2000 characters
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Comment
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
