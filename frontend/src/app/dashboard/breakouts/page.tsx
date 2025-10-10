
"use client";
import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase/client';

type Breakout = { symbol: string; breakout_prob: number };

export default function BreakoutPicksPage() {
  const [breakouts, setBreakouts] = useState<Breakout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlan() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const res = await fetch(`/api/subscription/status?user_id=${session.user.id}`);
        if (res.ok) {
          const sub = await res.json();
          setPlan(sub.plan || 'free');
        } else {
          setPlan('free');
        }
      } else {
        setPlan('free');
      }
    }
    fetchPlan();
  }, []);

  async function fetchBreakouts() {
    setLoading(true);
    setError("");
    const stocks = [
      { symbol: "AAPL", open: 170, high: 175, low: 169, close: 174, volume: 100000000 },
      { symbol: "TSLA", open: 250, high: 260, low: 248, close: 259, volume: 80000000 },
      // ...more stocks
    ];
    try {
      const res = await fetch("/api/ml/breakouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stocks, top_n: 10 }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setBreakouts(data.breakouts || []);
    } catch (e) {
      setError("Failed to fetch breakout picks.");
    } finally {
      setLoading(false);
    }
  }

  if (plan === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <span className="text-gray-400 text-lg">Checking subscription...</span>
      </div>
    );
  }
  if (plan !== 'pro' && plan !== 'premium') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="bg-slate-900 p-8 rounded-lg border border-slate-800 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Breakout Picks & Analysis</h2>
          <p className="text-gray-400 mb-4">This feature is available for Pro and Premium members only.</p>
          <a href="/pricing" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Upgrade Now</a>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-2">
          <span>🚀</span> Breakout Picks & Analysis
        </h1>
        <p className="text-gray-400 mb-6">Top stocks with high breakout probability. (Pro & Premium only)</p>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 mb-6 shadow-lg transition"
          onClick={fetchBreakouts}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Loading...</span>
          ) : "Get Breakout Picks"}
        </button>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <ul className="bg-slate-900 rounded-lg border border-slate-800 divide-y divide-slate-800 shadow">
          {breakouts.map((b) => (
            <li key={b.symbol} className="p-4 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
              <span className="text-white font-semibold text-lg">{b.symbol}</span>
              <span className="text-green-400 font-mono text-lg">{(b.breakout_prob * 100).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
        {/* Future: Add more analysis sections here */}
      </div>
    </div>
  );
}
