'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsConfirmation(false);
    setResendSuccess(false);

    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', { data, error });

      if (error) {
        console.error('Supabase auth error:', error);
        // Check if it's an email confirmation error
        if (error.message.toLowerCase().includes('email not confirmed') || 
            error.message.toLowerCase().includes('confirm your email')) {
          setNeedsConfirmation(true);
          setError('Please confirm your email address before signing in. Check your inbox for the confirmation link.');
          return;
        }
        throw error;
      }

      if (!data.session || !data.user) {
        console.error('No session or user returned:', data);
        setError('Login failed: No session created. Please try again or contact support.');
        return;
      }

      console.log('Login successful, session established:', {
        userId: data.user.id,
        sessionId: data.session.access_token.substring(0, 20) + '...'
      });
      
      // Small delay to ensure cookies are properly set before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Redirecting to dashboard...');
      // Force page reload to ensure middleware picks up new session
      window.location.href = '/dashboard';
    } catch (error: unknown) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setResendingEmail(true);
    setError(null);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setResendSuccess(true);
      setNeedsConfirmation(false);
    } catch (error: unknown) {
      console.error('Resend error:', error);
      setError(error instanceof Error ? error.message : 'Failed to resend confirmation email');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {resendSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <Mail className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Confirmation email sent! Check your inbox and click the link to verify your account.
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>

      {needsConfirmation && (
        <Button 
          type="button" 
          variant="outline" 
          className="w-full" 
          onClick={handleResendConfirmation}
          disabled={resendingEmail}
        >
          {resendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {resendingEmail ? 'Sending...' : 'Resend Confirmation Email'}
        </Button>
      )}
    </form>
  );
}