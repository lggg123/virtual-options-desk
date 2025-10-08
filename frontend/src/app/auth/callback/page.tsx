'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the hash fragment from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Check for errors in URL
        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || error);
          return;
        }

        // Verify this is an email confirmation
        if (type === 'signup' || type === 'email_change' || accessToken) {
          // Get the current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            throw sessionError;
          }

          if (session) {
            setStatus('success');
            // Wait a moment to show success message, then redirect
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          } else {
            // Try to set the session from the URL
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken!,
              refresh_token: hashParams.get('refresh_token') || ''
            });

            if (setSessionError) {
              throw setSessionError;
            }

            setStatus('success');
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          }
        } else {
          setStatus('error');
          setErrorMessage('Invalid confirmation link');
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    };

    handleEmailConfirmation();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Confirming Your Email...'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address'}
            {status === 'success' && 'Your account is now active'}
            {status === 'error' && 'There was a problem confirming your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  ✅ Your email has been confirmed! You now have access to:
                  <ul className="mt-2 space-y-1 text-left">
                    <li>• $100,000 in virtual trading funds</li>
                    <li>• AI Stock Picks</li>
                    <li>• Market Sentiment Analysis</li>
                    <li>• Virtual Options Trading</li>
                  </ul>
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Redirecting you to the dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <Alert variant="destructive">
                <AlertDescription>
                  {errorMessage || 'Unable to confirm your email. The link may be expired or invalid.'}
                </AlertDescription>
              </Alert>
              <div className="flex flex-col w-full gap-2">
                <Button asChild className="w-full">
                  <Link href="/signup">Try Signing Up Again</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
