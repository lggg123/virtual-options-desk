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
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse(
        '<html><body><h1>Invalid confirmation link</h1><p>The confirmation token is missing.</p></body></html>',
        { status: 400, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Find subscriber with this token
    const { data: subscriber, error: fetchError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('confirmation_token', token)
      .single();

    if (fetchError || !subscriber) {
      return new NextResponse(
        '<html><body><h1>Invalid confirmation link</h1><p>This confirmation link is invalid or has expired.</p></body></html>',
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (subscriber.status === 'confirmed') {
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px;
                border-radius: 10px;
              }
              h1 { margin: 0 0 20px 0; }
              a {
                color: white;
                background: rgba(255,255,255,0.2);
                padding: 10px 30px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="success">
              <h1>✓ Already Subscribed!</h1>
              <p>Your email is already confirmed. You're all set to receive our daily market insights.</p>
              <a href="/blog">Visit Our Blog</a>
            </div>
          </body>
        </html>
        `,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Confirm subscription
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmation_token: null,
      })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('Error confirming subscription:', updateError);
      return new NextResponse(
        '<html><body><h1>Error</h1><p>Failed to confirm subscription. Please try again.</p></body></html>',
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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              border-radius: 10px;
            }
            h1 { margin: 0 0 20px 0; }
            a {
              color: white;
              background: rgba(255,255,255,0.2);
              padding: 10px 30px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="success">
            <h1>✓ Subscription Confirmed!</h1>
            <p>Thank you for subscribing! You'll now receive daily AI-powered market insights and trading strategies.</p>
            <a href="/blog">Visit Our Blog</a>
          </div>
        </body>
      </html>
      `,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('Newsletter confirmation error:', error);
    return new NextResponse(
      '<html><body><h1>Error</h1><p>An unexpected error occurred. Please try again later.</p></body></html>',
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
