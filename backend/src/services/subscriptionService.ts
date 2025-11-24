import { StripeService } from './stripeService.js';
import { DatabaseService } from './databaseService.js';
import { EmailService } from './emailService.js';

const PLANS = {
  startup_monthly: {
    name: 'Startup Audit - Monthly',
    priceId: process.env.STRIPE_PRICE_STARTUP_MONTHLY || 'price_startup_monthly',
    creditsPerMonth: 300,
    amountCents: 4900, // $49
    interval: 'month'
  },
  startup_annual: {
    name: 'Startup Audit - Annual',
    priceId: process.env.STRIPE_PRICE_STARTUP_ANNUAL || 'price_startup_annual',
    creditsPerMonth: 350, // +17% discount
    amountCents: 49900, // $499
    interval: 'year'
  },
  enterprise_monthly: {
    name: 'Enterprise Deep Dive - Monthly',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    creditsPerMonth: 1000,
    amountCents: 14900, // $149
    interval: 'month'
  },
  enterprise_annual: {
    name: 'Enterprise Deep Dive - Annual',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || 'price_enterprise_annual',
    creditsPerMonth: 1200, // +20% discount
    amountCents: 149900, // $1499
    interval: 'year'
  }
};

export const SubscriptionService = {
  getPlan(planId: string) {
    return PLANS[planId as keyof typeof PLANS];
  },

  getAllPlans() {
    return Object.entries(PLANS).map(([id, plan]) => ({
      id,
      ...plan
    }));
  },

  async createSubscription(userId: string, planId: string) {
    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) throw new Error(`Invalid plan: ${planId}`);

    const user = await DatabaseService.getUserWithCredits(userId);
    if (!user) throw new Error('User not found');

    // Get or create Stripe customer
    let stripeCustomer = await DatabaseService.getStripeCustomer(userId);
    if (!stripeCustomer) {
      const customer = await StripeService.createCustomer(user.email, user.name);
      stripeCustomer = await DatabaseService.createStripeCustomer(userId, customer.id);
    }

    // Create subscription
    const subscription = await StripeService.createSubscription(
      stripeCustomer.stripeCustomerId,
      plan.priceId
    );

    // Update user subscription info
    await DatabaseService.updateStripeCustomer(userId, {
      stripeSubscriptionId: subscription.id,
      plan: planId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });

    // Update user credits
    await DatabaseService.updateUser(userId, {
      credits: plan.creditsPerMonth,
      isUnlimited: false
    });

    // Log event
    await DatabaseService.logAuditEvent(
      'subscription_created',
      userId,
      { planId, subscriptionId: subscription.id },
      'subscription',
      subscription.id,
      'info'
    );

    // Send email
    try {
      await EmailService.sendNotification(
        user.email,
        `Welcome to ${plan.name}!`,
        `<p>Your subscription to <strong>${plan.name}</strong> is now active.</p>
         <p>You receive <strong>${plan.creditsPerMonth} credits</strong> per ${plan.interval}.</p>
         <p>Start analyzing your code: <a href="https://app.codecouncil.ai">Go to Dashboard</a></p>`
      );
    } catch (err) {
      console.error('Failed to send subscription email:', err);
    }

    return subscription;
  },

  async cancelSubscription(userId: string, atPeriodEnd = true) {
    const stripeCustomer = await DatabaseService.getStripeCustomer(userId);
    if (!stripeCustomer?.stripeSubscriptionId) {
      throw new Error('No active subscription');
    }

    if (atPeriodEnd) {
      // Cancel at period end (user keeps access until renewal date)
      const updated = await StripeService.cancelSubscription(
        stripeCustomer.stripeSubscriptionId
      );

      await DatabaseService.updateStripeCustomer(userId, {
        cancelAtPeriodEnd: true
      });

      await DatabaseService.logAuditEvent(
        'subscription_cancel_at_period_end',
        userId,
        {},
        'subscription',
        stripeCustomer.stripeSubscriptionId,
        'warning'
      );

      return updated;
    } else {
      // Cancel immediately
      const subscription = await StripeService.getSubscription(
        stripeCustomer.stripeSubscriptionId
      );

      // Refund remaining credits pro-rata (optional)
      const daysRemaining = Math.ceil(
        (new Date(subscription.current_period_end * 1000).getTime() - Date.now()) / (1000 * 86400)
      );

      await DatabaseService.updateStripeCustomer(userId, {
        status: 'canceled',
        canceledAt: new Date()
      });

      await DatabaseService.logAuditEvent(
        'subscription_canceled_immediately',
        userId,
        { daysRemaining },
        'subscription',
        stripeCustomer.stripeSubscriptionId,
        'warning'
      );

      return subscription;
    }
  },

  async updateSubscriptionPlan(userId: string, newPlanId: string) {
    const stripeCustomer = await DatabaseService.getStripeCustomer(userId);
    if (!stripeCustomer?.stripeSubscriptionId) {
      throw new Error('No active subscription');
    }

    const newPlan = PLANS[newPlanId as keyof typeof PLANS];
    if (!newPlan) throw new Error(`Invalid plan: ${newPlanId}`);

    // Update subscription plan
    const updated = await StripeService.updateSubscription(
      stripeCustomer.stripeSubscriptionId,
      newPlan.priceId
    );

    await DatabaseService.updateStripeCustomer(userId, {
      plan: newPlanId,
      status: updated.status
    });

    await DatabaseService.logAuditEvent(
      'subscription_plan_changed',
      userId,
      { newPlanId, oldPlanId: stripeCustomer.plan },
      'subscription',
      stripeCustomer.stripeSubscriptionId,
      'info'
    );

    return updated;
  },

  async getSubscriptionDetails(userId: string) {
    const stripeCustomer = await DatabaseService.getStripeCustomer(userId);
    if (!stripeCustomer?.stripeSubscriptionId) {
      return null;
    }

    const subscription = await StripeService.getSubscription(
      stripeCustomer.stripeSubscriptionId
    );

    return {
      plan: stripeCustomer.plan,
      status: stripeCustomer.status,
      currentPeriodStart: stripeCustomer.currentPeriodStart,
      currentPeriodEnd: stripeCustomer.currentPeriodEnd,
      cancelAtPeriodEnd: stripeCustomer.cancelAtPeriodEnd,
      nextPaymentAttempt: stripeCustomer.nextPaymentAttempt,
      plan_details: PLANS[stripeCustomer.plan as keyof typeof PLANS]
    };
  }
};

export default SubscriptionService;
