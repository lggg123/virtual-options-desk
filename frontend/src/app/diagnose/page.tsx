'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface SupabaseUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export default function DiagnosePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      setUser(user as SupabaseUser | null);
      setLoading(false);
      if (error) console.error('Auth error:', error);
    } catch (err) {
      console.error('Error checking user:', err);
      setLoading(false);
    }
  };

  const testFetch = async () => {
    try {
      const res = await fetch('/api/payment/health');
      const data = await res.json();
      alert('Health Check Result:\n\n' + JSON.stringify(data, null, 2));
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  const testCheckout = async () => {
    if (!user) {
      alert('❌ You must be logged in to test checkout!\n\nPlease login first at /login');
      return;
    }
    
    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'premium' })
      });
      const data = await res.json();
      alert('Checkout Result (Status ' + res.status + '):\n\n' + JSON.stringify(data, null, 2));
    } catch (err) {
      alert('Error: ' + err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #1a1a2e, #16213e, #0f3460)',
      padding: '2rem',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '2rem',
        borderRadius: '12px'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          🔍 Ultra-Simple Diagnostics
        </h1>
        <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
          This page checks your authentication and payment API connection!
        </p>

        {/* User Status */}
        <div style={{
          padding: '1rem',
          backgroundColor: user ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: user ? '2px solid #4CAF50' : '2px solid #f44336'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            {loading ? '⏳ Checking...' : user ? '✅ Logged In' : '❌ Not Logged In'}
          </h2>
          {!loading && (
            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              {user ? (
                <>
                  <strong>Email:</strong> {user.email}<br/>
                  <strong>User ID:</strong> {user.id?.substring(0, 20)}...
                </>
              ) : (
                <>
                  You need to <a href="/login" style={{ color: '#4CAF50', textDecoration: 'underline' }}>login first</a> to test checkout!
                </>
              )}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={testFetch}
            style={{
              padding: '1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Test Payment API Health
          </button>

          <button
            onClick={testCheckout}
            disabled={!user}
            style={{
              padding: '1rem',
              backgroundColor: user ? '#2196F3' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: user ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              opacity: user ? 1 : 0.6
            }}
          >
            Test Checkout Endpoint {!user && '(Login Required)'}
          </button>

          <button
            onClick={() => {
              const env = {
                url: typeof window !== 'undefined' ? window.location.href : 'N/A',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
                hasLocalStorage: typeof localStorage !== 'undefined',
                hasCookies: typeof document !== 'undefined' && document.cookie !== ''
              };
              alert('Environment Info:\n\n' + JSON.stringify(env, null, 2));
            }}
            style={{
              padding: '1rem',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Check Environment
          </button>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Instructions:</h3>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li>Click each button above</li>
            <li>Read the popup alerts</li>
            <li>Take screenshots of any errors</li>
            <li>Share the error messages</li>
          </ol>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <a 
            href="/pricing" 
            style={{ color: '#4CAF50', textDecoration: 'underline' }}
          >
            ← Back to Pricing
          </a>
        </div>
      </div>
    </div>
  );
}
