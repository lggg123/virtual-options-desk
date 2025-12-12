'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  CandlestickChart,
  LineChart,
  Wallet,
  Crown,
  LogOut,
  LogIn,
  Menu,
  X,
  Newspaper,
  BookOpen,
  LucideIcon,
  BarChart3,
  DollarSign,
  Bitcoin
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Stock Picks', href: '/dashboard/ai-picks', icon: TrendingUp },
  { name: 'Virtual Options', href: '/trading', icon: CandlestickChart },
  { name: 'Futures', href: '/trading/futures', icon: BarChart3 },
  { name: 'CFDs', href: '/trading/cfd', icon: DollarSign },
  { name: 'Crypto', href: '/trading/crypto', icon: Bitcoin },
  { name: 'Learn Options', href: '/education/fundamentals', icon: BookOpen },
  { name: 'Pattern Detection', href: 'https://svelte-chart-app.vercel.app/', icon: LineChart, external: true },
  { name: 'AI Insights Blog', href: '/blog', icon: Newspaper },
  { name: 'Portfolio', href: '/portfolio', icon: Wallet },
  { name: 'Pricing', href: '/pricing', icon: Crown },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      console.log('Starting sign out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        // Even if there's an error, still redirect to clear client state
      } else {
        console.log('Sign out successful');
      }
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      // Force a hard redirect to clear all client state
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out exception:', error);
      // Force redirect anyway
      window.location.href = '/login';
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-slate-900 border-r border-slate-800">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-slate-800">
            <TrendingUp className="w-8 h-8 text-indigo-500" />
            <span className="ml-3 text-xl font-bold text-white">AI Stock Picks</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              // Use exact match for /dashboard to prevent highlighting when on child routes
              const isActive = !item.external && (
                item.href === '/dashboard'
                  ? pathname === item.href
                  : (pathname === item.href || pathname?.startsWith(item.href + '/'))
              );
              
              if (item.external) {
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-gray-300 hover:bg-slate-800 hover:text-white"
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </a>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Upgrade CTA */}
          <div className="flex-shrink-0 p-4 border-t border-slate-800">
            <Link
              href="/pricing"
              className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Pro
            </Link>
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-full px-4 py-3 mt-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center w-full px-4 py-3 mt-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center">
          <TrendingUp className="w-6 h-6 text-indigo-500" />
          <span className="ml-2 text-lg font-bold text-white">AI Stock Picks</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900 pt-16">
          <nav className="px-4 py-6 space-y-1">
            {navigation.map((item) => {
              // Use exact match for /dashboard to prevent highlighting when on child routes
              const isActive = !item.external && (
                item.href === '/dashboard'
                  ? pathname === item.href
                  : (pathname === item.href || pathname?.startsWith(item.href + '/'))
              );
              
              if (item.external) {
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors text-gray-300 hover:bg-slate-800 hover:text-white"
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </a>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-full px-4 py-3 mt-4 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Pro
            </Link>
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="flex items-center justify-center w-full px-4 py-3 mt-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 mt-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
