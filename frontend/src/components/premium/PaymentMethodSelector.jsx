import React from 'react';

function PaymentMethodSelector({ value = 'razorpay', onChange, className = '', disabled = false }) {
  const activeValue = value || 'razorpay';

  const methods = [
    {
      id: 'razorpay',
      label: 'Razorpay',
      hint: 'UPI / PhonePe / Paytm / Net Banking',
      badge: 'India',
    },
  ];

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        Payment method
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {methods.map((method) => {
          const selected = method.id === activeValue;
          return (
            <button
              key={method.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(method.id)}
              className={`rounded-xl border px-3 py-3 text-left transition ${selected ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/10 dark:bg-black/20 dark:hover:bg-white/10'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{method.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${selected ? 'bg-cyan-500/15 text-cyan-500' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>
                  {method.badge}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{method.hint}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Razorpay is the only available payment method.
      </p>
      {/* Razorpay test card: 4111 1111 1111 1111 */}
    </div>
  );
}

export default PaymentMethodSelector;
