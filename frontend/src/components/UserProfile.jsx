/**
 * User Profile Component
 * 
 * Shows user profile with:
 * - Profile information
 * - Edit profile
 * - Change password
 * - Logout options
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { useToast } from './ToastProvider';
import Avatar from './Avatar';
import { getSubscriptionStatus } from './services/authService';
import PaymentMethodSelector from './premium/PaymentMethodSelector';
import BillingHistory from './premium/BillingHistory';
import { getBillingProviders } from './services/paymentService';
import { hasPremiumAccess, isDeveloperOrAdmin, normalizePlan } from './premium/accessUtils';

function UserProfile({ onClose, onOpenPricing }) {
  const { user, logout, logoutAllDevices, updateProfile, changePassword, createCheckoutSession, verifyRazorpayPayment, createCustomerPortal, cancelSubscription, refreshUser, loading } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security', 'billing'
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [subscription, setSubscription] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState((user?.country || '').toUpperCase() === 'IN' ? 'razorpay' : 'stripe');
  const [selectedPlan, setSelectedPlan] = useState('pro_monthly');
  
  const [profileData, setProfileData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    username: user?.username || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const isPrivilegedAccount = isDeveloperOrAdmin(user);
  const isPremium = hasPremiumAccess(user);
  const planLabel = normalizePlan(user);
  const activePaidCycle = isPremium ? (planLabel === 'yearly' ? 'yearly' : 'monthly') : null;
  const billingCycleLabel = planLabel ? planLabel.charAt(0).toUpperCase() + planLabel.slice(1) : 'Free';
  const subscriptionEnds = user?.subscription_ends_at ? new Date(user.subscription_ends_at).toLocaleDateString() : 'N/A';
  const nextBillingDate = user?.next_billing_date ? new Date(user.next_billing_date).toLocaleDateString() : 'N/A';

  useEffect(() => {
    let mounted = true;

    const loadSubscription = async () => {
      try {
        const status = await getSubscriptionStatus();
        if (mounted) {
          setSubscription(status);
        }
      } catch (err) {
        if (mounted) {
          setSubscription(null);
        }
      }
    };

    loadSubscription();

    getBillingProviders()
      .then((data) => {
        if (!mounted) return;
        const configured = data?.available_providers || {};
        const preferred = data?.default_provider || ((user?.country || '').toUpperCase() === 'IN' ? 'razorpay' : 'stripe');
        if (configured[preferred]) {
          setSelectedProvider(preferred);
          return;
        }
        if (configured.razorpay) {
          setSelectedProvider('razorpay');
          return;
        }
        if (configured.stripe) {
          setSelectedProvider('stripe');
        }
      })
      .catch(() => {
        if (mounted && (user?.country || '').toUpperCase() === 'IN') {
          setSelectedProvider('razorpay');
        }
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        username: profileData.username,
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    try {
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose?.();
  };

  const handleLogoutAll = async () => {
    if (window.confirm('This will log you out from all devices. Continue?')) {
      await logoutAllDevices();
      onClose?.();
    }
  };

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handleCheckout = async () => {
    setMessage({ type: '', text: '' });
    try {
      setBillingLoading(true);
      const session = await createCheckoutSession({
        plan: selectedPlan,
        provider: selectedProvider,
        country: user?.country,
      });
      const checkoutUrl = session?.checkout_url || session?.url || session?.redirect_url || session?.payment_url;
      const razorpayOrderId = session?.order_id || session?.razorpay_order_id;

      if (session?.provider === 'razorpay' && razorpayOrderId) {
        const loaded = await loadRazorpayScript();

        if (!loaded) {
          throw new Error('Razorpay SDK failed to load. Try Stripe.');
        }

        const razorpay = new window.Razorpay({
          key: session.key,
          amount: session.amount,
          currency: session.currency || 'INR',
          name: 'AI Agent Premium',
          description: selectedPlan === 'pro_yearly' ? 'Pro Yearly' : 'Pro Monthly',
          order_id: razorpayOrderId,
          handler: async (response) => {
            try {
              await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_code: selectedPlan,
              });
              await refreshUser();
              const status = await getSubscriptionStatus();
              setSubscription(status);
              setMessage({ type: 'success', text: 'Payment verified. Premium is active.' });
              toast.success('Upgrade successful', 'Your Premium subscription is now active.');
            } catch (paymentError) {
              console.error('Razorpay verify failed in profile', paymentError);
              setMessage({ type: 'error', text: paymentError.message });
              toast.error('Payment verification failed', paymentError.message || 'Please try again.');
            }
          },
          modal: {
            ondismiss: () => toast.info('Checkout canceled', 'You can resume the upgrade any time.'),
          },
        });
        razorpay.open();
        return;
      }

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      throw new Error(`Checkout session was not created. Response: ${JSON.stringify(session)}`);
    } catch (err) {
      console.error('Checkout failed in profile', err);
      setMessage({ type: 'error', text: err.message });
      toast.error('Checkout failed', err.message || 'Please try again.');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setMessage({ type: '', text: '' });
    if (!isPremium) {
      onClose?.();
      onOpenPricing?.();
      return;
    }

    if ((selectedProvider || user?.payment_provider || '').toLowerCase() === 'razorpay') {
      const messageText = 'Manage your subscription by contacting support or cancelling from your profile.';
      setMessage({ type: 'error', text: messageText });
      toast.info('Razorpay subscription', messageText);
      return;
    }

    try {
      const portal = await createCustomerPortal(window.location.href);
      const portalUrl = portal?.url || portal?.portal_url;
      if (portalUrl) {
        window.location.href = portalUrl;
        return;
      }
      throw new Error('Billing portal link was not created.');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      toast.error('Billing portal unavailable', err.message || 'Please try again later.');
    }
  };

  const handleCancelSubscription = async () => {
    setMessage({ type: '', text: '' });
    try {
      await cancelSubscription();
      setMessage({ type: 'success', text: 'Premium subscription canceled.' });
      toast.success('Subscription canceled', 'Your Premium plan has been stopped.');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      toast.error('Cancel subscription failed', err.message || 'Please try again.');
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      client: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      user: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return badges[role] || badges.user;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center gap-4 pr-10">
            <Avatar
              src={user?.profile_picture}
              name={user?.first_name && user?.last_name 
                ? `${user.first_name} ${user.last_name}` 
                : user?.username}
              email={user?.email}
              size="xl"
              showBorder
              borderColor="border-white"
            />
            <div>
              <h2 className="text-xl font-bold">
                {user?.first_name || user?.last_name
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : user?.username}
              </h2>
              <p className="text-white/80 text-sm">{user?.email}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user?.role)}`}>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'security'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'billing'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Billing
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-14rem)] sm:max-h-[50vh]">
          {/* Message */}
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'profile' && (
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={profileData.username}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">Username</span>
                      <span className="text-gray-900 dark:text-white font-medium">{user?.username}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">Email</span>
                      <span className="text-gray-900 dark:text-white font-medium">{user?.email}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">Auth provider</span>
                      <span className="text-gray-900 dark:text-white font-medium capitalize">{user?.auth_provider}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">Member since</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2 mt-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Edit profile
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change Password */}
              {user?.auth_provider === 'local' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Change password
                  </h3>
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="Current password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="New password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                      Change password
                    </button>
                  </form>
                </div>
              )}

              {/* Logout Options */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Sessions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Logout from this device
                  </button>
                  <button
                    onClick={handleLogoutAll}
                    className="w-full py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Logout from all devices
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-5">
              {isPrivilegedAccount ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                  Developer/Admin accounts have full premium access by role. Subscription and upgrade options are hidden for this account.
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 gap-3">
                <PaymentMethodSelector
                  value={selectedProvider}
                  onChange={setSelectedProvider}
                  country={user?.country}
                  disabled={loading || billingLoading}
                />

                {[
                  {
                    title: 'Premium Monthly',
                    price: '$14.99',
                    detail: 'Flexible month-to-month access.',
                    billingCycle: 'monthly',
                    featured: false,
                  },
                  {
                    title: 'Premium Yearly',
                    price: '$119.99',
                    detail: 'Best value for long-term learners.',
                    billingCycle: 'yearly',
                    featured: true,
                  },
                ].map((plan) => (
                  <div
                    key={plan.billingCycle}
                    onClick={() => !(loading || billingLoading) && setSelectedPlan(plan.billingCycle === 'yearly' ? 'pro_yearly' : 'pro_monthly')}
                    className={`rounded-2xl border p-4 transition-all ${selectedPlan === (plan.billingCycle === 'yearly' ? 'pro_yearly' : 'pro_monthly') ? 'border-violet-400 bg-violet-50 shadow-lg shadow-violet-300/30 dark:border-violet-500 dark:bg-violet-900/30' : plan.featured ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'} ${(loading || billingLoading) ? 'opacity-80' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{plan.detail}</p>
                      </div>
                      {plan.featured && (
                        <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Best value
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">per {plan.billingCycle === 'monthly' ? 'month' : 'year'}</p>
                      </div>
                      <button
                        onClick={handleCheckout}
                        disabled={loading || billingLoading || (isPremium && activePaidCycle === plan.billingCycle) || selectedPlan !== (plan.billingCycle === 'yearly' ? 'pro_yearly' : 'pro_monthly')}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50"
                      >
                            {isPremium && activePaidCycle === plan.billingCycle ? 'Active plan' : billingLoading && selectedPlan === (plan.billingCycle === 'yearly' ? 'pro_yearly' : 'pro_monthly') ? 'Redirecting...' : 'Continue to Checkout'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCancelSubscription}
                disabled={loading || billingLoading || !isPremium}
                className="w-full py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 font-medium disabled:opacity-50"
              >
                Cancel premium
              </button>

              <button
                onClick={handleOpenPortal}
                disabled={loading || billingLoading}
                className="w-full py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300 font-medium disabled:opacity-50"
              >
                {isPremium ? 'Manage Billing' : 'Manage Subscription'}
              </button>
                </>
              )}

              <BillingHistory />
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default UserProfile;
