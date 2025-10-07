'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, Activity, DollarSign } from 'lucide-react';

interface StockPick {
  symbol: string;
  name: string;
  prediction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  target_price: number;
  current_price: number;
  potential_return: number;
  reasoning: string;
}

export default function AIPicksPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIPicks();
  }, []);

  async function fetchAIPicks() {
    try {
      const response = await fetch('/api/ml/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMD', 'META', 'AMZN'],
          threshold: 0.6
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPicks(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching AI picks:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Stock Picks</h1>
          <p className="text-gray-400">ML-powered stock analysis and recommendations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Picks</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {picks.length}
                </p>
              </div>
              <Activity className="w-10 h-10 text-indigo-500" />
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Confidence</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {picks.length > 0 
                    ? `${(picks.reduce((sum, p) => sum + p.confidence, 0) / picks.length * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <Zap className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Potential Returns</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {picks.length > 0 
                    ? `+${(picks.reduce((sum, p) => sum + p.potential_return, 0) / picks.length).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* AI Picks List */}
        <div className="bg-slate-900 rounded-lg border border-slate-800">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">Today&apos;s Picks</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="text-gray-400 mt-4">Analyzing market data...</p>
            </div>
          ) : picks.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No picks available at the moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {picks.map((pick, index) => (
                <div key={index} className="p-6 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{pick.symbol}</h3>
                        <span className="text-sm text-gray-400">{pick.name}</span>
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-medium
                          ${pick.prediction === 'bullish' ? 'bg-green-500/20 text-green-400' :
                            pick.prediction === 'bearish' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'}
                        `}>
                          {pick.prediction === 'bullish' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                          {pick.prediction === 'bearish' && <TrendingDown className="w-3 h-3 inline mr-1" />}
                          {pick.prediction}
                        </span>
                      </div>

                      <p className="text-gray-400 text-sm mb-3">{pick.reasoning}</p>

                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-400">Current: </span>
                          <span className="text-white font-medium">${pick.current_price.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Target: </span>
                          <span className="text-white font-medium">${pick.target_price.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Potential: </span>
                          <span className={`font-medium ${pick.potential_return > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pick.potential_return > 0 ? '+' : ''}{pick.potential_return.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 text-right">
                      <div className="text-sm text-gray-400 mb-1">Confidence</div>
                      <div className="text-2xl font-bold text-indigo-400">
                        {(pick.confidence * 100).toFixed(0)}%
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
