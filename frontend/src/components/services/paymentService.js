import { authFetch } from './authService';

/**
 * Create checkout session for Stripe or Razorpay.
 */
export const createCheckoutSession = async ({ plan, provider, country, success_url, cancel_url }) => {
  return await authFetch('/api/billing/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({
      plan,
      provider,
      country,
      success_url,
      cancel_url,
    }),
  });
};

/**
 * Verify Razorpay payment signature from checkout callback.
 */
export const verifyRazorpayPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  plan_code,
  plan,
}) => {
  return await authFetch('/api/billing/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_code,
      plan,
    }),
  });
};

/**
 * Open Stripe customer portal.
 */
export const createCustomerPortal = async (returnUrl) => {
  return await authFetch('/api/billing/create-customer-portal', {
    method: 'POST',
    body: JSON.stringify({ return_url: returnUrl }),
  });
};

/**
 * Inspect which billing providers are configured on the backend.
 */
export const getBillingProviders = async () => {
  return await authFetch('/api/billing/providers');
};

export default {
  createCheckoutSession,
  verifyRazorpayPayment,
  createCustomerPortal,
  getBillingProviders,
};
