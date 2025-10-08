'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3, BookOpen, Users, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setLoading(false);
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/20 backdrop-blur-md z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                OptionSim
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {!loading && (
                <>
                  {isAuthenticated ? (
                    <>
                      <Link href="/dashboard" className="hover:text-gray-300 transition">
                        Dashboard
                      </Link>
                      <Link href="/trading" className="hover:text-gray-300 transition">
                        Trade
                      </Link>
                      <Link href="/portfolio" className="hover:text-gray-300 transition">
                        Portfolio
                      </Link>
                      <button
                        onClick={() => supabase.auth.signOut()}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="hover:text-gray-300 transition">
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-md transition"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8 inline-flex items-center px-3 py-1 rounded-full bg-purple-900/30 border border-purple-700/50">
            <Zap className="w-4 h-4 mr-2 text-purple-400" />
            <span className="text-sm text-purple-300">Real-time options pricing with Black-Scholes</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Master Options Trading
            <br />Without the Risk
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Practice options strategies, understand Greeks, and build your trading skills with $100,000 
            in virtual capital. Real market dynamics, zero financial risk.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-lg flex items-center justify-center transition transform hover:scale-105"
            >
              Start Trading Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <Link
              href="#features"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold text-lg transition"
            >
              Learn More
            </Link>
          </div>
          
          {/* Live Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <TrendingUp className="w-8 h-8 text-green-500 mb-2 mx-auto" />
              <h3 className="text-2xl font-bold">24/7</h3>
              <p className="text-gray-400">Market Simulation</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <DollarSign className="w-8 h-8 text-blue-500 mb-2 mx-auto" />
              <h3 className="text-2xl font-bold">$100K</h3>
              <p className="text-gray-400">Starting Capital</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <BarChart3 className="w-8 h-8 text-purple-500 mb-2 mx-auto" />
              <h3 className="text-2xl font-bold">Real-time</h3>
              <p className="text-gray-400">Greeks & Analytics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Everything You Need to
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {' '}Master Options
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Real-time Pricing"
              description="Black-Scholes pricing engine with live Greeks calculation. See how option prices change with market movements."
              gradient="from-green-600 to-emerald-600"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="Risk-Free Trading"
              description="Practice with virtual money. Test strategies, learn from mistakes, all without risking real capital."
              gradient="from-blue-600 to-cyan-600"
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Advanced Analytics"
              description="Track your P&L, analyze your trades, and understand your risk exposure with professional tools."
              gradient="from-purple-600 to-pink-600"
            />
            <FeatureCard
              icon={<BookOpen className="w-8 h-8" />}
              title="Educational Resources"
              description="Learn options strategies, understand the Greeks, and master volatility with built-in tutorials."
              gradient="from-orange-600 to-red-600"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Multi-leg Strategies"
              description="Build complex strategies like iron condors, butterflies, and custom spreads with ease."
              gradient="from-yellow-600 to-orange-600"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Compete & Learn"
              description="Join trading competitions, compare strategies with others, and climb the leaderboard."
              gradient="from-indigo-600 to-purple-600"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StepCard
              step="1"
              title="Sign Up"
              description="Create your free account and get $100,000 in virtual capital instantly."
            />
            <StepCard
              step="2"
              title="Explore Markets"
              description="Browse options chains, analyze prices, and study the Greeks in real-time."
            />
            <StepCard
              step="3"
              title="Place Trades"
              description="Buy and sell options, build strategies, and manage your portfolio."
            />
            <StepCard
              step="4"
              title="Track & Learn"
              description="Monitor your performance, learn from trades, and improve your skills."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Options Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of traders learning options the smart way.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-xl flex items-center justify-center mx-auto transition transform hover:scale-105"
          >
            Get Started for Free
            <ArrowRight className="ml-3 w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          {/* Footer Links */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/dashboard/ai-picks" className="text-gray-400 hover:text-white transition-colors">AI Stock Picks</Link></li>
                <li><Link href="/dashboard/patterns" className="text-gray-400 hover:text-white transition-colors">Pattern Detection</Link></li>
                <li><Link href="/trading" className="text-gray-400 hover:text-white transition-colors">Virtual Trading</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/dashboard/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-center text-gray-400 pt-8 border-t border-gray-800">
            <p>&copy; 2025 AI Stock Picks. All rights reserved.</p>
            <p className="mt-2 text-sm">
              This platform provides AI-driven market analysis for educational and informational purposes only. Not investment advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ 
  icon, 
  title, 
  description, 
  gradient 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  gradient: string;
}) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all hover:transform hover:scale-105">
      <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 text-white`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

// Step Card Component
function StepCard({ 
  step, 
  title, 
  description 
}: { 
  step: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold mb-4 mx-auto">
        {step}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}