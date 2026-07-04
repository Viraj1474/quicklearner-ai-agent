import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';

// Google Client ID - set this in your .env file as REACT_APP_GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const DEVELOPER_EMAIL = (process.env.REACT_APP_DEVELOPER_EMAIL || '').trim().toLowerCase();

// Auth Modal - Overlays on the app like ChatGPT/Gemini style
function AuthModal({ initialView = 'login', onClose, onAuthSuccess, onSwitchView }) {
  const [currentView, setCurrentView] = useState(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [loginAudience, setLoginAudience] = useState('user');
  const googleButtonRef = useRef(null);
  const googleInitIntervalRef = useRef(null);
  const googleInitTimeoutRef = useRef(null);
  
  const { login, register, googleLogin, forgotPassword } = useAuth();
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: 'user'
  });
  const [forgotForm, setForgotForm] = useState({ email: '' });

  useEffect(() => {
    setCurrentView(initialView);
    setError('');
    setSuccess('');
  }, [initialView]);

  useEffect(() => {
    if (currentView !== 'login') {
      setLoginAudience('user');
    }
  }, [currentView]);

  const handleViewChange = (view) => {
    setCurrentView(view);
    setError('');
    setSuccess('');
    onSwitchView?.(view);
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (loginAudience === 'developer' && DEVELOPER_EMAIL && loginForm.email.trim().toLowerCase() !== DEVELOPER_EMAIL) {
      setError('Developer access is restricted to the approved email address.');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(loginForm.email, loginForm.password);
      // API returns { user, access_token, refresh_token } on success
      if (result && result.user) {
        onAuthSuccess?.(result.user);
      } else {
        setError('Login failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (registerForm.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await register({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        first_name: registerForm.first_name,
        last_name: registerForm.last_name,
        role: registerForm.role
      });
      
      // API returns { user, access_token, refresh_token } on success
      if (result && result.user) {
        onAuthSuccess?.(result.user);
      } else {
        setError('Registration failed');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      const result = await forgotPassword(forgotForm.email);
      if (result.success) {
        setSuccess('Password reset instructions have been sent to your email');
        setForgotForm({ email: '' });
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleCallback = useCallback(async (response) => {
    if (response.credential) {
      setIsLoading(true);
      setError('');
      try {
        const result = await googleLogin(response.credential);
        if (result && result.user) {
          if (loginAudience === 'developer' && DEVELOPER_EMAIL && result.user.email?.trim().toLowerCase() !== DEVELOPER_EMAIL) {
            setError('Developer access is restricted to the approved email address.');
            return;
          }
          onAuthSuccess?.(result.user);
        } else {
          setError('Google login failed. Please try again.');
        }
      } catch (err) {
        setError(err.message || 'Google login failed');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('No credential received from Google.');
    }
  }, [googleLogin, onAuthSuccess, loginAudience]);

  const clearGoogleInitTimers = useCallback(() => {
    if (googleInitIntervalRef.current) {
      clearInterval(googleInitIntervalRef.current);
      googleInitIntervalRef.current = null;
    }
    if (googleInitTimeoutRef.current) {
      clearTimeout(googleInitTimeoutRef.current);
      googleInitTimeoutRef.current = null;
    }
  }, []);

  const initializeGoogleSignIn = useCallback(() => {
    clearGoogleInitTimers();
    setGoogleError('');
    setGoogleLoading(true);

    console.log('GOOGLE_CLIENT_ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
    console.log('window.google:', window.google);

    if (googleButtonRef.current) {
      googleButtonRef.current.innerHTML = '';
    }

    if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      setGoogleError('Missing Google Client ID');
      setGoogleLoading(false);
      return;
    }

    const tryInitialize = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup',
          context: 'signin',
          itp_support: true,
        });

        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: 300,
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          }
        );

        setGoogleError('');
        setGoogleLoading(false);
        return true;
      } catch (err) {
        console.error('Google Sign-In init error:', err);
        setGoogleError('Google Sign-In unavailable. Check GOOGLE_CLIENT_ID or browser extensions.');
        setGoogleLoading(false);
        return true;
      }
    };

    if (tryInitialize()) {
      return;
    }

    googleInitIntervalRef.current = setInterval(() => {
      if (tryInitialize()) {
        clearGoogleInitTimers();
      }
    }, 100);

    googleInitTimeoutRef.current = setTimeout(() => {
      clearGoogleInitTimers();
      if (!window.google?.accounts) {
        setGoogleError('Google Sign-In unavailable. Check GOOGLE_CLIENT_ID or browser extensions.');
        setGoogleLoading(false);
      }
    }, 5000);
  }, [clearGoogleInitTimers, handleGoogleCallback]);

  useEffect(() => {
    if (currentView === 'login') {
      initializeGoogleSignIn();
    } else {
      clearGoogleInitTimers();
      setGoogleLoading(false);
      setGoogleError('');
    }

    return () => {
      clearGoogleInitTimers();
    };
  }, [currentView, initializeGoogleSignIn, clearGoogleInitTimers]);

  const handleRetryGoogleSignIn = () => {
    initializeGoogleSignIn();
  };

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md max-h-[calc(100vh-1rem)] sm:max-h-[90vh] bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {currentView === 'login' && 'Welcome back'}
            {currentView === 'register' && 'Create account'}
            {currentView === 'forgot-password' && 'Reset password'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-4 sm:p-6">
          {/* Error/Success messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm"
            >
              {success}
            </motion.div>
          )}

          {/* Login Form */}
          {currentView === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Login as
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginAudience('user')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${loginAudience === 'user' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-200' : 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                  >
                    User
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginAudience('developer')}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${loginAudience === 'developer' ? 'border-violet-600 bg-violet-50 text-violet-700 dark:border-violet-400 dark:bg-violet-900/30 dark:text-violet-200' : 'border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                  >
                    Developer
                  </button>
                </div>
                {loginAudience === 'developer' && DEVELOPER_EMAIL && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Developer access is restricted to {DEVELOPER_EMAIL}.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleViewChange('forgot-password')}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
              
              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">or</span>
                </div>
              </div>
              
              {/* Google Login - Rendered by Google Identity Services */}
              {GOOGLE_CLIENT_ID ? (
                <>
                  <div 
                    id="google-signin-button" 
                    ref={googleButtonRef}
                    className="w-full flex justify-center min-h-[44px]"
                  >
                    {googleLoading && (
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-sm">Loading Google Sign-In...</span>
                      </div>
                    )}
                  </div>
                  {googleError && (
                    <div className="mt-2 text-center">
                      <p className="text-sm text-red-600 dark:text-red-300">{googleError}</p>
                      <button
                        type="button"
                        onClick={handleRetryGoogleSignIn}
                        className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Retry Google Sign-In
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-sm text-gray-500 py-2">
                  Missing Google Client ID
                </div>
              )}
            </form>
          )}

          {/* Register Form */}
          {currentView === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={registerForm.first_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={registerForm.last_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder="johndoe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Type
                </label>
                <select
                  value={registerForm.role}
                  onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                >
                  <option value="user">Learner</option>
                  <option value="client">Educator / Client</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder="Confirm your password"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </>
                ) : 'Create account'}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {currentView === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={forgotForm.email}
                  onChange={(e) => setForgotForm({ email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : 'Send reset link'}
              </button>
              
              <button
                type="button"
                onClick={() => handleViewChange('login')}
                className="w-full py-2.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to sign in
              </button>
            </form>
          )}
        </div>

        {/* Footer - Toggle between login/register */}
        {(currentView === 'login' || currentView === 'register') && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
            {currentView === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => handleViewChange('register')}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => handleViewChange('login')}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default AuthModal;
