/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls:
 * - Login/Register
 * - Google OAuth
 * - Password reset
 * - Token management
 * - User profile
 * - Rate limiting awareness
 * - Retry logic with exponential backoff
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
// Refresh tokens are kept in sessionStorage to reduce long-lived token exposure.
// This is safe because:
// - RefreshTokens have limited lifetime (per-session)
// - localStorage tokens are persistent across sessions (higher risk)
// - sessionStorage is cleared when the browser tab closes
// - The app uses Authorization headers (Bearer tokens), not cookies
// - CSRF is less of a risk without cookie-based auth
// Note: If the user closes the tab, they must log in again. This is the intended behavior.
const USER_KEY = 'user';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const RATE_LIMIT_KEY = 'rate_limit_until';

// Rate limit tracking
let rateLimitedUntil = null;

const notifySessionExpired = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
  }
};

// ===== TOKEN MANAGEMENT =====

/**
 * Store tokens and user data in localStorage
 */
export const storeAuthData = (accessToken, refreshToken, user, expiresIn = 3600) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Store token expiry time
  const expiryTime = Date.now() + (expiresIn * 1000);
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryTime));
};

/**
 * Clear all auth data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

/**
 * Get stored access token
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get stored refresh token
 */
export const getRefreshToken = () => {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Get stored user data
 */
export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

/**
 * Check if user is authenticated (has valid token)
 */
export const isAuthenticated = () => {
  const token = getAccessToken();
  if (!token) return false;
  
  // Check if token is expired
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (expiry && Date.now() > parseInt(expiry)) {
    return false;
  }
  
  return true;
};

/**
 * Check if token will expire soon (within 5 minutes)
 */
export const isTokenExpiringSoon = () => {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return false;
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() + fiveMinutes > parseInt(expiry);
};

/**
 * Check if we're rate limited
 */
export const isRateLimited = () => {
  if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
    return true;
  }
  const stored = localStorage.getItem(RATE_LIMIT_KEY);
  if (stored && Date.now() < parseInt(stored)) {
    rateLimitedUntil = parseInt(stored);
    return true;
  }
  return false;
};

/**
 * Set rate limit
 */
const setRateLimit = (retryAfterSeconds = 60) => {
  rateLimitedUntil = Date.now() + (retryAfterSeconds * 1000);
  localStorage.setItem(RATE_LIMIT_KEY, String(rateLimitedUntil));
};

// ===== API HELPER =====

/**
 * Sleep helper for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make authenticated API call with automatic token refresh and retry logic
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @param {number} retries - Number of retry attempts (default: 2)
 */
export const authFetch = async (endpoint, options = {}, retries = 2) => {
  // Check rate limiting
  if (isRateLimited()) {
    throw new Error('Too many requests. Please wait a moment and try again.');
  }

  // Proactively refresh token if expiring soon
  if (isTokenExpiringSoon() && getRefreshToken()) {
    await refreshAccessToken();
  }

  const accessToken = getAccessToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        setRateLimit(retryAfter);
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      // If 401, try to refresh token
      if (response.status === 401 && getRefreshToken()) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry with new token
          headers['Authorization'] = `Bearer ${getAccessToken()}`;
          response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
        } else {
          notifySessionExpired();
          throw new Error('Session expired. Please log in again.');
        }
      }

      if (response.status === 401 && !getRefreshToken()) {
        clearAuthData();
        notifySessionExpired();
        throw new Error('Authentication required. Please log in.');
      }
      
      // Handle server errors with retry
      if (response.status >= 500 && attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await sleep(delay);
        continue;
      }

      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }
      
      if (!response.ok) {
        const error = new Error((data && data.detail) || `Request failed (${response.status})`);
        error.status = response.status;
        error.detail = data && data.detail ? data.detail : null;
        error.endpoint = endpoint;
        throw error;
      }
      
      return data;
    } catch (error) {
      lastError = error;
      
      // Only retry on network errors
      if (error.name === 'TypeError' && attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        await sleep(delay);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error('Request failed after retries');
};

// ===== AUTHENTICATION ENDPOINTS =====

/**
 * Register a new user
 */
export const register = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || 'Registration failed');
  }
  
  // Store tokens and user data
  storeAuthData(data.access_token, data.refresh_token, data.user);
  
  return data;
};

/**
 * Login with email and password
 */
export const login = async (email, password, rememberMe = false) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, remember_me: rememberMe }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || 'Login failed');
  }
  
  // Store tokens and user data
  storeAuthData(data.access_token, data.refresh_token, data.user);
  
  return data;
};

/**
 * Login with Google OAuth
 */
export const googleLogin = async (credential) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || 'Google login failed');
  }
  
  // Store tokens and user data
  storeAuthData(data.access_token, data.refresh_token, data.user);
  
  return data;
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) {
      clearAuthData();
      return false;
    }
    
    const data = await response.json();
    storeAuthData(data.access_token, data.refresh_token, data.user);
    
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuthData();
    return false;
  }
};

/**
 * Logout current user
 */
export const logout = async () => {
  const refreshToken = getRefreshToken();
  
  try {
    if (refreshToken) {
      await authFetch('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAuthData();
  }
};

/**
 * Logout from all devices
 */
export const logoutAllDevices = async () => {
  try {
    await authFetch('/api/auth/logout-all', { method: 'POST' });
  } catch (error) {
    console.error('Logout all error:', error);
  } finally {
    clearAuthData();
  }
};

// ===== PASSWORD RESET =====

/**
 * Request password reset email
 */
export const forgotPassword = async (email) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to send reset email');
  }
  
  return data;
};

/**
 * Reset password with token
 */
export const resetPassword = async (token, newPassword, confirmPassword) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || 'Password reset failed');
  }
  
  return data;
};

// ===== USER PROFILE =====

/**
 * Get current user profile
 */
export const getProfile = async () => {
  return await authFetch('/api/auth/me');
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData) => {
  const data = await authFetch('/api/auth/me', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
  
  // Update stored user data
  localStorage.setItem(USER_KEY, JSON.stringify(data));
  
  return data;
};

/**
 * Change password
 */
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  return await authFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
};

/**
 * Delete user account
 */
export const deleteAccount = async () => {
  const data = await authFetch('/api/auth/me', { method: 'DELETE' });
  clearAuthData();
  return data;
};

/**
 * Get available billing plans
 */
export const getBillingPlans = async () => {
  const response = await fetch(`${API_BASE_URL}/api/billing/plans`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load billing plans');
  }

  return data;
};

/**
 * Get the current user's subscription status
 */
export const getSubscriptionStatus = async () => {
  return await authFetch('/api/billing/subscription');
};

/**
 * Activate or change a subscription billing cycle
 */
export const subscribeToPlan = async (billingCycle) => {
  const data = await authFetch('/api/billing/subscribe', {
    method: 'POST',
    body: JSON.stringify({ billing_cycle: billingCycle }),
  });

  if (data?.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return data;
};

/**
 * Create a Stripe Checkout session for a billing cycle
 */
export const createCheckoutSession = async (planOrBillingCycle, provider = null) => {
  if (typeof planOrBillingCycle === 'object' && planOrBillingCycle !== null) {
    return await authFetch('/api/billing/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(planOrBillingCycle),
    });
  }

  const plan = planOrBillingCycle === 'yearly' || planOrBillingCycle === 'pro_yearly' ? 'pro_yearly' : 'pro_monthly';
  const billingCycle = plan === 'pro_yearly' ? 'yearly' : 'monthly';

  return await authFetch('/api/billing/checkout-session', {
    method: 'POST',
    body: JSON.stringify({ billing_cycle: billingCycle, provider, plan }),
  });
};

/**
 * Verify Razorpay payment signature.
 */
export const verifyRazorpayPayment = async (payload) => {
  return await authFetch('/api/billing/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Create customer portal session (Stripe).
 */
export const createCustomerPortal = async (returnUrl) => {
  return await authFetch('/api/billing/create-customer-portal', {
    method: 'POST',
    body: JSON.stringify({ return_url: returnUrl }),
  });
};

/**
 * Fetch billing history rows for profile pages.
 */
export const getBillingHistory = async () => {
  return await authFetch('/api/billing/history');
};

/**
 * Cancel the current subscription
 */
export const cancelSubscription = async () => {
  const data = await authFetch('/api/billing/cancel', { method: 'POST' });

  if (data?.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return data;
};

/**
 * Check authentication status
 */
export const checkAuthStatus = async () => {
  try {
    return await authFetch('/api/auth/status');
  } catch (error) {
    return { is_authenticated: false };
  }
};

export default {
  // Token management
  storeAuthData,
  clearAuthData,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  isAuthenticated,
  
  // Auth endpoints
  register,
  login,
  googleLogin,
  refreshAccessToken,
  logout,
  logoutAllDevices,
  
  // Password reset
  forgotPassword,
  resetPassword,
  
  // Profile
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  checkAuthStatus,
  getBillingPlans,
  getSubscriptionStatus,
  subscribeToPlan,
  createCheckoutSession,
  verifyRazorpayPayment,
  createCustomerPortal,
  getBillingHistory,
  cancelSubscription,
  authFetch,
};
