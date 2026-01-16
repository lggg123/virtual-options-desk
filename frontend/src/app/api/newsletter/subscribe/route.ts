import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { Database } from '@/lib/types';
import crypto from 'crypto';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      if (existing.status === 'confirmed') {
        return NextResponse.json(
          { message: 'Email already subscribed' },
          { status: 200 }
        );
      } else if (existing.status === 'unsubscribed') {
        // Re-subscribe
        const confirmationToken = crypto.randomBytes(32).toString('hex');

        await supabase
          .from('newsletter_subscribers')
          .update({
            status: 'pending',
            confirmation_token: confirmationToken,
            unsubscribed_at: null,
          })
          .eq('email', email);

        // Send confirmation email
        await sendConfirmationEmail(email, confirmationToken);

        return NextResponse.json({
          message: 'Confirmation email sent. Please check your inbox.',
        });
      } else {
        // Already pending
        return NextResponse.json(
          { message: 'Confirmation email already sent. Please check your inbox.' },
          { status: 200 }
        );
      }
    }

    // Create new subscriber
    const confirmationToken = crypto.randomBytes(32).toString('hex');

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email,
        status: 'pending',
        confirmation_token: confirmationToken,
      });

    if (error) {
      console.error('Error creating subscriber:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    // Send confirmation email
    await sendConfirmationEmail(email, confirmationToken);

    return NextResponse.json({
      message: 'Confirmation email sent. Please check your inbox.',
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendConfirmationEmail(email: string, token: string) {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000';
  const confirmUrl = `${protocol}://${host}/api/newsletter/confirm?token=${token}`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: 'Confirm Your Newsletter Subscription',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AI Market Insights!</h1>
            </div>

            <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for subscribing to our daily market analysis newsletter!
              </p>

              <p style="font-size: 16px; margin-bottom: 30px;">
                You'll receive AI-powered market insights, trading strategies, and options analysis delivered straight to your inbox.
              </p>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${confirmUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Confirm Subscription
                </a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 12px; color: #999; word-break: break-all;">
                ${confirmUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

              <p style="font-size: 12px; color: #999; text-align: center;">
                If you didn't subscribe to this newsletter, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
}
