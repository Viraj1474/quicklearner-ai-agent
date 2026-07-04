/**
 * Auth Page Component
 * 
 * Container for authentication views:
 * - Login
 * - Register
 * - Forgot Password
 * - Reset Password
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import { useTheme } from './theme';

function AuthPage({ initialView = 'login', resetToken = null, onAuthSuccess }) {
  const [view, setView] = useState(initialView);
  const { darkMode } = useTheme();

  // Handle reset token from URL
  useEffect(() => {
    if (resetToken) {
      setView('reset-password');
    }
  }, [resetToken]);

  const handleLoginSuccess = () => {
    onAuthSuccess?.();
  };

  const handleRegisterSuccess = () => {
    onAuthSuccess?.();
  };

  const handleResetSuccess = () => {
    setView('login');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br ${
      darkMode 
        ? 'from-gray-900 via-gray-800 to-gray-900' 
        : 'from-indigo-50 via-white to-purple-50'
    }`}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full ${
          darkMode ? 'bg-indigo-900/20' : 'bg-indigo-200/50'
        } blur-3xl`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full ${
          darkMode ? 'bg-purple-900/20' : 'bg-purple-200/50'
        } blur-3xl`} />
      </div>

      {/* Auth container */}
      <div className="relative w-full max-w-md z-10">
        <AnimatePresence mode="wait">
          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Login
                onSwitchToRegister={() => setView('register')}
                onSwitchToForgotPassword={() => setView('forgot-password')}
                onLoginSuccess={handleLoginSuccess}
              />
            </motion.div>
          )}

          {view === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Register
                onSwitchToLogin={() => setView('login')}
                onRegisterSuccess={handleRegisterSuccess}
              />
            </motion.div>
          )}

          {view === 'forgot-password' && (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ForgotPassword
                onSwitchToLogin={() => setView('login')}
              />
            </motion.div>
          )}

          {view === 'reset-password' && (
            <motion.div
              key="reset-password"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ResetPassword
                token={resetToken}
                onSwitchToLogin={() => setView('login')}
                onResetSuccess={handleResetSuccess}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AuthPage;
