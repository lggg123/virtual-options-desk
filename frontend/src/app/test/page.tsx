'use client';

import { useState } from 'react';

export default function TestPage() {
  const [symbol, setSymbol] = useState('AAPL');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching price');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅ Test Page Works!</h1>
      <p>If you can see this, routing is working correctly.</p>
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#16213e', borderRadius: '8px' }}>
        <h2>Quick Tests:</h2>
        <button 
          onClick={() => {
            console.log('Button clicked!');
            alert('JavaScript is working!');
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0f3460',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem',
            marginRight: '1rem'
          }}
        >
          Test Button
        </button>
        <input
          value={symbol}
          onChange={e => setSymbol(e.target.value)}
          style={{
            marginLeft: '0.5rem',
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #0f3460',
            background: '#0f3460',
            color: 'white',
            width: '100px'
          }}
        />
        <button
          onClick={fetchPrice}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#00d4ff',
            color: '#16213e',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '0.5rem'
          }}
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Fetch Price'}
        </button>
        {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
        {result && (
          <div style={{ marginTop: '1rem', color: '#00ffae' }}>
            <strong>{result.symbol}</strong>: ${result.regularMarketPrice} <br />
            Change: {result.regularMarketChange} ({result.regularMarketChangePercent.toFixed(2)}%)
          </div>
        )}
        <div style={{ marginTop: '1rem' }}>
          <a href="/pricing" style={{ color: '#00d4ff' }}>← Go to Pricing</a>
          {' | '}
          <a href="/debug-simple" style={{ color: '#00d4ff' }}>Go to Simple Debug →</a>
        </div>
      </div>
    </div>
  );
}
