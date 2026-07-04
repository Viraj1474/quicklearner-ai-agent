import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme';
import { hasPremiumAccess, isDeveloperOrAdmin } from './accessUtils';

function PremiumFeatureGate({
  user,
  hasPremium,
  isUnlocked,
  title = 'Premium feature locked',
  featureName = 'this tool',
  description = 'Upgrade to Premium for unlimited access, faster workflows, and the full Blackbox-style experience.',
  onUpgrade,
  onSecondaryAction,
  children,
}) {
  const { darkMode } = useTheme();
  const accessValue = hasPremium ?? user?.hasPremiumAccess ?? hasPremiumAccess(user);
  const unlocked =
    isDeveloperOrAdmin(user) ||
    Boolean(accessValue || isUnlocked);

  if (unlocked) {
    return children;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl border p-6 ${darkMode ? 'border-white/10 bg-[#0f1117]' : 'border-slate-200 bg-white'}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.16),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.12),_transparent_36%)]" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
            Premium locked
          </div>
          <h3 className={`mt-4 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-slate-950'}`}>
            {title}
          </h3>
          <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {description}
          </p>
          <p className={`mt-3 text-sm font-medium ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            {featureName} is available instantly after checkout.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:min-w-[220px]">
          <button
            onClick={onUpgrade}
            className="rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-[1.01]"
          >
            Upgrade to Premium
          </button>
          {onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition-colors ${darkMode ? 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
            >
              See pricing
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default PremiumFeatureGate;
