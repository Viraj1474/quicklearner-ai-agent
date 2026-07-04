export function normalizeRole(user) {
  return (user?.role || 'user').toLowerCase();
}

export function normalizePlan(user) {
  const rawPlan = (user?.plan || user?.billing_cycle || 'free').toLowerCase();
  if (rawPlan === 'pro_monthly') return 'monthly';
  if (rawPlan === 'pro_yearly') return 'yearly';
  return rawPlan;
}

export function normalizeSubscriptionStatus(user) {
  return (user?.subscriptionstatus || user?.subscription_status || 'free').toLowerCase();
}

export function isDeveloperOrAdmin(user) {
  const role = normalizeRole(user);
  return role === 'developer' || role === 'admin';
}

export function hasPremiumAccess(user) {
  if (!user) return false;

  if (isDeveloperOrAdmin(user)) {
    return true;
  }

  const plan = normalizePlan(user);
  const subscriptionstatus = normalizeSubscriptionStatus(user);

  return ['monthly', 'yearly'].includes(plan) && subscriptionstatus === 'active';
}

export function enrichUserAccess(user) {
  if (!user) return null;

  const role = normalizeRole(user);
  const plan = normalizePlan(user);
  const subscriptionstatus = normalizeSubscriptionStatus(user);

  return {
    ...user,
    role,
    plan,
    subscriptionstatus,
    hasPremiumAccess: hasPremiumAccess({ ...user, role, plan, subscriptionstatus }),
  };
}
