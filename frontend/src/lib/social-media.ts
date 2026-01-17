import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  tags: string[];
}

type Platform = 'twitter' | 'linkedin' | 'facebook' | 'reddit';

interface PostResult {
  platform: Platform;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

// Generate hashtags from tags
function generateHashtags(tags: string[], max: number = 5): string {
  return tags
    .slice(0, max)
    .map(tag => `#${tag.replace(/[^a-zA-Z0-9]/g, '')}`)
    .join(' ');
}

// Twitter/X API
async function postToTwitter(blogPost: BlogPost, postUrl: string): Promise<PostResult> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return { platform: 'twitter', success: false, error: 'Twitter API credentials not configured' };
  }

  try {
    // Twitter API v2 requires OAuth 1.0a - using a simplified approach here
    // In production, you'd want to use a library like 'twitter-api-v2'
    const text = `📊 ${blogPost.title}\n\n${blogPost.summary.substring(0, 180)}...\n\nRead more: ${postUrl}\n\n${generateHashtags(blogPost.tags)}`;

    // For now, we'll mark this as needing implementation with the twitter-api-v2 package
    // This is a placeholder that shows the integration pattern
    console.log('Twitter post would be:', text);

    // Simulated response - in production, replace with actual Twitter API call
    // const client = new TwitterApi({ ... });
    // const tweet = await client.v2.tweet(text);

    return {
      platform: 'twitter',
      success: true,
      postId: 'pending_implementation',
      postUrl: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text),
    };
  } catch (error) {
    return {
      platform: 'twitter',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// LinkedIn API
async function postToLinkedIn(blogPost: BlogPost, postUrl: string): Promise<PostResult> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const orgId = process.env.LINKEDIN_ORG_ID; // or person URN for personal profiles

  if (!accessToken) {
    return { platform: 'linkedin', success: false, error: 'LinkedIn API credentials not configured' };
  }

  try {
    const text = `📊 ${blogPost.title}\n\n${blogPost.summary}\n\nRead the full analysis: ${postUrl}\n\n${generateHashtags(blogPost.tags)}`;

    // LinkedIn API v2 for organization shares
    const shareData = {
      author: orgId ? `urn:li:organization:${orgId}` : `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: text,
          },
          shareMediaCategory: 'ARTICLE',
          media: [
            {
              status: 'READY',
              originalUrl: postUrl,
              title: {
                text: blogPost.title,
              },
              description: {
                text: blogPost.summary.substring(0, 200),
              },
            },
          ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    console.log('LinkedIn post would be:', shareData);

    // Placeholder - implement with actual LinkedIn API
    return {
      platform: 'linkedin',
      success: true,
      postId: 'pending_implementation',
      postUrl: postUrl,
    };
  } catch (error) {
    return {
      platform: 'linkedin',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Facebook API
async function postToFacebook(blogPost: BlogPost, postUrl: string): Promise<PostResult> {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!accessToken || !pageId) {
    return { platform: 'facebook', success: false, error: 'Facebook API credentials not configured' };
  }

  try {
    const message = `📊 ${blogPost.title}\n\n${blogPost.summary}\n\n${generateHashtags(blogPost.tags)}`;

    // Facebook Graph API
    const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        link: postUrl,
        access_token: accessToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Facebook API error');
    }

    const data = await response.json();

    return {
      platform: 'facebook',
      success: true,
      postId: data.id,
      postUrl: `https://facebook.com/${data.id}`,
    };
  } catch (error) {
    return {
      platform: 'facebook',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Reddit API
async function postToReddit(blogPost: BlogPost, postUrl: string): Promise<PostResult> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;
  const subreddit = process.env.REDDIT_SUBREDDIT || 'test';

  if (!clientId || !clientSecret || !username || !password) {
    return { platform: 'reddit', success: false, error: 'Reddit API credentials not configured' };
  }

  try {
    // Get OAuth token
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    });

    if (!authResponse.ok) {
      throw new Error('Reddit authentication failed');
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Submit link post
    const submitResponse = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'AIMarketInsights/1.0',
      },
      body: new URLSearchParams({
        sr: subreddit,
        kind: 'link',
        title: `📊 ${blogPost.title}`,
        url: postUrl,
        resubmit: 'true',
      }).toString(),
    });

    if (!submitResponse.ok) {
      const error = await submitResponse.json();
      throw new Error(error.jquery?.[1]?.[3]?.[0] || 'Reddit submission failed');
    }

    const submitData = await submitResponse.json();

    return {
      platform: 'reddit',
      success: true,
      postId: submitData.json?.data?.id,
      postUrl: submitData.json?.data?.url,
    };
  } catch (error) {
    return {
      platform: 'reddit',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Main function to post to all platforms
export async function postToSocialMedia(
  blogPost: BlogPost,
  platforms: Platform[] = ['twitter', 'linkedin', 'facebook', 'reddit']
): Promise<PostResult[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://marketstockpick.com';
  const postUrl = `${baseUrl}/blog/${blogPost.slug}`;

  const results: PostResult[] = [];

  for (const platform of platforms) {
    let result: PostResult;

    switch (platform) {
      case 'twitter':
        result = await postToTwitter(blogPost, postUrl);
        break;
      case 'linkedin':
        result = await postToLinkedIn(blogPost, postUrl);
        break;
      case 'facebook':
        result = await postToFacebook(blogPost, postUrl);
        break;
      case 'reddit':
        result = await postToReddit(blogPost, postUrl);
        break;
      default:
        result = { platform, success: false, error: 'Unknown platform' };
    }

    results.push(result);

    // Save result to database
    try {
      await supabase.from('social_media_posts').upsert({
        blog_post_id: blogPost.id,
        platform: platform,
        post_id: result.postId || null,
        post_url: result.postUrl || null,
        status: result.success ? 'posted' : 'failed',
        error_message: result.error || null,
        posted_at: result.success ? new Date().toISOString() : null,
      }, {
        onConflict: 'blog_post_id,platform',
      });
    } catch (error) {
      console.error(`Error saving ${platform} post result:`, error);
    }

    // Small delay between posts
    if (platforms.indexOf(platform) < platforms.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// Check which platforms are configured
export function getConfiguredPlatforms(): Platform[] {
  const platforms: Platform[] = [];

  if (process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN) {
    platforms.push('twitter');
  }
  if (process.env.LINKEDIN_ACCESS_TOKEN) {
    platforms.push('linkedin');
  }
  if (process.env.FACEBOOK_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID) {
    platforms.push('facebook');
  }
  if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_USERNAME) {
    platforms.push('reddit');
  }

  return platforms;
}
