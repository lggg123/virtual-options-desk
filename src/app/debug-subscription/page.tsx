'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SubscriptionDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const colorClass = type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : 'text-blue-400';
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[${timestamp}] ${message}`);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    addLog('Checking authentication...');
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        addLog(`Auth error: ${error.message}`, 'error');
        return;
      }
      if (user) {
        setUser(user);
        addLog(`✅ User authenticated: ${user.email} (ID: ${user.id})`, 'success');
      } else {
        addLog('❌ No user session found', 'error');
      }
    } catch (err) {
      addLog(`Exception checking auth: ${err}`, 'error');
    }
  }

  async function testEnvironmentVars() {
    addLog('Testing environment variables...');
    addLog(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    addLog(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
    addLog(`NEXT_PUBLIC_URL: ${process.env.NEXT_PUBLIC_URL || '❌ Not set (will use default)'}`);
  }

  async function testPaymentAPIHealth() {
    addLog('Testing payment API health...');
    setLoading(true);
    try {
      // First try to reach the Next.js API route
      addLog('Step 1: Testing Next.js API route...');
      const healthResponse = await fetch('/api/payment/health', {
        method: 'GET',
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        addLog(`✅ Payment API health: ${JSON.stringify(healthData)}`, 'success');
      } else {
        addLog(`❌ Payment API health check failed: ${healthResponse.status}`, 'error');
        const errorText = await healthResponse.text();
        addLog(`Error details: ${errorText}`, 'error');
      }
    } catch (err) {
      addLog(`❌ Failed to reach payment API: ${err}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function testCheckoutEndpoint() {
    addLog('Testing checkout endpoint with premium plan...');
    setLoading(true);
    
    try {
      if (!user) {
        addLog('❌ Cannot test checkout: User not authenticated', 'error');
        return;
      }

      addLog('Step 1: Sending POST to /api/payment/checkout...');
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          planId: 'premium' 
        }),
      });

      addLog(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        addLog(`❌ Checkout failed: ${JSON.stringify(errorData)}`, 'error');
        return;
      }

      const data = await response.json();
      addLog(`✅ Checkout response: ${JSON.stringify(data, null, 2)}`, 'success');
      
      if (data.url) {
        addLog(`✅ Stripe checkout URL received: ${data.url}`, 'success');
        addLog('Would redirect to Stripe now (not doing it in debug mode)');
      } else {
        addLog('❌ No URL in response', 'error');
      }
    } catch (err) {
      addLog(`❌ Exception during checkout test: ${err}`, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function testDirectPaymentAPI() {
    addLog('Testing direct payment API call...');
    setLoading(true);
    
    try {
      if (!user) {
        addLog('❌ Cannot test: User not authenticated', 'error');
        return;
      }

      // Try to call the payment API directly (will fail due to CORS, but shows connectivity)
      const paymentApiUrl = process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://localhost:3001';
      addLog(`Attempting to reach: ${paymentApiUrl}/health`);
      
      const response = await fetch(`${paymentApiUrl}/health`);
      const data = await response.json();
      addLog(`✅ Payment API is reachable: ${JSON.stringify(data)}`, 'success');
    } catch (err) {
      addLog(`⚠️ Cannot reach payment API directly (expected if deployed): ${err}`, 'info');
      addLog('This is normal if payment API is on a different domain');
    } finally {
      setLoading(false);
    }
  }

  function clearLogs() {
    setLogs([]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">
            🔍 Subscription Debug Tool
          </h1>
          <p className="text-gray-400 mb-6">
            Use this page to diagnose subscription button issues
          </p>

          {/* User Status */}
          <div className="mb-6 p-4 bg-slate-700 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-2">User Status</h2>
            {user ? (
              <div className="text-green-400">
                ✅ Logged in as: {user.email}
                <div className="text-sm text-gray-400 mt-1">User ID: {user.id}</div>
              </div>
            ) : (
              <div className="text-red-400">
                ❌ Not logged in - <a href="/login" className="underline">Login first</a>
              </div>
            )}
          </div>

          {/* Test Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={testEnvironmentVars}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              1. Test Environment Variables
            </button>

            <button
              onClick={testPaymentAPIHealth}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              2. Test Payment API Health
            </button>

            <button
              onClick={testDirectPaymentAPI}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
            >
              3. Test Direct Payment API Connection
            </button>

            <button
              onClick={testCheckoutEndpoint}
              disabled={loading || !user}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              4. Test Full Checkout Flow (Premium)
            </button>

            <button
              onClick={clearLogs}
              className="w-full bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 font-medium"
            >
              Clear Logs
            </button>
          </div>

          {/* Logs Display */}
          <div className="bg-black rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Click a test button above to see logs...</div>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`mb-1 ${
                    log.includes('❌') || log.includes('error') || log.includes('failed') 
                      ? 'text-red-400' 
                      : log.includes('✅') || log.includes('success')
                      ? 'text-green-400'
                      : log.includes('⚠️')
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-slate-700 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">How to Use:</h3>
            <ol className="text-gray-300 space-y-2 list-decimal list-inside">
              <li>Make sure you're logged in</li>
              <li>Click each test button in order</li>
              <li>Check the logs for any ❌ errors</li>
              <li>Copy any error messages and share them if you need help</li>
            </ol>
          </div>

          <div className="mt-4 text-center">
            <a 
              href="/pricing" 
              className="text-purple-400 hover:text-purple-300 underline"
            >
              ← Back to Pricing Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
