/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the app:
 * - Current user state
 * - Login/logout methods
 * - Auth status checking
 * - Protected route support
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  googleLogin as apiGoogleLogin,
  logout as apiLogout,
  logoutAllDevices as apiLogoutAllDevices,
  forgotPassword as apiForgotPassword,
  getStoredUser,
  isAuthenticated as checkIsAuthenticated,
  refreshAccessToken,
  getProfile,
  updateProfile as apiUpdateProfile,
  changePassword as apiChangePassword,
  subscribeToPlan as apiSubscribeToPlan,
  cancelSubscription as apiCancelSubscription,
} from './services/authService';
import {
  createCheckoutSession as apiCreateCheckoutSession,
  verifyRazorpayPayment as apiVerifyRazorpayPayment,
  createCustomerPortal as apiCreateCustomerPortal,
  getBillingProviders as apiGetBillingProviders,
} from './services/paymentService';
import { enrichUserAccess, hasPremiumAccess as computeHasPremiumAccess, isDeveloperOrAdmin as computeIsDeveloperOrAdmin } from './premium/accessUtils';

// Create context
const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = getStoredUser();
        if (storedUser && checkIsAuthenticated()) {
          // Verify token is still valid by fetching profile
          try {
            const profile = await getProfile();
            setUser(enrichUserAccess(profile));
          } catch (err) {
            // Token expired, try refresh
            const refreshed = await refreshAccessToken();
            if (refreshed) {
              const profile = await getProfile();
              setUser(enrichUserAccess(profile));
            } else {
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login with email/password
  const login = useCallback(async (email, password, rememberMe = false) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiLogin(email, password, rememberMe);
      setUser(enrichUserAccess(data.user));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Register new user
  const register = useCallback(async (userData) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiRegister(userData);
      setUser(enrichUserAccess(data.user));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Google OAuth login
  const googleLogin = useCallback(async (credential) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiGoogleLogin(credential);
      setUser(enrichUserAccess(data.user));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setLoading(false);
      // Clear session data on logout (user-specific data in localStorage is kept)
      try {
        sessionStorage.removeItem('nickname_prompted');
        // Clear any first_time_* flags from this session
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('first_time_')) {
            sessionStorage.removeItem(key);
          }
        });
        window.dispatchEvent(new Event('user-logout'));
      } catch (e) {}
    }
  }, []);

  // Logout from all devices
  const logoutAllDevices = useCallback(async () => {
    setLoading(true);
    try {
      await apiLogoutAllDevices();
    } finally {
      setUser(null);
      setLoading(false);
      // Clear session data on logout (user-specific data in localStorage is kept)
      try {
        sessionStorage.removeItem('nickname_prompted');
        // Clear any first_time_* flags from this session
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('first_time_')) {
            sessionStorage.removeItem(key);
          }
        });
        window.dispatchEvent(new Event('user-logout'));
      } catch (e) {}
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (profileData) => {
    setError(null);
    try {
      const updatedUser = await apiUpdateProfile(profileData);
      setUser(enrichUserAccess(updatedUser));
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword, confirmPassword) => {
    setError(null);
    try {
      return await apiChangePassword(currentPassword, newPassword, confirmPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Upgrade to premium billing plan
  const subscribeToPlan = useCallback(async (billingCycle) => {
    setError(null);
    try {
      const subscription = await apiSubscribeToPlan(billingCycle);
      if (subscription?.user) {
        setUser(enrichUserAccess(subscription.user));
      }
      return subscription;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Start a provider checkout session (Stripe or Razorpay)
  const createCheckoutSession = useCallback(async (checkoutPayload) => {
    setError(null);
    try {
      return await apiCreateCheckoutSession(checkoutPayload);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Verify Razorpay payment signature
  const verifyRazorpayPayment = useCallback(async (payload) => {
    setError(null);
    try {
      return await apiVerifyRazorpayPayment(payload);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Open Stripe customer portal
  const createCustomerPortal = useCallback(async (returnUrl) => {
    setError(null);
    try {
      return await apiCreateCustomerPortal(returnUrl);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getBillingProviders = useCallback(async () => {
    setError(null);
    try {
      return await apiGetBillingProviders();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    setError(null);
    try {
      const subscription = await apiCancelSubscription();
      if (subscription?.user) {
        setUser(enrichUserAccess(subscription.user));
      }
      return subscription;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Forgot password - request reset email
  const forgotPassword = useCallback(async (email) => {
    setError(null);
    try {
      const result = await apiForgotPassword(email);
      return { success: true, message: result.message };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const profile = await getProfile();
      const enrichedUser = enrichUserAccess(profile);
      setUser(enrichedUser);
      return enrichedUser;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      return null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const hasPremiumAccess = computeHasPremiumAccess(user);
  const isDeveloperOrAdmin = computeIsDeveloperOrAdmin(user);

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    hasPremiumAccess,
    isDeveloperOrAdmin,
    login,
    register,
    googleLogin,
    forgotPassword,
    logout,
    logoutAllDevices,
    updateProfile,
    changePassword,
    subscribeToPlan,
    createCheckoutSession,
    verifyRazorpayPayment,
    createCustomerPortal,
    getBillingProviders,
    cancelSubscription,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      // Redirect to login - this should be handled by the router
      return null;
    }
    
    return <Component {...props} />;
  };
}

export default AuthContext;
