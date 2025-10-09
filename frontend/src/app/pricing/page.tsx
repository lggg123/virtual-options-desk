'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Perfect for getting started',
    icon: <Sparkles className="w-6 h-6" />,
    features: [
      '10 AI stock picks per month',
      'Basic pattern detection',
      'Community support',
      'Email alerts',
      'Mobile app access'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29,
    interval: 'month',
    description: 'For serious traders',
    icon: <Zap className="w-6 h-6" />,
    popular: true,
    features: [
      '100 AI stock picks per month',
      'Advanced pattern detection',
      'ML-powered screening',
      'Real-time alerts',
      'Priority email support',
      'Historical analysis',
      'Custom watchlists'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    interval: 'month',
    description: 'For professional traders',
    icon: <Crown className="w-6 h-6" />,
    features: [
      'Unlimited AI stock picks',
      'Full API access',
      'Advanced ML screening (200+ factors)',
      'Real-time pattern detection',
      'Priority support (24/7)',
      'Custom indicators',
      'Backtesting tools',
      'Portfolio analytics',
      'Export to CSV/Excel'
    ]
  }
];

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Auth check error:', error);
          setUser(null);
          return;
        }
        setUser(user);
        
        // Only fetch subscription if user is authenticated
        if (user) {
          await fetchSubscription();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    }
    
    checkAuth();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch('/api/payment/subscription', {
        credentials: 'include', // Important: include cookies
      });
      
      if (res.status === 401) {
        // User not authenticated, clear user state
        setUser(null);
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  }

  async function handleSubscribe(planId: string) {
    console.log('🛒 handleSubscribe called with planId:', planId);
    console.log('👤 Current user:', user);
    
    if (!user) {
      // Redirect to login
      console.log('❌ No user authenticated, redirecting to login');
      alert('Please log in to subscribe');
      router.push('/login?redirect=/pricing');
      return;
    }

    setLoading(planId);
    console.log('⏳ Loading state set for plan:', planId);

    try {
      const finalPlanId = billingInterval === 'year' ? `${planId}_yearly` : planId;
      console.log('📦 Sending checkout request for plan:', finalPlanId);
      console.log('🍪 Including credentials in request');
      
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: include cookies for auth
        body: JSON.stringify({ 
          planId: finalPlanId
        })
      });

      console.log('📡 Checkout response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Checkout error response:', errorData);
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      console.log('✅ Checkout response data:', data);
      
      if (!data.url) {
        console.error('❌ No URL in response:', data);
        throw new Error('No checkout URL received from server');
      }

      // Redirect to Stripe Checkout
      console.log('🚀 Redirecting to Stripe checkout:', data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error('💥 Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout. Please try again.';
      alert(`❌ Checkout Error:\n\n${errorMessage}\n\nPlease check:\n1. You are logged in\n2. Browser console (F12) for details\n3. Payment API is running`);
      setLoading(null);
    }
  }

  async function handleManageSubscription() {
    setLoading('manage');

    try {
      const res = await fetch('/api/payment/portal', { 
        method: 'POST' 
      });

      if (!res.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal. Please try again.');
      setLoading(null);
    }
  }

  function getYearlyPrice(monthlyPrice: number) {
    return monthlyPrice * 10; // 2 months free
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Trading Edge
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            AI-powered stock analysis and pattern detection for smarter trading
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-slate-800 rounded-full p-1">
            <button
              onClick={() => setBillingInterval('month')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingInterval === 'month'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingInterval === 'year'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Current Subscription Banner */}
        {subscription && subscription.plan !== 'free' && (
          <div className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">
                  Current Plan: {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                </h3>
                <p className="text-purple-100">
                  Status: {subscription.status}
                  {subscription.cancelAtPeriodEnd && ' (Cancels at period end)'}
                </p>
              </div>
              <button
                onClick={handleManageSubscription}
                disabled={loading === 'manage'}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {loading === 'manage' ? 'Loading...' : 'Manage Subscription'}
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.id;
            const displayPrice = billingInterval === 'year' && plan.price > 0
              ? getYearlyPrice(plan.price)
              : plan.price;
            const pricePerMonth = billingInterval === 'year' && plan.price > 0
              ? displayPrice / 12
              : displayPrice;

            return (
              <div
                key={plan.id}
                className={`relative bg-slate-800 rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
                  plan.popular
                    ? 'border-purple-500 shadow-xl shadow-purple-500/20'
                    : 'border-slate-700'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="mb-4 text-purple-400">
                  {plan.icon}
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>

                {/* Description */}
                <p className="text-gray-400 mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-white">
                      ${displayPrice}
                    </span>
                    <span className="text-gray-400 ml-2">
                      /{billingInterval}
                    </span>
                  </div>
                  {billingInterval === 'year' && plan.price > 0 && (
                    <p className="text-sm text-green-400 mt-1">
                      ${pricePerMonth.toFixed(2)}/month
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => plan.id === 'free' ? router.push('/signup') : handleSubscribe(plan.id)}
                  disabled={loading === plan.id || isCurrentPlan}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all transform duration-200 ${
                    isCurrentPlan
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 text-white active:scale-100'
                      : plan.id === 'pro'
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/50 text-white active:scale-100'
                      : 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 hover:scale-105 hover:shadow-xl hover:shadow-slate-500/30 text-white active:scale-100'
                  } ${loading === plan.id ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {loading === plan.id
                    ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </span>
                    )
                    : isCurrentPlan
                    ? 'Current Plan'
                    : plan.id === 'free'
                    ? 'Get Started Free'
                    : 'Subscribe Now'}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the end of your billing period for downgrades.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-400">
                We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processor.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-400">
                Our Free plan is available forever with 10 AI picks per month. You can upgrade to Premium or Pro anytime to unlock more features.
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                What&apos;s your refund policy?
              </h3>
              <p className="text-gray-400">
                We offer a 14-day money-back guarantee on all paid plans. If you&apos;re not satisfied, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center space-x-8 text-gray-400">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-400 mr-2" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-400 mr-2" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-400 mr-2" />
              <span>14-Day Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
