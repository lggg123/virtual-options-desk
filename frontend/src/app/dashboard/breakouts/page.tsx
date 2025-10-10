
"use client";
import { useState, useEffect } from "react";

function Notification({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
      role="alert" aria-live="assertive">
      <div className="flex items-center gap-2">
        {type === 'success' ? <span>✅</span> : <span>❌</span>}
        <span>{message}</span>
        <button className="ml-4 text-white/80 hover:text-white text-sm" onClick={onClose} aria-label="Close notification">✕</button>
      </div>
    </div>
  );
}
import { supabase } from '@/lib/supabase/client';

type Breakout = { symbol: string; breakout_prob: number };

export default function BreakoutPicksPage() {
  const [breakouts, setBreakouts] = useState<Breakout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
    setNotification(null);
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
      setNotification({ message: "Breakout picks loaded successfully!", type: "success" });
    } catch {
      setError("Failed to fetch breakout picks.");
      setNotification({ message: "Failed to fetch breakout picks.", type: "error" });
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
    <>
      <Notification message={notification?.message || ""} type={notification?.type || 'success'} onClose={() => setNotification(null)} />
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🚀</span> Breakout Picks & Analysis
            <span className="relative group cursor-pointer">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-indigo-400 inline-block">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">i</text>
              </svg>
              <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-slate-800 text-gray-200 text-xs rounded p-2 shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                Breakout picks are stocks with a high probability of significant upward movement (60-100% in a month), identified by our AI models. Available to Pro & Premium members.
              </span>
            </span>
          </h1>
          <p className="text-gray-400 mb-6 flex items-center gap-2 text-sm sm:text-base">
            Top stocks with high breakout probability.
            <span className="relative group cursor-pointer">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-indigo-400 inline-block">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">?</text>
              </svg>
              <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 bg-slate-800 text-gray-200 text-xs rounded p-2 shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                Only Pro & Premium plans can access this feature. Upgrade for unlimited picks and advanced analytics.
              </span>
            </span>
          </p>
          <button
            className="bg-indigo-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded hover:bg-indigo-700 mb-6 shadow-lg transition text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            onClick={fetchBreakouts}
            disabled={loading}
            aria-busy={loading}
            aria-label="Get Breakout Picks"
          >
            {loading ? (
              <span className="flex items-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Loading...</span>
            ) : "Get Breakout Picks"}
          </button>
          {error && (
            <div className="text-red-500 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4" role="alert" aria-live="assertive">
              <span>{error}</span>
              <button
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                onClick={fetchBreakouts}
                disabled={loading}
                aria-label="Retry fetching breakout picks"
              >
                Retry
              </button>
            </div>
          )}
          <ul className="bg-slate-900 rounded-lg border border-slate-800 divide-y divide-slate-800 shadow min-h-[200px] w-full" role="list" aria-label="Breakout picks list">
            {loading && breakouts.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="p-4 flex justify-between items-center animate-pulse">
                  <span className="bg-slate-800 h-6 w-24 rounded"></span>
                  <span className="bg-slate-800 h-6 w-16 rounded"></span>
                </li>
              ))
            ) : breakouts.length > 0 ? (
              breakouts.map((b) => (
                <li key={b.symbol} className="p-4 flex justify-between items-center hover:bg-slate-800/50 transition-colors" tabIndex={0} aria-label={`Breakout pick: ${b.symbol}, probability ${(b.breakout_prob * 100).toFixed(1)}%`}>
                  <span className="text-white font-semibold text-base sm:text-lg">{b.symbol}</span>
                  <span className="text-green-400 font-mono text-base sm:text-lg">{(b.breakout_prob * 100).toFixed(1)}%</span>
                </li>
              ))
            ) : null}
          </ul>
          {/* Future: Add more analysis sections here */}
        </div>
      </div>
    </>
  );
}
