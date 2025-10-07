'use client';

import { useState, useEffect } from 'react';
import { CandlestickChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Pattern {
  pattern_type: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  strength: number;
  timestamp: string;
}

export default function PatternsPage() {
  const [symbol, setSymbol] = useState('AAPL');
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  // Removed unused loading state
  const [connected, setConnected] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    connectToWebSocket();
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
    // Only run on symbol change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  function connectToWebSocket() {
    if (wsConnection) {
      wsConnection.close();
    }

    const ws = new WebSocket(`wss://virtual-options-desk-production.up.railway.app/ws/live/${symbol}?timeframe=1d`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'pattern_detected') {
        setPatterns(prev => [data.data, ...prev].slice(0, 10));
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setConnected(false);
    };

    setWsConnection(ws);
  }

  const patternDescriptions: Record<string, string> = {
    hammer: 'Strong reversal signal, typically bullish at bottom of downtrend',
    shooting_star: 'Bearish reversal pattern at top of uptrend',
    doji: 'Indecision in the market, potential trend change',
    engulfing: 'Strong reversal signal when one candle engulfs the previous',
    morning_star: 'Bullish reversal pattern with three candles',
    evening_star: 'Bearish reversal pattern with three candles',
    three_white_soldiers: 'Strong bullish continuation pattern',
    three_black_crows: 'Strong bearish continuation pattern',
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Pattern Detection</h1>
          <p className="text-gray-400">Real-time candlestick pattern analysis</p>
        </div>

        {/* Controls */}
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter symbol..."
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-400">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Patterns List */}
        <div className="bg-slate-900 rounded-lg border border-slate-800">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">Detected Patterns</h2>
          </div>

          {patterns.length === 0 ? (
            <div className="p-12 text-center">
              <CandlestickChart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Waiting for pattern detection...</p>
              <p className="text-gray-500 text-sm mt-2">Patterns will appear here in real-time</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {patterns.map((pattern, index) => (
                <div key={index} className="p-6 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white capitalize">
                          {pattern.pattern_type.replace(/_/g, ' ')}
                        </h3>
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                          ${pattern.direction === 'bullish' ? 'bg-green-500/20 text-green-400' :
                            pattern.direction === 'bearish' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'}
                        `}>
                          {pattern.direction === 'bullish' && <TrendingUp className="w-3 h-3" />}
                          {pattern.direction === 'bearish' && <TrendingDown className="w-3 h-3" />}
                          {pattern.direction === 'neutral' && <Minus className="w-3 h-3" />}
                          {pattern.direction}
                        </span>
                      </div>

                      <p className="text-gray-400 text-sm mb-3">
                        {patternDescriptions[pattern.pattern_type] || 'Pattern detected in recent price action'}
                      </p>

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-400">Confidence: </span>
                          <span className="text-white font-medium">{(pattern.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Strength: </span>
                          <span className="text-white font-medium">{pattern.strength}/5</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Time: </span>
                          <span className="text-white font-medium">
                            {new Date(pattern.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
