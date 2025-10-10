'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { TrendingUp, TrendingDown, Zap, Activity, DollarSign, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

interface SubscriptionInfo {
  plan: string;
  status: string;
  picks_limit: number;
}

export default function AIPicksPage() {
  const [picks, setPicks] = useState<StockPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    fetchAIPicks();
  }, []);

  async function fetchAIPicks() {
    try {
      // Fetch user session and subscription
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoading(false);
        return;
      }

      // Get subscription details
      const subRes = await fetch(`/api/subscription/status?user_id=${session.user.id}`);
      let plan = 'free';
      let picksLimit = 10; // Free tier default

      if (subRes.ok) {
        const subData = await subRes.json();
        plan = subData.plan || 'free';

        // Set limits based on plan
        if (plan === 'premium') {
          picksLimit = 100;
        } else if (plan === 'pro') {
          picksLimit = -1; // unlimited
        }

        setSubscription({
          plan,
          status: subData.status || 'active',
          picks_limit: picksLimit
        });
      }

      // For free tier, use a curated list of 10 popular stocks
      // For paid tiers, use ML screening
      let stocksToScreen = [];

      if (plan === 'free') {
        // Curated list of 10 popular, liquid stocks for free users
        stocksToScreen = [
          'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
          'META', 'NVDA', 'AMD', 'NFLX', 'DIS'
        ];
      } else if (plan === 'premium') {
        // Premium: 100 stocks across sectors
        stocksToScreen = [
          // Tech Giants
          'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX',
          // Semiconductors
          'AMD', 'INTC', 'QCOM', 'AVGO', 'TXN', 'MU', 'AMAT', 'TSM',
          // Software & Cloud
          'ORCL', 'ADBE', 'CRM', 'NOW', 'INTU', 'SNOW', 'WDAY', 'TEAM',
          // Finance
          'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'V', 'MA', 'PYPL',
          // Healthcare
          'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'ABT', 'LLY', 'MRK',
          // Consumer & Retail
          'WMT', 'HD', 'COST', 'TGT', 'NKE', 'SBUX', 'MCD', 'DIS',
          // Energy
          'XOM', 'CVX', 'COP', 'SLB', 'OXY', 'EOG',
          // Industrial
          'BA', 'CAT', 'GE', 'UPS', 'RTX', 'HON', 'UNP', 'DE',
          // Growth Stocks
          'PLTR', 'COIN', 'ROKU', 'SHOP', 'UBER', 'ABNB', 'DASH', 'SPOT',
          // ETFs
          'SPY', 'QQQ', 'IWM', 'DIA', 'VOO', 'VTI'
        ].slice(0, 100);
      } else {
        // Pro: unlimited (use expanded universe)
        stocksToScreen = [
          // All from premium plus more
          'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX',
          'AMD', 'INTC', 'QCOM', 'AVGO', 'TXN', 'MU', 'AMAT', 'TSM',
          'ORCL', 'ADBE', 'CRM', 'NOW', 'INTU', 'SNOW', 'WDAY', 'TEAM',
          'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'V', 'MA', 'PYPL',
          'JNJ', 'UNH', 'PFE', 'ABBV', 'TMO', 'ABT', 'LLY', 'MRK',
          'WMT', 'HD', 'COST', 'TGT', 'NKE', 'SBUX', 'MCD', 'DIS',
          'XOM', 'CVX', 'COP', 'SLB', 'OXY', 'EOG',
          'BA', 'CAT', 'GE', 'UPS', 'RTX', 'HON', 'UNP', 'DE',
          'PLTR', 'COIN', 'ROKU', 'SHOP', 'UBER', 'ABNB', 'DASH', 'SPOT',
          'SPY', 'QQQ', 'IWM', 'DIA', 'VOO', 'VTI',
          // Additional stocks for pro
          'SQ', 'PANW', 'DDOG', 'NET', 'ZS', 'CRWD', 'OKTA'
        ];
      }

      const response = await fetch('/api/ml/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols: stocksToScreen,
          threshold: 0.6
        })
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.results || [];

        // For free tier, strictly limit to 10 picks
        const limitedResults = plan === 'free' ? results.slice(0, 10) : results;
        setPicks(limitedResults);
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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-8 h-8 text-indigo-400" />
                <h1 className="text-3xl font-bold text-white">AI Stock Picks</h1>
              </div>
              <p className="text-gray-400">ML-powered stock analysis and recommendations</p>
            </div>
            {subscription && subscription.plan === 'free' && (
              <Link href="/pricing">
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                  <Lock className="w-4 h-4 mr-2" />
                  Upgrade for More Picks
                </Button>
              </Link>
            )}
          </div>

          {/* Plan Info Banner */}
          {subscription && (
            <div className={`mt-4 p-4 rounded-lg border ${
              subscription.plan === 'free'
                ? 'bg-slate-900/50 border-slate-700'
                : subscription.plan === 'premium'
                ? 'bg-purple-900/20 border-purple-700'
                : 'bg-indigo-900/20 border-indigo-700'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Current Plan</p>
                  <p className="text-lg font-semibold text-white capitalize">{subscription.plan}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">AI Picks Limit</p>
                  <p className="text-lg font-semibold text-white">
                    {subscription.picks_limit === -1 ? 'Unlimited' : `${picks.length}/${subscription.picks_limit}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Picks</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {picks.length}
                  {subscription && subscription.picks_limit !== -1 && (
                    <span className="text-sm text-gray-400 ml-2">/ {subscription.picks_limit}</span>
                  )}
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Today&apos;s Picks</h2>
              {subscription?.plan === 'free' && (
                <span className="text-sm text-gray-400">
                  Free Tier: Top 10 Stocks
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="text-gray-400 mt-4">Analyzing market data with AI...</p>
            </div>
          ) : picks.length === 0 ? (
            <div className="p-12 text-center">
              <Sparkles className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No picks available at the moment.</p>
              <p className="text-gray-500 text-sm mt-2">Check back later for fresh AI recommendations.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {picks.map((pick, index) => (
                <div key={index} className="p-6 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-gray-400">#{index + 1}</span>
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

          {/* Upgrade CTA for Free Users */}
          {subscription?.plan === 'free' && picks.length > 0 && (
            <div className="p-6 border-t border-slate-800 bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Want more AI picks?</h3>
                  <p className="text-gray-400 text-sm">Upgrade to Premium for 100 picks or Pro for unlimited access</p>
                </div>
                <Link href="/pricing">
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                    View Plans
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
