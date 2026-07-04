import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getBillingProviders } from '../services/paymentService';
import { normalizePricingPlans } from './pricingPlans';
import { hasPremiumAccess, isDeveloperOrAdmin, normalizePlan } from './accessUtils';

const X = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Check = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const defaultProvider = 'razorpay';

const UpgradeModal = ({ isOpen, onClose, ...props }) => {
  const {
    onSelectPlan,
    currentBillingCycle = 'yearly',
    user,
    checkoutLoading = false,
  } = props;
  const [provider, setProvider] = useState(defaultProvider);
  const [selectedPlan, setSelectedPlan] = useState('pro_monthly');
  const [availableProviders, setAvailableProviders] = useState({ razorpay: true });
  const privilegedUser = isDeveloperOrAdmin(user);

  // Detect available billing providers
  useEffect(() => {
    const detectProviders = async () => {
      try {
        const data = await getBillingProviders();
        const configured = data?.available_providers || { razorpay: false };
        setAvailableProviders({ razorpay: !!configured.razorpay });

        if (configured.razorpay) {
          setProvider('razorpay');
          return;
        }

        setProvider('razorpay');
      } catch (error) {
        console.error('Failed to detect billing providers:', error);
        setAvailableProviders({ razorpay: true });
        setProvider('razorpay');
      }
    };

    if (isOpen) {
      detectProviders();
    }
  }, [isOpen]);

  // Get memoized pricing plans
  const plans = useMemo(() => {
    const normalized = normalizePricingPlans();
    return normalized.filter((plan) => ['free', 'pro_monthly', 'pro_yearly'].includes(plan.id));
  }, []);

  const handleCheckout = (planCode) => {
    if (planCode === 'free') {
      return;
    }
    setSelectedPlan(planCode);
    onSelectPlan?.(planCode, provider);
  };

  const handleClose = () => {
    console.log('Upgrade modal closed');
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Handle Escape key only while the modal is open
  useEffect(() => {
    if (!isOpen) {
      return;
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

  if (!isOpen || privilegedUser) return null;

  const freePlan = plans.find((p) => p.id === 'free');
  const proMonthlyPlan = plans.find(p => p.id === 'pro_monthly');
  const proYearlyPlan = plans.find(p => p.id === 'pro_yearly');
  const currentPlan = hasPremiumAccess(user)
    ? normalizePlan(user) === 'yearly'
      ? 'pro_yearly'
      : 'pro_monthly'
    : 'free';

  const providerDescriptions = {
    razorpay: { name: 'Razorpay', description: 'Fast Indian payments' },
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2147483000] pointer-events-auto">
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={handleClose}
        />

        <div className="absolute inset-0 overflow-y-auto">
          <div className="min-h-full flex items-end sm:items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-[2147483001] pointer-events-auto w-full max-w-5xl max-h-[calc(100vh-1rem)] sm:max-h-[92vh] rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#111111]/95 px-4 sm:px-8 pt-6 pb-8 shadow-[0_0_80px_rgba(255,180,80,0.08)] backdrop-blur-xl overflow-y-auto"
            >
              {/* Close Button (debug style) */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('X clicked');
                  handleClose();
                }}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[2147483647] pointer-events-auto bg-red-500 p-3 rounded-full"
              >
                <X size={20} />
              </button>

              {/* Decorative background layer */}
              <div className="absolute inset-0 pointer-events-none z-0 rounded-3xl bg-gradient-to-br from-white/[0.02] via-transparent to-amber-300/[0.03]" />

              {/* Actual modal content */}
              <div className="relative z-10">
                {/* Premium Badge */}
                <div className="mb-2 inline-block rounded-full bg-amber-300/10 px-3 py-1">
                  <span className="text-xs font-semibold text-amber-300">Premium</span>
                </div>

                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Upgrade to Quicklearner Pro
                  </h2>
                  <p className="text-white/60">
                    Unlock unlimited study tools and personalized learning
                  </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {freePlan && (
              <div
                className={`relative rounded-2xl border transition-all duration-300 ${
                  currentPlan === 'free'
                    ? 'border-emerald-500/80 bg-emerald-500/5 shadow-lg shadow-emerald-500/20'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="relative z-10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Free</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">{freePlan.price_display}</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    {freePlan.features?.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-white/80">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    disabled
                    className="w-full rounded-lg bg-white/10 py-2 text-sm font-semibold text-white/80"
                  >
                    {currentPlan === 'free' ? 'Current plan' : 'Available'}
                  </button>
                </div>
              </div>
            )}

            {proMonthlyPlan && (
              <div
                onClick={() => handleCheckout('pro_monthly')}
                className={`relative cursor-pointer rounded-2xl border transition-all duration-300 ${
                  selectedPlan === 'pro_monthly'
                    ? 'border-violet-500/80 bg-violet-500/5 shadow-lg shadow-violet-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {/* Gradient Overlay */}
                <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5" />

                {/* Content */}
                <div className="relative z-10 p-6">
                  {/* Badge */}
                  {selectedPlan === 'pro_monthly' && (
                    <div className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-500 shadow-lg">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}

                  {/* Plan Name */}
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Pro Monthly
                  </h3>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">
                      ${proMonthlyPlan.price_display}
                    </span>
                    <span className="text-white/60 text-sm ml-2">/month</span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {proMonthlyPlan.features?.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-white/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Upgrade Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout('pro_monthly');
                    }}
                    disabled={checkoutLoading || currentPlan === 'pro_monthly'}
                    className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 py-2 text-sm font-semibold text-white transition hover:from-violet-700 hover:to-violet-600 disabled:opacity-50"
                  >
                    {currentPlan === 'pro_monthly' ? 'Current plan' : checkoutLoading ? 'Processing...' : 'Upgrade Now'}
                  </button>
                </div>
              </div>
            )}

            {proYearlyPlan && (
              <div
                onClick={() => handleCheckout('pro_yearly')}
                className={`relative cursor-pointer rounded-2xl border transition-all duration-300 ${
                  selectedPlan === 'pro_yearly'
                    ? 'border-cyan-500/80 bg-cyan-500/5 shadow-lg shadow-cyan-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {/* Gradient Overlay */}
                <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5" />

                {/* Content */}
                <div className="relative z-10 p-6">
                  {/* Badge */}
                  {selectedPlan === 'pro_yearly' && (
                    <div className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-cyan-500 shadow-lg">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}

                  {/* Savings Badge */}
                  {proYearlyPlan.savingsText && (
                    <div className="mb-3 inline-block rounded-lg bg-amber-300/10 px-2 py-1">
                      <span className="text-xs font-semibold text-amber-300">
                        {proYearlyPlan.savingsText}
                      </span>
                    </div>
                  )}

                  {/* Plan Name */}
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Pro Yearly
                  </h3>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">
                      ${proYearlyPlan.price_display}
                    </span>
                    <span className="text-white/60 text-sm ml-2">/year</span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {proYearlyPlan.features?.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-white/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Upgrade Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout('pro_yearly');
                    }}
                    disabled={checkoutLoading || currentPlan === 'pro_yearly'}
                    className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 py-2 text-sm font-semibold text-white transition hover:from-cyan-700 hover:to-cyan-600 disabled:opacity-50"
                  >
                    {currentPlan === 'pro_yearly' ? 'Current plan' : checkoutLoading ? 'Processing...' : 'Upgrade Now'}
                  </button>
                </div>
              </div>
            )}
                </div>

                {/* Payment Method Selector */}
                <div className="mb-8 border-t border-white/10 pt-8">
                  <p className="text-sm font-semibold text-white mb-4">Payment Method</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {['razorpay'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setProvider(p)}
                        disabled={!availableProviders[p]}
                        className={`flex-1 rounded-lg border py-3 px-4 transition ${
                          provider === p
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="text-sm font-semibold text-white capitalize">
                          {providerDescriptions[p].name}
                        </div>
                        <div className="text-xs text-white/60">
                          {availableProviders[p] ? providerDescriptions[p].description : 'Not configured'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 pt-6 text-center">
                  <p className="text-xs text-white/50 mb-2">
                    🔒 Secure payments powered by Razorpay
                  </p>
                  <p className="text-xs text-white/50">
                    Cancel anytime • No hidden fees
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return ReactDOM.createPortal(modalContent, document.body);
};

export default UpgradeModal;
