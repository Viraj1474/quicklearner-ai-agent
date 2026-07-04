import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../theme';
import { useToast } from '../ToastProvider';
import { getBillingPlans } from '../services/authService';
import { getBillingProviders } from '../services/paymentService';
import { normalizePricingPlans, pricingPlans } from './pricingPlans';
import PricingCard from './PricingCard';
import { hasPremiumAccess, isDeveloperOrAdmin, normalizePlan } from './accessUtils';

function PricingPage({ isOpen, onClose, onSelectPlan, onAuthRequired, user, subscription, checkoutLoading = false }) {
  const { darkMode } = useTheme();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('razorpay');
  const [selectedPlan, setSelectedPlan] = useState('pro_monthly');
  const privilegedUser = isDeveloperOrAdmin(user);

  useEffect(() => {
    if (isOpen && privilegedUser) {
      onClose?.();
    }
  }, [isOpen, privilegedUser, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let mounted = true;
    setLoading(true);
    setError('');

    getBillingPlans()
      .then((data) => {
        if (!mounted) return;
        setPlans(normalizePricingPlans(data?.plans?.length ? data.plans : pricingPlans));
      })
      .catch((err) => {
        if (!mounted) return;
        setPlans(normalizePricingPlans(pricingPlans));
        setError(err.message || 'Unable to load live pricing');
        toast.error('Unable to load pricing', err.message || 'Please try again later.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, toast]);

  useEffect(() => {
    if (!isOpen) return undefined;

    let mounted = true;
    getBillingProviders()
      .then((data) => {
        if (!mounted) return;
        const configured = data?.available_providers || {};
        if (configured.razorpay) {
          setSelectedProvider('razorpay');
        }
      })
      .catch(() => {
        if (!mounted) return;
        setSelectedProvider('razorpay');
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, user?.country]);

  const handleCheckout = (planCode = selectedPlan) => {
    if (planCode === 'free') {
      return;
    }

    if (user || subscription) {
      onSelectPlan?.(planCode, selectedProvider);
      return;
    }

    onAuthRequired?.('login');
  };

  const visiblePlans = useMemo(
    () => normalizePricingPlans(plans.length ? plans : pricingPlans).filter((plan) => ['free', 'pro_monthly', 'pro_yearly'].includes(plan.id || plan.plan_code)),
    [plans],
  );

  const userPlan = normalizePlan(user);
  const currentPlanCode = hasPremiumAccess(user)
    ? userPlan === 'yearly'
      ? 'pro_yearly'
      : 'pro_monthly'
    : 'free';

  const handleClose = () => {
    console.log('Pricing page closed');
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (privilegedUser) {
    return null;
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[2147483000] pointer-events-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />
          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-full flex items-end sm:items-center justify-center p-2 sm:p-4">
              <motion.div
                className="relative z-[2147483001] pointer-events-auto mx-auto w-full max-w-5xl max-h-[calc(100vh-1rem)] sm:max-h-[92vh] rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#111111]/95 backdrop-blur-xl shadow-[0_0_80px_rgba(255,180,80,0.08)] overflow-hidden"
                initial={{ y: 24, scale: 0.98, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 16, scale: 0.98, opacity: 0 }}
              >
                <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_top,_rgba(255,180,80,0.08),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(124,58,237,0.14),_transparent_32%)]" />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[2147483647] pointer-events-auto rounded-full border border-white/10 bg-red-500 p-2 text-white"
                >
                  ×
                </button>

                <div className="relative z-10 max-h-[calc(100vh-3rem)] overflow-auto px-4 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
                PREMIUM
              </div>
              <h2 className={`mt-5 max-w-2xl text-3xl sm:text-[40px] font-semibold leading-[1.05] tracking-tight ${darkMode ? 'text-white' : 'text-slate-950'}`}>
                Upgrade to Quicklearner Pro
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                Unlock unlimited study tools, smarter AI responses, long-term memory, and advanced learning workflows.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                {visiblePlans.map((plan) => {
                  const planCode = plan.id || plan.plan_code;
                  const isCurrent = currentPlanCode === planCode;
                  return (
                    <PricingCard
                      key={planCode}
                      darkMode={true}
                      plan={plan}
                      selected={selectedPlan === planCode}
                      current={isCurrent}
                      checkoutLoading={checkoutLoading}
                      onSelect={setSelectedPlan}
                      onCheckout={handleCheckout}
                    />
                  );
                })}
              </div>

              <div className="mt-6 inline-flex rounded-full border border-cyan-400 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.14)]">
                Razorpay
              </div>

              {error && <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{error}</div>}

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-sm text-slate-400">
                Subscription access activates only after successful payment verification via Razorpay signature verification.
              </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return ReactDOM.createPortal(modalContent, document.body);
}

export default PricingPage;
