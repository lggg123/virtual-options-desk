'use client';

import { useState } from 'react';

export default function SimpleDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[${timestamp}] ${message}`);
  };

  async function testBasicFetch() {
    addLog('Testing basic fetch to /api/payment/health...');
    setLoading(true);
    
    try {
      const response = await fetch('/api/payment/health');
      addLog(`Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        addLog(`✅ Success: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorText = await response.text();
        addLog(`❌ Error: ${errorText}`);
      }
    } catch (error) {
      addLog(`❌ Exception: ${error}`);
    } finally {
      setLoading(false);
    }
  }

  async function testCheckoutEndpoint() {
    addLog('Testing /api/payment/checkout with premium plan...');
    setLoading(true);
    
    try {
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: 'premium' }),
      });
      
      addLog(`Response status: ${response.status}`);
      
      const data = await response.json();
      addLog(`Response: ${JSON.stringify(data, null, 2)}`);
      
      if (response.ok) {
        addLog(`✅ Success!`);
        if (data.url) {
          addLog(`Stripe URL: ${data.url}`);
        }
      } else {
        addLog(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      addLog(`❌ Exception: ${error}`);
    } finally {
      setLoading(false);
    }
  }

  async function checkEnvironment() {
    addLog('Checking environment variables...');
    addLog(`Window location: ${window.location.href}`);
    addLog(`User agent: ${navigator.userAgent}`);
    
    // Check localStorage
    try {
      const keys = Object.keys(localStorage);
      addLog(`LocalStorage keys: ${keys.length} found`);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          addLog(`  - ${key}`);
        }
      });
    } catch (e) {
      addLog(`Cannot access localStorage: ${e}`);
    }

    // Check cookies
    addLog(`Cookies: ${document.cookie ? 'Present' : 'None'}`);
  }

  async function testPricingPageFetch() {
    addLog('Testing if we can fetch the pricing page...');
    setLoading(true);
    
    try {
      const response = await fetch('/pricing');
      addLog(`Pricing page status: ${response.status}`);
      if (response.ok) {
        addLog(`✅ Pricing page is accessible`);
      } else {
        addLog(`❌ Pricing page returned: ${response.status}`);
      }
    } catch (error) {
      addLog(`❌ Cannot fetch pricing page: ${error}`);
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
            🔍 Simple Debug Tool
          </h1>
          <p className="text-gray-400 mb-6">
            Basic diagnostic tests (no external dependencies)
          </p>

          {/* Test Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={checkEnvironment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              1. Check Environment
            </button>

            <button
              onClick={testPricingPageFetch}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              2. Test Pricing Page
            </button>

            <button
              onClick={testBasicFetch}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
            >
              3. Test Payment API Health
            </button>

            <button
              onClick={testCheckoutEndpoint}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              4. Test Checkout Endpoint
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
                    log.includes('❌') || log.includes('Error') || log.includes('Exception')
                      ? 'text-red-400' 
                      : log.includes('✅') || log.includes('Success')
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
            <h3 className="text-lg font-semibold text-white mb-2">Instructions:</h3>
            <ol className="text-gray-300 space-y-2 list-decimal list-inside text-sm">
              <li>Click each test button in order</li>
              <li>Watch the black console for errors (❌ red text)</li>
              <li>Take a screenshot of any errors</li>
              <li>Share the error messages to get help</li>
            </ol>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <a 
              href="/pricing" 
              className="text-purple-400 hover:text-purple-300 underline"
            >
              ← Back to Pricing
            </a>
            <a 
              href="/debug-subscription" 
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Full Debug Tool →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
