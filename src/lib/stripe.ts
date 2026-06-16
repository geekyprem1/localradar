import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_secret_key';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-01-27-ac' as any, // use current recommended Stripe API version
});
