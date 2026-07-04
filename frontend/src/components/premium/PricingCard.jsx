import React from 'react';
import { motion } from 'framer-motion';

function CheckIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 10.5L8.3 13.8L15 7.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PricingCard({
  darkMode,
  plan,
  selected,
  current,
  onSelect,
  onCheckout,
  checkoutLoading,
}) {
  const isYearly = plan.id === 'pro_yearly';
  const isFree = plan.id === 'free';
  const cycle = plan.billing_cycle || plan.billingCycle;

  return (
    <motion.div
      onClick={() => !checkoutLoading && !isFree && onSelect?.(plan.id)}
      className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${
        selected
          ? 'border-violet-500/80 bg-white/[0.04] shadow-[0_0_45px_rgba(139,92,246,0.22)] scale-[1.01]'
          : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
      }`}
      whileHover={checkoutLoading || isFree ? {} : { y: -3 }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5" />
      <div className={`absolute inset-x-0 top-0 h-[2px] ${isYearly ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500' : 'bg-gradient-to-r from-white/15 to-white/5'}`} />

      {selected && (
        <div className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg">
          <CheckIcon className="h-4 w-4" />
        </div>
      )}

      {isYearly && (
        <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
          <span className="rounded-full bg-violet-600 px-3 py-1 text-[11px] font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            {plan.badgeText || 'Most Popular'}
          </span>
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.22)]">
            {plan.savingsText || 'Save 40%'}
          </span>
        </div>
      )}

      <div className={isYearly ? 'pr-24 relative z-[1]' : 'relative z-[1]'}>
        <h3 className={`text-lg sm:text-xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>{plan.name || plan.title}</h3>
        <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{plan.description || plan.detail}</p>
      </div>

      <div className="relative z-[1] mt-5 flex items-end gap-2">
        <span className={`text-3xl sm:text-4xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>{plan.price_display || plan.price}</span>
        {cycle ? <span className={`pb-1 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>/{cycle}</span> : null}
      </div>

      {isYearly ? <p className="mt-2 text-sm font-medium text-emerald-400">Save 40% versus monthly billing</p> : null}

      <div className="relative z-[1] mt-5 space-y-2 text-sm">
        {(plan.features || []).slice(0, 5).map((feature) => (
          <div key={feature} className="flex items-start gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span className={darkMode ? 'text-slate-300' : 'text-slate-600'}>{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={(event) => {
          event.stopPropagation();
          if (isFree) return;
          onCheckout?.(plan.id);
        }}
        disabled={isFree || checkoutLoading || current}
        className="relative z-[1] mt-6 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 py-3 font-semibold text-white shadow-[0_0_30px_rgba(139,92,246,0.35)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isFree ? 'Included' : current ? 'Current plan' : checkoutLoading ? 'Redirecting...' : 'Upgrade Now'}
      </button>
    </motion.div>
  );
}

export default PricingCard;