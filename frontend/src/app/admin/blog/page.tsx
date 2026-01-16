'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  MessageSquare,
  MoreHorizontal,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: 'draft' | 'published' | 'archived';
  view_count: number;
  tags: string[];
  published_at: string;
  created_at: string;
}

interface Comment {
  id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  created_at: string;
  blog_posts: {
    id: string;
    title: string;
    slug: string;
  };
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUser(session.user);
    fetchData(session.access_token);
  }

  async function fetchData(token?: string) {
    setRefreshing(true);
    const accessToken = token || (await supabase.auth.getSession()).data.session?.access_token;

    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      // Fetch posts
      const postsRes = await fetch('/api/admin/posts', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts || []);
      }

      // Fetch pending comments
      const commentsRes = await fetch('/api/admin/comments?status=pending', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function updatePostStatus(postId: string, status: string) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    try {
      const res = await fetch('/api/admin/posts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, status }),
      });

      if (res.ok) {
        toast.success(`Post ${status === 'published' ? 'published' : status === 'archived' ? 'archived' : 'updated'}`);
        fetchData();
      } else {
        toast.error('Failed to update post');
      }
    } catch {
      toast.error('Failed to update post');
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) {
      return;
    }

    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    try {
      const res = await fetch(`/api/admin/posts?id=${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Post deleted');
        fetchData();
      } else {
        toast.error('Failed to delete post');
      }
    } catch {
      toast.error('Failed to delete post');
    }
  }

  async function updateCommentStatus(commentId: string, status: string) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    try {
      const res = await fetch('/api/admin/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ commentId, status }),
      });

      if (res.ok) {
        toast.success(`Comment ${status}`);
        // Remove from pending list
        setComments(prev => prev.filter(c => c.id !== commentId));
      } else {
        toast.error('Failed to update comment');
      }
    } catch {
      toast.error('Failed to update comment');
    }
  }

  async function deleteComment(commentId: string) {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    try {
      const res = await fetch(`/api/admin/comments?id=${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Comment deleted');
        setComments(prev => prev.filter(c => c.id !== commentId));
      } else {
        toast.error('Failed to delete comment');
      }
    } catch {
      toast.error('Failed to delete comment');
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'spam':
        return <Badge variant="destructive">Spam</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Blog Admin</h1>
          <p className="text-muted-foreground">Manage posts and comments</p>
        </div>
        <Button onClick={() => fetchData()} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(p => p.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.reduce((sum, p) => sum + p.view_count, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="posts">
            <FileText className="w-4 h-4 mr-2" />
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="w-4 h-4 mr-2" />
            Pending Comments ({comments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Blog Posts</CardTitle>
              <CardDescription>Manage your blog posts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="font-medium line-clamp-1">{post.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {post.summary}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell>{post.view_count.toLocaleString()}</TableCell>
                      <TableCell>
                        {post.published_at ? formatDate(post.published_at) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/blog/${post.slug}`} target="_blank">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Post
                              </Link>
                            </DropdownMenuItem>
                            {post.status !== 'published' && (
                              <DropdownMenuItem onClick={() => updatePostStatus(post.id, 'published')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {post.status === 'published' && (
                              <DropdownMenuItem onClick={() => updatePostStatus(post.id, 'archived')}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => deletePost(post.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {posts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No posts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Comments</CardTitle>
              <CardDescription>Review and moderate comments</CardDescription>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending comments to review
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">{comment.author_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {comment.author_email} • {formatDate(comment.created_at)}
                            </div>
                          </div>
                          <Link
                            href={`/blog/${comment.blog_posts.slug}`}
                            target="_blank"
                            className="text-sm text-primary hover:underline"
                          >
                            {comment.blog_posts.title}
                          </Link>
                        </div>
                        <p className="text-sm my-3 p-3 bg-muted rounded-lg">
                          {comment.content}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateCommentStatus(comment.id, 'approved')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCommentStatus(comment.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCommentStatus(comment.id, 'spam')}
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Spam
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteComment(comment.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
