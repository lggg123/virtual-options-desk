import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return new NextResponse(
        '<html><body><h1>Invalid unsubscribe link</h1><p>The email parameter is missing.</p></body></html>',
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Find subscriber
    const { data: subscriber, error: fetchError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !subscriber) {
      return new NextResponse(
        '<html><body><h1>Email not found</h1><p>This email is not subscribed to our newsletter.</p></body></html>',
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (subscriber.status === 'unsubscribed') {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                text-align: center;
              }
              .info {
                background: #f3f4f6;
                padding: 40px;
                border-radius: 10px;
                border: 2px solid #e5e7eb;
              }
              h1 { margin: 0 0 20px 0; color: #374151; }
            </style>
          </head>
          <body>
            <div class="info">
              <h1>Already Unsubscribed</h1>
              <p>You have already unsubscribed from our newsletter.</p>
            </div>
          </body>
        </html>
        `,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Unsubscribe
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('Error unsubscribing:', updateError);
      return new NextResponse(
        '<html><body><h1>Error</h1><p>Failed to unsubscribe. Please try again.</p></body></html>',
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              text-align: center;
            }
            .success {
              background: #f3f4f6;
              padding: 40px;
              border-radius: 10px;
              border: 2px solid #e5e7eb;
            }
            h1 { margin: 0 0 20px 0; color: #374151; }
            p { color: #6b7280; }
            a {
              color: #667eea;
              text-decoration: none;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="success">
            <h1>✓ Successfully Unsubscribed</h1>
            <p>You have been unsubscribed from our newsletter.</p>
            <p style="margin-top: 30px;">We're sorry to see you go! If you change your mind, you can always <a href="/blog">resubscribe from our blog</a>.</p>
          </div>
        </body>
      </html>
      `,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return new NextResponse(
      '<html><body><h1>Error</h1><p>An unexpected error occurred. Please try again later.</p></body></html>',
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
