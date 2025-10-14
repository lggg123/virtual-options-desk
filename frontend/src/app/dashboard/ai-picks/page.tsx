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
  const [liveQuotes, setLiveQuotes] = useState<Record<string, { price?: number; change?: number; volume?: number }> >({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAIPicks();
  }, []);

  async function fetchAIPicks() {
    setError(null);
    try {
      // Fetch user session and subscription
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError('Error fetching session: ' + sessionError.message);
        setLoading(false);
        return;
      }
      if (!session?.user) {
        setError('You must be logged in to view AI Picks.');
        setLoading(false);
        return;
      }
      console.log('[AIPicks] User session:', session.user);

      // Get subscription details
      let plan = 'free';
      let picksLimit = 10; // Free tier default
      let subStatus = 'inactive';
      try {
        const subRes = await fetch(`/api/subscription/status?user_id=${session.user.id}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          plan = subData.plan || 'free';
          subStatus = subData.status || 'active';
          // Set limits based on plan
          if (plan === 'premium') {
            picksLimit = 50;
          } else if (plan === 'pro') {
            picksLimit = 25;
          }
          setSubscription({ plan, status: subStatus, picks_limit: picksLimit });
          console.log('[AIPicks] Subscription:', { plan, subStatus, picksLimit });
        } else {
          setSubscription({ plan: 'free', status: 'inactive', picks_limit: 10 });
          setError('Could not fetch subscription status. Defaulting to Free plan.');
          console.warn('[AIPicks] Subscription API error:', subRes.status);
        }
      } catch (subErr) {
        setSubscription({ plan: 'free', status: 'inactive', picks_limit: 10 });
        setError('Error fetching subscription. Defaulting to Free plan.');
        console.error('[AIPicks] Subscription fetch error:', subErr);
      }

      // Fetch picks from new tiered API endpoints
      let apiUrl = '/api/ai-picks/free';
      if (plan === 'pro') apiUrl = '/api/ai-picks/pro';
      if (plan === 'premium') apiUrl = '/api/ai-picks/premium';
      try {
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          setPicks(data.picks || []);
          console.log('[AIPicks] Picks:', data.picks);
        } else {
          setError('Failed to fetch AI picks. API error: ' + response.status);
          setPicks([]);
          console.error('[AIPicks] Picks API error:', response.status);
        }
      } catch (picksErr) {
        setError('Error fetching AI picks.');
        setPicks([]);
        console.error('[AIPicks] Picks fetch error:', picksErr);
      }
    } catch (error) {
      setError('Unexpected error: ' + (error instanceof Error ? error.message : String(error)));
      setPicks([]);
      console.error('[AIPicks] Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  }

  // Fetch live quotes for all picks when picks change
  useEffect(() => {
    if (!picks.length) return;
    let cancelled = false;
    async function fetchQuotes() {
      const results: Record<string, { price?: number; change?: number; volume?: number }> = {};
      await Promise.all(
        picks.map(async (pick) => {
          try {
            const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(pick.symbol)}`);
            if (!res.ok) return;
            const data = await res.json();
            results[pick.symbol] = {
              price: data.regularMarketPrice,
              change: data.regularMarketChangePercent,
              volume: data.regularMarketVolume,
            };
          } catch (err) {
            console.warn('[AIPicks] Live quote fetch error:', err);
          }
        })
      );
      if (!cancelled) setLiveQuotes(results);
    }
    fetchQuotes();
    return () => { cancelled = true; };
  }, [picks]);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/80 border border-red-700 text-red-200 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}
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
              {picks.map((pick, index) => {
                const quote = liveQuotes[pick.symbol];
                return (
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

                        <div className="flex items-center gap-6 text-sm flex-wrap">
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
                          {/* Live quote info */}
                          <div>
                            <span className="text-gray-400">Live Price: </span>
                            <span className="text-white font-semibold">{quote && quote.price !== undefined ? `$${quote.price.toFixed(2)}` : '--'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Change: </span>
                            <span className={quote && quote.change !== undefined ? (quote.change >= 0 ? 'text-green-500' : 'text-red-500') : ''}>
                              {quote && quote.change !== undefined ? `${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)}%` : '--'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Vol: </span>
                            <span className="text-white font-semibold">{quote && quote.volume !== undefined ? quote.volume.toLocaleString() : '--'}</span>
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
                );
              })}
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
