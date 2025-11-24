import express, { Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware.js';
import { DatabaseService } from '../services/databaseService.js';
import { StripeService } from '../services/stripeService.js';
import { captureException } from '../services/sentryService.js';

const router = express.Router();

/**
 * POST /api/billing/stripe/webhook
 * Handle Stripe webhook events
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const rawBody = req.body;

  try {
    const event = StripeService.constructWebhookEvent(
      rawBody as any,
      signature
    );

    switch (event.type) {
      case 'charge.succeeded':
        console.log('💳 Charge succeeded:', event.data.object);
        break;

      case 'charge.failed':
        console.log('❌ Charge failed:', event.data.object);
        captureException(new Error('Stripe charge failed'), {
          chargeId: event.data.object.id
        });
        break;

      case 'customer.subscription.updated':
        console.log('📝 Subscription updated:', event.data.object);
        // Update user's subscription status in DB
        break;

      case 'customer.subscription.deleted':
        console.log('❌ Subscription cancelled:', event.data.object);
        // Mark user as no longer subscribed
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    captureException(err, { action: 'stripe_webhook' });
    res.status(400).send(`Webhook error: ${err.message}`);
  }
});

/**
 * POST /api/billing/stripe/create-payment-intent
 * Create a payment intent for manual charges
 */
router.post('/stripe/create-payment-intent', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { tier } = req.body;
  const userId = req.user?.id;

  if (!userId || !tier) {
    return res.status(400).json({ error: 'Missing userId or tier' });
  }

  try {
    const user = await DatabaseService.getUserWithCredits(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create Stripe customer
    let stripeCustomer = await DatabaseService.getStripeCustomer(userId);
    if (!stripeCustomer) {
      const customer = await StripeService.createCustomer(user.email, user.name);
      stripeCustomer = await DatabaseService.createStripeCustomer(userId, customer.id);
    }

    // Create payment intent
    const amount = tier === 'startup' ? 4900 : 14900; // $49 or $149 in cents
    const intent = await StripeService.createPaymentIntent(
      stripeCustomer.stripeCustomerId,
      amount,
      `CodeCouncil AI ${tier} audit`
    );

    res.json({
      clientSecret: intent.client_secret,
      amount
    });
  } catch (err) {
    captureException(err as Error, { action: 'create_payment_intent', userId });
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

export default router;
