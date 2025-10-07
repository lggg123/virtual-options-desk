'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    checkAuth();
    fetchSubscription();
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchSubscription() {
    try {
      const res = await fetch('/api/payment/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  }

  async function handleSubscribe(planId: string) {
    if (!user) {
      // Redirect to sign up
      router.push('/signup?redirect=/pricing');
      return;
    }

    setLoading(planId);

    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: billingInterval === 'year' ? `${planId}_yearly` : planId 
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await res.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
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
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.id
                    ? 'Loading...'
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
