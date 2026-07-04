import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme';
import { hasPremiumAccess, isDeveloperOrAdmin, normalizePlan } from './accessUtils';

function formatCycle(cycle) {
  if (!cycle) return 'Free';
  return `${cycle.charAt(0).toUpperCase()}${cycle.slice(1)}`;
}

function SubscriptionStatusCard({ user, quota, onUpgrade, onManage }) {
  const { darkMode } = useTheme();
  const privilegedUser = isDeveloperOrAdmin(user);
  const isPremium = hasPremiumAccess(user);
  const billingCycle = formatCycle(normalizePlan(user));
  const endsAt = user?.subscription_ends_at ? new Date(user.subscription_ends_at).toLocaleDateString() : 'No active renewal';
  const remaining = quota?.remaining_count;
  const limit = quota?.daily_limit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl border p-5 ${darkMode ? 'border-white/10 bg-[#0f1117]' : 'border-slate-200 bg-white'}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(236,72,153,0.12),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.12),_transparent_34%)]" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-300">
            Subscription status
          </div>
          <h3 className={`mt-3 text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
            {privilegedUser ? 'Developer access' : isPremium ? `Premium ${billingCycle}` : 'Free plan'}
          </h3>
          <p className={`mt-1 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {privilegedUser
              ? 'Developer/Admin role unlocks all premium tools automatically. Billing prompts are hidden for this account.'
              : isPremium
              ? `Active until ${endsAt}. Billing renewal and cancellation are handled automatically.`
              : 'Free tier is available after login. Choose monthly or yearly only if you want a paid subscription.'}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:min-w-[320px]">
          <div className={`rounded-2xl border px-4 py-3 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-[0.2em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Access
            </p>
            <p className={`mt-1 text-sm font-semibold ${isPremium ? 'text-emerald-500' : darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              {privilegedUser ? 'Role-based premium tools' : isPremium ? 'Unlimited premium tools' : 'Quota protected'}
            </p>
          </div>
          <div className={`rounded-2xl border px-4 py-3 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`text-[11px] uppercase tracking-[0.2em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Today
            </p>
            <p className={`mt-1 text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              {privilegedUser
                ? 'No subscription required'
                : isPremium
                ? (quota && typeof remaining === 'number' && typeof limit === 'number'
                  ? `${remaining} of ${limit} uses left`
                  : 'Billing synced via Razorpay')
                : 'Free tier active'}
            </p>
          </div>
        </div>
      </div>

      {!privilegedUser && <div className="relative mt-4 flex flex-wrap gap-3">
        <button
          onClick={isPremium ? onManage : onUpgrade}
          className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-transform hover:scale-[1.01]"
        >
          {isPremium ? 'Manage billing' : 'Upgrade now'}
        </button>
        {!isPremium && (
          <div className={`rounded-2xl border px-4 py-2.5 text-sm ${darkMode ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            Free tier is available with no payment required.
          </div>
        )}
      </div>}
    </motion.div>
  );
}

export default SubscriptionStatusCard;
