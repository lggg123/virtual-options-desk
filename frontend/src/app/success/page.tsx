'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-green-500 rounded-full p-4">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Welcome to Premium!
        </h1>
        <p className="text-gray-300 mb-8">
          Your subscription has been successfully activated. Get ready to unlock the full power of AI-driven trading insights.
        </p>

        {/* Session Info */}
        {sessionId && (
          <div className="bg-slate-700 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-400 mb-1">Session ID</p>
            <p className="text-sm text-gray-300 font-mono break-all">
              {sessionId}
            </p>
          </div>
        )}

        {/* What&apos;s Next */}
        <div className="text-left mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            What&apos;s Next?
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-sm">
                Access your personalized dashboard
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-sm">
                Start receiving AI-powered stock picks
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-sm">
                Set up your watchlist and alerts
              </span>
            </li>
          </ul>
        </div>

        {/* Redirect Info */}
        <p className="text-sm text-gray-400 mb-6">
          Redirecting to dashboard in {countdown} seconds...
        </p>

        {/* CTA Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>

        {/* Support Link */}
        <p className="text-sm text-gray-400 mt-6">
          Need help?{' '}
          <a
            href="/support"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
