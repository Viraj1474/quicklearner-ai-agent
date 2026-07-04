export const pricingPlans = [
  {
    id: 'pro_monthly',
    plan_code: 'pro_monthly',
    billing_cycle: 'monthly',
    name: 'Pro Monthly',
    description: 'Flexible month-to-month access with premium tools.',
    price_display: '$14.99',
    price_cents: 1499,
    features: ['Unlimited study tools', 'Long-term memory', 'Faster AI responses', 'Export and analytics', 'Advanced planner'],
    recommended: false,
  },
  {
    id: 'pro_yearly',
    plan_code: 'pro_yearly',
    billing_cycle: 'yearly',
    name: 'Pro Yearly',
    description: 'Best value for ongoing study and long-term growth.',
    price_display: '$119.99',
    price_cents: 11999,
    features: ['Unlimited study tools', 'Long-term memory', 'Faster AI responses', 'Export and analytics', 'Advanced planner'],
    recommended: true,
    badgeText: 'Most Popular',
    savingsText: 'Save 40%',
    savings_percent: 40,
  },
];

export const normalizePricingPlans = (plans = pricingPlans) => {
  return plans
    .filter((plan) => (plan?.id || plan?.plan_code) !== 'free')
    .map((plan) => ({
      ...plan,
      id: plan.id || plan.plan_code,
      plan_code: plan.plan_code || plan.id,
      billing_cycle: plan.billing_cycle || (plan.id === 'pro_yearly' ? 'yearly' : 'monthly'),
    }))
    .sort((left, right) => {
      if (left.id === 'pro_monthly') return -1;
      if (right.id === 'pro_monthly') return 1;
      return 0;
    });
};
