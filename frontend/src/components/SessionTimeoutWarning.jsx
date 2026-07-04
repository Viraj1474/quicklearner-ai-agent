/**
 * Session Timeout Warning Component
 * 
 * Displays a warning when user session is about to expire
 * and provides options to extend or logout.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme';
import { useAuth } from './AuthContext';
import { useSessionActivity } from './hooks/useProductivity';

const SessionTimeoutWarning = () => {
  const { darkMode } = useTheme();
  const { logout, isAuthenticated } = useAuth();
  const { showWarning, remainingTime, extendSession, isTimedOut } = useSessionActivity(25, 30);

  // Auto-logout on timeout
  React.useEffect(() => {
    if (isTimedOut && isAuthenticated) {
      logout();
    }
  }, [isTimedOut, isAuthenticated, logout]);

  if (!showWarning || !isAuthenticated) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]"
      >
        <div
          className="flex items-center gap-4 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-lg"
          style={{
            background: darkMode 
              ? 'linear-gradient(135deg, rgba(251, 113, 133, 0.15) 0%, rgba(251, 113, 133, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(225, 29, 72, 0.1) 0%, rgba(225, 29, 72, 0.05) 100%)',
            borderColor: darkMode ? 'rgba(251, 113, 133, 0.3)' : 'rgba(225, 29, 72, 0.3)',
          }}
        >
          {/* Warning icon */}
          <div className="flex-shrink-0">
            <svg 
              className="w-6 h-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke={darkMode ? '#fb7185' : '#e11d48'}
              strokeWidth="2"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>

          {/* Message */}
          <div className="flex-1">
            <p 
              className="font-medium"
              style={{ color: darkMode ? '#fb7185' : '#e11d48' }}
            >
              Session expiring soon
            </p>
            <p 
              className="text-sm"
              style={{ color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}
            >
              You'll be logged out in {formatTime(remainingTime || 0)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={extendSession}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
              style={{
                background: darkMode ? '#fb7185' : '#e11d48',
                color: '#fff',
              }}
            >
              Stay Logged In
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all border"
              style={{
                borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                color: darkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SessionTimeoutWarning;
