import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  },
  bodyLimit: 1048576, // 1MB
  trustProxy: true, // Important for Railway
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Register plugins
await fastify.register(helmet, {
  contentSecurityPolicy: false, // Disable for webhooks
  global: true,
});

await fastify.register(cors, {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '15 minutes',
});

// ==================== TYPES ====================

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
}

const PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: ['10 AI stock picks/month', 'Basic pattern detection', 'Community support'],
    stripePriceId: '', // No Stripe price for free plan
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month',
    features: [
      '100 AI stock picks/month',
      'Advanced pattern detection',
      'CrewAI market analysis',
      'Real-time alerts',
      'Priority support',
    ],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 99,
    interval: 'month',
    features: [
      'Unlimited AI stock picks',
      'All pattern detection features',
      'Unlimited CrewAI analysis',
      'Real-time streaming data',
      '200+ factor analysis',
      'API access',
      '24/7 Priority support',
    ],
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
  },
  proYear: {
    id: 'pro-yearly',
    name: 'Pro (Yearly)',
    price: 290, // 2 months free
    interval: 'year',
    features: [
      '100 AI stock picks/month',
      'Advanced pattern detection',
      'CrewAI market analysis',
      'Real-time alerts',
      'Priority support',
      '2 months free',
    ],
    stripePriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  },
  premiumYear: {
    id: 'premium-yearly',
    name: 'Premium (Yearly)',
    price: 990, // 2 months free
    interval: 'year',
    features: [
      'Unlimited AI stock picks',
      'All pattern detection features',
      'Unlimited CrewAI analysis',
      'Real-time streaming data',
      '200+ factor analysis',
      'API access',
      '24/7 Priority support',
      '2 months free',
    ],
    stripePriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID!,
  },
};

// ==================== ROUTES ====================

// Root route - welcome message
fastify.get('/', async (request, reply) => {
  reply.code(200).send({
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
    },
    stripe: {
      configured: !!process.env.STRIPE_SECRET_KEY,
      webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      priceIds: {
        premium: !!process.env.STRIPE_PREMIUM_PRICE_ID,
        pro: !!process.env.STRIPE_PRO_PRICE_ID,
        premiumYearly: !!process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
        proYearly: !!process.env.STRIPE_PRO_YEARLY_PRICE_ID
      }
    },
    supabase: {
      configured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
});

// Health check - simple and fast for Railway
fastify.get('/health', async (request, reply) => {
  reply.code(200).send({
    status: 'ok',
    service: 'payment-api',
    timestamp: new Date().toISOString(),
  });
});

// Get pricing plans
fastify.get('/api/plans', async () => {
  return {
    plans: Object.values(PLANS),
  };
});

// Create checkout session
fastify.post<{
  Body: {
    planId: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
  };
}>('/api/checkout/create', async (request, reply) => {
  const { planId, userId, successUrl, cancelUrl } = request.body;

  // Map frontend plan IDs to backend plan IDs
  const planIdMap: Record<string, string> = {
    'premium': 'premium',
    'pro': 'pro',
    'premium_yearly': 'premiumYear',
    'pro_yearly': 'proYear',
  };

  const mappedPlanId = planIdMap[planId] || planId;
  
  // Validate plan
  const plan = PLANS[mappedPlanId];
  if (!plan || mappedPlanId === 'free') {
    request.log.error({ planId, mappedPlanId }, 'Invalid plan ID');
    return reply.code(400).send({ 
      error: 'Invalid plan ID',
      requestedPlan: planId,
      availablePlans: Object.keys(PLANS)
    });
  }
  
  request.log.info({ planId, mappedPlanId, stripePriceId: plan.stripePriceId }, 'Creating checkout session');

  // Check if user already has subscription
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (existingSub) {
    return reply.code(400).send({ error: 'User already has an active subscription' });
  }

  try {
    // Check if Stripe price ID is configured
    if (!plan.stripePriceId) {
      request.log.error({ plan: mappedPlanId }, 'Stripe price ID not configured for plan');
      return reply.code(500).send({ 
        error: 'Plan not configured. Please set up Stripe price IDs.',
        plan: mappedPlanId
      });
    }

    // Log the exact price ID we're about to use
    request.log.info({ 
      stripePriceId: plan.stripePriceId,
      priceIdType: typeof plan.stripePriceId,
      priceIdLength: plan.stripePriceId.length,
      trimmedPriceId: plan.stripePriceId.trim(),
    }, 'About to create Stripe checkout with price ID');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId.trim(), // Trim any whitespace
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
        planId: mappedPlanId,
      },
      subscription_data: {
        metadata: {
          userId,
          planId: mappedPlanId,
        },
      },
    });

    request.log.info({ sessionId: session.id }, 'Checkout session created successfully');
    return { sessionId: session.id, url: session.url };
  } catch (error) {
    request.log.error({ 
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      stripePriceId: plan.stripePriceId,
      stripeKey: process.env.STRIPE_SECRET_KEY ? `${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...` : 'NOT SET'
    }, 'Failed to create checkout session');
    return reply.code(500).send({ 
      error: 'Failed to create checkout session',
      details: error instanceof Error ? error.message : String(error),
      priceIdUsed: plan.stripePriceId,
      isTestMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false
    });
  }
});

// Get subscription status
fastify.get<{
  Params: { userId: string };
}>('/api/subscription/:userId', async (request, reply) => {
  const { userId } = request.params;

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !subscription) {
    return {
      plan: 'free',
      status: 'inactive',
      features: PLANS.free.features,
    };
  }

  return {
    plan: subscription.plan_id,
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    features: PLANS[subscription.plan_id]?.features || PLANS.free.features,
  };
});

// Create portal session (for managing subscription)
fastify.post<{
  Body: {
    userId: string;
    returnUrl: string;
  };
}>('/api/portal/create', async (request, reply) => {
  const { userId, returnUrl } = request.body;

  // Get customer ID from subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (!subscription?.stripe_customer_id) {
    return reply.code(404).send({ error: 'No subscription found' });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    });

    return { url: session.url };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to create portal session' });
  }
});

// Cancel subscription
fastify.post<{
  Body: {
    userId: string;
  };
}>('/api/subscription/cancel', async (request, reply) => {
  const { userId } = request.body;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!subscription?.stripe_subscription_id) {
    return reply.code(404).send({ error: 'No active subscription found' });
  }

  try {
    // Cancel at period end (don't immediately revoke access)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Update in database
    await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('user_id', userId);

    return { success: true, message: 'Subscription will cancel at period end' };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to cancel subscription' });
  }
});

// Stripe webhook handler
fastify.post('/api/webhooks/stripe', async (request, reply) => {
  const sig = request.headers['stripe-signature'];

  if (!sig) {
    return reply.code(400).send({ error: 'No signature' });
  }

  let event: Stripe.Event;

  try {
    // Get raw body for webhook verification
    const rawBody = typeof request.body === 'string' 
      ? request.body 
      : JSON.stringify(request.body);
    
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    request.log.error(`Webhook signature verification failed: ${err}`);
    return reply.code(400).send({ error: 'Invalid signature' });
  }

  // Handle different event types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        request.log.info(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    request.log.error(`Webhook handler error: ${error}`);
    return reply.code(500).send({ error: 'Webhook handler failed' });
  }
});

// ==================== WEBHOOK HANDLERS ====================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  const subscriptionId = session.subscription as string;

  if (!userId || !planId || !subscriptionId) {
    throw new Error('Missing metadata in checkout session');
  }

  // Get full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Save to database
  await supabase.from('subscriptions').insert({
    user_id: userId,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscriptionId,
    plan_id: planId,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    throw new Error('Missing userId in subscription metadata');
  }

  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (subscriptionId) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        last_payment_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (subscriptionId) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
      })
      .eq('stripe_subscription_id', subscriptionId);
  }
}

// ==================== START SERVER ====================

const port = parseInt(process.env.PORT || '8080', 10);
const host = process.env.HOST || '0.0.0.0';

try {
  await fastify.listen({ port, host });
  fastify.log.info(`🚀 Payment API running on http://${host}:${port}`);
  fastify.log.info(`📊 Health check available at http://${host}:${port}/health`);
  fastify.log.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log Stripe configuration (masked for security)
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  fastify.log.info({
    stripeConfigured: !!stripeKey,
    stripeMode: stripeKey?.startsWith('sk_test_') ? 'TEST' : stripeKey?.startsWith('sk_live_') ? 'LIVE' : 'UNKNOWN',
    stripeKeyPrefix: stripeKey ? `${stripeKey.substring(0, 7)}...` : 'NOT SET',
    priceIds: {
      premium: process.env.STRIPE_PREMIUM_PRICE_ID ? `${process.env.STRIPE_PREMIUM_PRICE_ID.substring(0, 10)}...` : 'NOT SET',
      pro: process.env.STRIPE_PRO_PRICE_ID ? `${process.env.STRIPE_PRO_PRICE_ID.substring(0, 10)}...` : 'NOT SET',
      premiumYearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID ? `${process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID.substring(0, 10)}...` : 'NOT SET',
      proYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ? `${process.env.STRIPE_PRO_YEARLY_PRICE_ID.substring(0, 10)}...` : 'NOT SET',
    }
  }, '💳 Stripe Configuration');
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
