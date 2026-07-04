/**
 * Register Component
 * 
 * Features:
 * - User registration with email/password
 * - Role selection (User or Client)
 * - Google OAuth signup
 * - Form validation
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { useTheme } from './theme';

// Google OAuth client ID
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const { register, googleLogin, error, clearError, loading } = useAuth();
  const { darkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'user', // 'user' or 'client'
    agreeToTerms: false,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
    setFormError('');
  }, [clearError]);

  // Load Google Sign-In script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });
      window.google?.accounts.id.renderButton(
        document.getElementById('google-signup-btn'),
        {
          theme: darkMode ? 'filled_black' : 'outline',
          size: 'large',
          width: '100%',
          text: 'signup_with',
        }
      );
    };

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [darkMode]);

  const handleGoogleCallback = async (response) => {
    try {
      setIsSubmitting(true);
      setFormError('');
      await googleLogin(response.credential);
      onRegisterSuccess?.();
    } catch (err) {
      setFormError(err.message || 'Google signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password) {
      return 'Please fill in all required fields';
    }
    if (formData.username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (!formData.agreeToTerms) {
      return 'Please agree to the Terms of Service';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName || null,
        last_name: formData.lastName || null,
        role: formData.role,
      });
      onRegisterSuccess?.();
    } catch (err) {
      setFormError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">Q</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create an account
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Start your learning journey today
          </p>
        </div>

        {/* Error message */}
        {(formError || error) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm"
          >
            {formError || error}
          </motion.div>
        )}

        {/* Register form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                placeholder="John"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                placeholder="Doe"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Username field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              placeholder="johndoe"
              disabled={isSubmitting}
            />
          </div>

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              placeholder="you@example.com"
              disabled={isSubmitting}
            />
          </div>

          {/* Password fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.role === 'user'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={formData.role === 'user'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <span className="text-2xl">👤</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">User</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Personal learning</p>
                </div>
              </label>
              <label
                className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.role === 'client'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={formData.role === 'client'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <span className="text-2xl">💼</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">Client</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Business account</p>
                </div>
              </label>
            </div>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              I agree to the{' '}
              <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={isSubmitting || loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              'Create account'
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">
              Or sign up with
            </span>
          </div>
        </div>

        {/* Google Sign-Up button */}
        <div id="google-signup-btn" className="flex justify-center"></div>
        
        {!GOOGLE_CLIENT_ID && (
          <button
            type="button"
            disabled
            className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 cursor-not-allowed opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google Sign-Up (Configure GOOGLE_CLIENT_ID)
          </button>
        )}

        {/* Login link */}
        <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </motion.div>
  );
}

export default Register;
