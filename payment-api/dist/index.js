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
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
});
// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
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
const PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'month',
        features: ['10 AI stock picks/month', 'Basic pattern detection', 'Community support'],
        stripePriceId: '', // No Stripe price for free plan
    },
    premium: {
        id: 'premium',
        name: 'Premium',
        price: 29,
        interval: 'month',
        features: [
            '100 AI stock picks/month',
            'Advanced pattern detection',
            'CrewAI market analysis',
            'Real-time alerts',
            'Priority support',
        ],
        stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    },
    pro: {
        id: 'pro',
        name: 'Pro',
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
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    },
    premiumYear: {
        id: 'premium-yearly',
        name: 'Premium (Yearly)',
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
        stripePriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    },
    proYear: {
        id: 'pro-yearly',
        name: 'Pro (Yearly)',
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
        stripePriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
};
// ==================== ROUTES ====================
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
fastify.post('/api/checkout/create', async (request, reply) => {
    const { planId, userId, successUrl, cancelUrl } = request.body;
    // Validate plan
    const plan = PLANS[planId];
    if (!plan || planId === 'free') {
        return reply.code(400).send({ error: 'Invalid plan ID' });
    }
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
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: plan.stripePriceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: userId,
            metadata: {
                userId,
                planId,
            },
            subscription_data: {
                metadata: {
                    userId,
                    planId,
                },
            },
        });
        return { sessionId: session.id, url: session.url };
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to create checkout session' });
    }
});
// Get subscription status
fastify.get('/api/subscription/:userId', async (request, reply) => {
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
fastify.post('/api/portal/create', async (request, reply) => {
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
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: 'Failed to create portal session' });
    }
});
// Cancel subscription
fastify.post('/api/subscription/cancel', async (request, reply) => {
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
    }
    catch (error) {
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
    let event;
    try {
        // Get raw body for webhook verification
        const rawBody = typeof request.body === 'string'
            ? request.body
            : JSON.stringify(request.body);
        event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        request.log.error(`Webhook signature verification failed: ${err}`);
        return reply.code(400).send({ error: 'Invalid signature' });
    }
    // Handle different event types
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                await handleCheckoutCompleted(session);
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                await handleSubscriptionUpdated(subscription);
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await handleSubscriptionDeleted(subscription);
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                await handlePaymentSucceeded(invoice);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                await handlePaymentFailed(invoice);
                break;
            }
            default:
                request.log.info(`Unhandled event type: ${event.type}`);
        }
        return { received: true };
    }
    catch (error) {
        request.log.error(`Webhook handler error: ${error}`);
        return reply.code(500).send({ error: 'Webhook handler failed' });
    }
});
// ==================== WEBHOOK HANDLERS ====================
async function handleCheckoutCompleted(session) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const subscriptionId = session.subscription;
    if (!userId || !planId || !subscriptionId) {
        throw new Error('Missing metadata in checkout session');
    }
    // Get full subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    // Save to database
    await supabase.from('subscriptions').insert({
        user_id: userId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscriptionId,
        plan_id: planId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
    });
}
async function handleSubscriptionUpdated(subscription) {
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
async function handleSubscriptionDeleted(subscription) {
    await supabase
        .from('subscriptions')
        .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
    })
        .eq('stripe_subscription_id', subscription.id);
}
async function handlePaymentSucceeded(invoice) {
    const subscriptionId = invoice.subscription;
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
async function handlePaymentFailed(invoice) {
    const subscriptionId = invoice.subscription;
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
}
catch (err) {
    fastify.log.error(err);
    process.exit(1);
}
//# sourceMappingURL=index.js.map