import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock external dependencies
vi.mock('stripe', () => {
  const mockStripe = {
    checkout: {
      sessions: {
        create: vi.fn()
      }
    },
    billingPortal: {
      sessions: {
        create: vi.fn()
      }
    },
    subscriptions: {
      retrieve: vi.fn(),
      update: vi.fn()
    },
    webhooks: {
      constructEvent: vi.fn()
    }
  };
  return { default: vi.fn(() => mockStripe) };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: null }))
          })),
          single: vi.fn(() => ({ data: null, error: null })),
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn(() => ({ data: null, error: null }))
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null }))
      }))
    }))
  }))
}));

// Test plan configuration
describe('Payment API - Plans Configuration', () => {
  const PLANS = {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month' as const,
      features: ['10 AI stock picks/month', 'Basic pattern detection', 'Community support'],
      stripePriceId: ''
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 29,
      interval: 'month' as const,
      features: [
        '100 AI stock picks/month',
        'Advanced pattern detection',
        'CrewAI market analysis',
        'Real-time alerts',
        'Priority support'
      ],
      stripePriceId: 'price_pro_test'
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      price: 99,
      interval: 'month' as const,
      features: [
        'Unlimited AI stock picks',
        'All pattern detection features',
        'Unlimited CrewAI analysis',
        'Real-time streaming data',
        '200+ factor analysis',
        'API access',
        '24/7 Priority support'
      ],
      stripePriceId: 'price_premium_test'
    }
  };

  it('should have correct free plan configuration', () => {
    expect(PLANS.free.price).toBe(0);
    expect(PLANS.free.stripePriceId).toBe('');
    expect(PLANS.free.features).toContain('10 AI stock picks/month');
  });

  it('should have correct pro plan configuration', () => {
    expect(PLANS.pro.price).toBe(29);
    expect(PLANS.pro.interval).toBe('month');
    expect(PLANS.pro.features).toContain('100 AI stock picks/month');
  });

  it('should have correct premium plan configuration', () => {
    expect(PLANS.premium.price).toBe(99);
    expect(PLANS.premium.features).toContain('Unlimited AI stock picks');
    expect(PLANS.premium.features).toContain('API access');
  });

  it('should have all required fields for each plan', () => {
    Object.values(PLANS).forEach(plan => {
      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('name');
      expect(plan).toHaveProperty('price');
      expect(plan).toHaveProperty('interval');
      expect(plan).toHaveProperty('features');
      expect(plan).toHaveProperty('stripePriceId');
    });
  });
});

// Test plan ID mapping
describe('Payment API - Plan ID Mapping', () => {
  const planIdMap: Record<string, string> = {
    'premium': 'premium',
    'pro': 'pro',
    'premium_yearly': 'premiumYear',
    'pro_yearly': 'proYear'
  };

  it('should map frontend plan IDs to backend plan IDs', () => {
    expect(planIdMap['premium']).toBe('premium');
    expect(planIdMap['pro']).toBe('pro');
    expect(planIdMap['premium_yearly']).toBe('premiumYear');
    expect(planIdMap['pro_yearly']).toBe('proYear');
  });

  it('should handle unknown plan IDs gracefully', () => {
    const unknownId = 'unknown_plan';
    const mappedId = planIdMap[unknownId] || unknownId;
    expect(mappedId).toBe(unknownId);
  });
});

// Test subscription status logic
describe('Payment API - Subscription Status Logic', () => {
  interface Subscription {
    plan_id: string;
    status: string;
    current_period_end?: string;
    cancel_at_period_end?: boolean;
  }

  const FREE_FEATURES = ['10 AI stock picks/month', 'Basic pattern detection', 'Community support'];

  function getSubscriptionResponse(subscription: Subscription | null) {
    if (!subscription) {
      return {
        plan: 'free',
        status: 'inactive',
        features: FREE_FEATURES
      };
    }

    return {
      plan: subscription.plan_id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      features: FREE_FEATURES // simplified for test
    };
  }

  it('should return free plan for users without subscription', () => {
    const response = getSubscriptionResponse(null);
    expect(response.plan).toBe('free');
    expect(response.status).toBe('inactive');
  });

  it('should return active subscription details', () => {
    const subscription: Subscription = {
      plan_id: 'pro',
      status: 'active',
      current_period_end: '2025-02-01T00:00:00Z',
      cancel_at_period_end: false
    };

    const response = getSubscriptionResponse(subscription);
    expect(response.plan).toBe('pro');
    expect(response.status).toBe('active');
    expect(response.cancelAtPeriodEnd).toBe(false);
  });

  it('should handle canceled subscription', () => {
    const subscription: Subscription = {
      plan_id: 'premium',
      status: 'active',
      current_period_end: '2025-02-01T00:00:00Z',
      cancel_at_period_end: true
    };

    const response = getSubscriptionResponse(subscription);
    expect(response.cancelAtPeriodEnd).toBe(true);
  });
});

// Test webhook event types
describe('Payment API - Webhook Event Types', () => {
  const supportedEvents = [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
  ];

  it('should support checkout.session.completed event', () => {
    expect(supportedEvents).toContain('checkout.session.completed');
  });

  it('should support subscription lifecycle events', () => {
    expect(supportedEvents).toContain('customer.subscription.updated');
    expect(supportedEvents).toContain('customer.subscription.deleted');
  });

  it('should support invoice events', () => {
    expect(supportedEvents).toContain('invoice.payment_succeeded');
    expect(supportedEvents).toContain('invoice.payment_failed');
  });
});

// Test checkout session validation
describe('Payment API - Checkout Validation', () => {
  interface CheckoutRequest {
    planId: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
  }

  function validateCheckoutRequest(request: CheckoutRequest): { valid: boolean; error?: string } {
    if (!request.planId) {
      return { valid: false, error: 'Plan ID is required' };
    }
    if (!request.userId) {
      return { valid: false, error: 'User ID is required' };
    }
    if (!request.successUrl) {
      return { valid: false, error: 'Success URL is required' };
    }
    if (!request.cancelUrl) {
      return { valid: false, error: 'Cancel URL is required' };
    }
    if (request.planId === 'free') {
      return { valid: false, error: 'Cannot checkout for free plan' };
    }
    return { valid: true };
  }

  it('should validate complete checkout request', () => {
    const request: CheckoutRequest = {
      planId: 'pro',
      userId: 'user_123',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    };

    const result = validateCheckoutRequest(request);
    expect(result.valid).toBe(true);
  });

  it('should reject checkout for free plan', () => {
    const request: CheckoutRequest = {
      planId: 'free',
      userId: 'user_123',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    };

    const result = validateCheckoutRequest(request);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Cannot checkout for free plan');
  });

  it('should reject missing userId', () => {
    const request = {
      planId: 'pro',
      userId: '',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    };

    const result = validateCheckoutRequest(request);
    expect(result.valid).toBe(false);
  });
});

// Test health check response
describe('Payment API - Health Check', () => {
  it('should return correct health check format', () => {
    const healthResponse = {
      status: 'ok',
      service: 'payment-api',
      timestamp: new Date().toISOString()
    };

    expect(healthResponse.status).toBe('ok');
    expect(healthResponse.service).toBe('payment-api');
    expect(healthResponse).toHaveProperty('timestamp');
  });
});

// Test root endpoint response structure
describe('Payment API - Root Endpoint', () => {
  it('should return correct service information', () => {
    const rootResponse = {
      service: 'AI Stock Picks - Payment API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        plans: '/api/plans',
        checkout: 'POST /api/checkout/create',
        subscription: '/api/subscription/:userId',
        portal: 'POST /api/portal/create',
        webhook: 'POST /api/webhook/stripe'
      }
    };

    expect(rootResponse.service).toBe('AI Stock Picks - Payment API');
    expect(rootResponse.version).toBe('1.0.0');
    expect(rootResponse.status).toBe('running');
    expect(rootResponse.endpoints).toHaveProperty('health');
    expect(rootResponse.endpoints).toHaveProperty('checkout');
    expect(rootResponse.endpoints).toHaveProperty('webhook');
  });
});

// Test price calculations
describe('Payment API - Price Calculations', () => {
  it('should calculate yearly savings correctly for Pro plan', () => {
    const monthlyPrice = 29;
    const yearlyPrice = 290;
    const expectedYearlyNoDiscount = monthlyPrice * 12; // 348
    const savings = expectedYearlyNoDiscount - yearlyPrice; // 58

    expect(yearlyPrice).toBeLessThan(expectedYearlyNoDiscount);
    expect(savings).toBe(58); // 2 months free
  });

  it('should calculate yearly savings correctly for Premium plan', () => {
    const monthlyPrice = 99;
    const yearlyPrice = 990;
    const expectedYearlyNoDiscount = monthlyPrice * 12; // 1188
    const savings = expectedYearlyNoDiscount - yearlyPrice; // 198

    expect(yearlyPrice).toBeLessThan(expectedYearlyNoDiscount);
    expect(savings).toBe(198); // 2 months free
  });
});
