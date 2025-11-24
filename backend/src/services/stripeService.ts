import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

export const StripeService = {
  /**
   * Create a Stripe customer for a user
   */
  async createCustomer(email: string, name: string) {
    return stripe.customers.create({
      email,
      name,
      metadata: { source: 'codecouncil_ai' }
    });
  },

  /**
   * Create a subscription for a user
   */
  async createSubscription(customerId: string, priceId: string) {
    return stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      automatic_tax: { enabled: true },
      collection_method: 'charge_automatically'
    });
  },

  /**
   * Create a payment intent for one-time charges
   */
  async createPaymentIntent(customerId: string, amount: number, description: string) {
    return stripe.paymentIntents.create({
      customer: customerId,
      amount, // in cents
      currency: 'usd',
      description,
      automatic_payment_methods: { enabled: true }
    });
  },

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string) {
    return stripe.subscriptions.retrieve(subscriptionId);
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string) {
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
  },

  /**
   * Update subscription (change plan)
   */
  async updateSubscription(subscriptionId: string, newPriceId: string) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const itemId = subscription.items.data[0].id;

    return stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: itemId,
          price: newPriceId
        }
      ],
      proration_behavior: 'create_prorations'
    });
  },

  /**
   * Handle webhook events
   */
  constructWebhookEvent(body: string, signature: string) {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  },

  /**
   * Get customer invoices
   */
  async getCustomerInvoices(customerId: string) {
    return stripe.invoices.list({
      customer: customerId,
      limit: 100
    });
  },

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(customerId: string, paymentMethodId: string) {
    return stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });
  },

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
    return stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
  }
};

export default StripeService;
