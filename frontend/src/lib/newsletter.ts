import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  author: string;
  reading_time: number;
  tags: string[];
  published_at: string;
}

export async function sendBlogPostToSubscribers(blogPost: BlogPost) {
  try {
    // Fetch all confirmed subscribers
    const { data: subscribers, error } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('status', 'confirmed');

    if (error) {
      console.error('Error fetching subscribers:', error);
      return { success: false, error: error.message };
    }

    if (!subscribers || subscribers.length === 0) {
      console.log('No confirmed subscribers to send to');
      return { success: true, sent: 0 };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://marketstockpick.com';
    const postUrl = `${baseUrl}/blog/${blogPost.slug}`;

    // Get first 200 words of content for preview
    const contentPreview = blogPost.content
      .replace(/<[^>]*>/g, '') // Strip HTML tags
      .split(' ')
      .slice(0, 200)
      .join(' ') + '...';

    // Send emails in batches to avoid rate limits
    const batchSize = 100;
    let sentCount = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      await Promise.all(batch.map(async (subscriber) => {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'AI Market Insights <insights@marketstockpick.com>',
            to: subscriber.email,
            subject: `📊 ${blogPost.title}`,
            html: generateBlogEmailHTML(blogPost, postUrl, contentPreview, subscriber.email),
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send to ${subscriber.email}:`, error);
        }
      }));

      // Wait between batches to respect rate limits
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Blog post email sent to ${sentCount} subscribers`);
    return { success: true, sent: sentCount };

  } catch (error) {
    console.error('Error sending blog post emails:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function generateBlogEmailHTML(blogPost: BlogPost, postUrl: string, contentPreview: string, subscriberEmail: string): string {
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://marketstockpick.com'}/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blogPost.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">
                AI Market Insights
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Daily Market Analysis & Trading Strategies
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 28px; line-height: 1.3;">
                ${blogPost.title}
              </h2>

              <div style="margin: 20px 0; padding: 15px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">
                      <strong>By:</strong> ${blogPost.author}
                    </td>
                    <td align="right" style="padding: 5px 0; color: #6b7280; font-size: 14px;">
                      📖 ${blogPost.reading_time} min read
                    </td>
                  </tr>
                </table>
              </div>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                ${blogPost.summary}
              </p>

              <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #667eea;">
                <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
                  ${contentPreview}
                </p>
              </div>

              <!-- Tags -->
              ${blogPost.tags.length > 0 ? `
              <div style="margin: 25px 0;">
                ${blogPost.tags.map(tag => `
                  <span style="display: inline-block; background-color: #e5e7eb; color: #374151; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-right: 8px; margin-bottom: 8px;">
                    ${tag}
                  </span>
                `).join('')}
              </div>
              ` : ''}

              <!-- CTA Button -->
              <table role="presentation" style="margin: 40px 0;">
                <tr>
                  <td align="center">
                    <a href="${postUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                      Read Full Article →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                You're receiving this because you subscribed to AI Market Insights
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: none;">Unsubscribe</a> •
                <a href="${postUrl}" style="color: #667eea; text-decoration: none;">View in browser</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
