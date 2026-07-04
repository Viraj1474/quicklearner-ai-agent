import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme';
import { useAuth } from './AuthContext';

// Theme-aware color palette
const getColors = (darkMode) => ({
  accent: {
    gold: darkMode ? '#d4a574' : '#b8860b',
    goldLight: darkMode ? '#e8c9a0' : '#daa520',
  },
  text: {
    primary: darkMode ? '#ffffff' : '#1a1a2e',
    secondary: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    tertiary: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
  },
  bg: {
    primary: darkMode ? '#16161f' : '#ffffff',
    secondary: darkMode ? '#0f0f15' : '#f8f9fa',
    card: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
  },
  border: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
});

// Helper to get storage key for a user's nickname
const getNicknameKey = (email) => `nickname_${email}`;

// Helper to check if user is known (has logged in before)
const isKnownUser = (email) => {
  try {
    const known = JSON.parse(localStorage.getItem('known_users') || '[]');
    return known.includes(email);
  } catch {
    return false;
  }
};

// Helper to mark user as known
const markUserAsKnown = (email) => {
  try {
    const known = JSON.parse(localStorage.getItem('known_users') || '[]');
    if (!known.includes(email)) {
      known.push(email);
      localStorage.setItem('known_users', JSON.stringify(known));
    }
  } catch {}
};

// Nickname Context
const NicknameContext = createContext(null);

export const useNickname = () => {
  const context = useContext(NicknameContext);
  if (!context) {
    return { nickname: null, setNickname: () => {}, showModal: () => {}, isFirstTimeUser: false };
  }
  return context;
};

export const NicknameProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const userEmail = user?.email || null;
  
  // isFirstTimeUser is TRUE only when:
  // - User is authenticated AND
  // - This specific user account has never logged in before (not in known_users)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  
  // Nickname for the current user
  const [nickname, setNicknameState] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // When user changes (login/logout), load their nickname and determine if first-time
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      // Load this user's nickname
      try {
        const userNickname = localStorage.getItem(getNicknameKey(userEmail));
        setNicknameState(userNickname || null);
        
        // Check if this is a known user (has logged in before)
        // First-time user = NOT in known_users list
        const alreadyDetermined = sessionStorage.getItem(`first_time_${userEmail}`);
        if (alreadyDetermined === null) {
          const isFirstTime = !isKnownUser(userEmail);
          setIsFirstTimeUser(isFirstTime);
          sessionStorage.setItem(`first_time_${userEmail}`, String(isFirstTime));
        } else {
          setIsFirstTimeUser(alreadyDetermined === 'true');
        }
      } catch {}
    } else {
      // Not logged in - reset state
      setNicknameState(null);
      setIsFirstTimeUser(false);
    }
  }, [isAuthenticated, userEmail]);

  // Handle logout event
  useEffect(() => {
    const handleLogout = () => {
      setNicknameState(null);
      setIsFirstTimeUser(false);
    };
    
    window.addEventListener('user-logout', handleLogout);
    return () => window.removeEventListener('user-logout', handleLogout);
  }, []);

  // Set nickname for the current user
  const setNickname = (name) => {
    if (!userEmail) return;
    
    setNicknameState(name);
    try {
      if (name) {
        // Save nickname for this specific user
        localStorage.setItem(getNicknameKey(userEmail), name);
        // Mark this user as known (for future logins)
        markUserAsKnown(userEmail);
      } else {
        localStorage.removeItem(getNicknameKey(userEmail));
      }
    } catch (e) {
      console.warn('Failed to save nickname:', e);
    }
  };

  const showModal = () => setIsModalOpen(true);
  const hideModal = () => setIsModalOpen(false);

  return (
    <NicknameContext.Provider value={{ nickname, setNickname, showModal, hideModal, isModalOpen, isFirstTimeUser }}>
      {children}
    </NicknameContext.Provider>
  );
};

// Premium Modal Component
export const NicknameModal = ({ isOpen, onClose, onSave, currentNickname = '' }) => {
  const { darkMode } = useTheme();
  const colors = getColors(darkMode);
  const [value, setValue] = useState(currentNickname);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue(currentNickname);
      setError('');
    }
  }, [isOpen, currentNickname]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setError('Nickname must be at least 2 characters');
      return;
    }
    if (trimmed.length > 20) {
      setError('Nickname must be 20 characters or less');
      return;
    }
    onSave(trimmed);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md rounded-2xl border overflow-hidden"
            style={{
              background: darkMode 
                ? 'linear-gradient(180deg, #16161f 0%, #0f0f15 100%)'
                : 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
              borderColor: colors.border,
              boxShadow: darkMode 
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Glow effect */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(circle at 50% 0%, ${colors.accent.gold}20 0%, transparent 50%)`,
              }}
            />

            <div className="relative p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent.gold}20 0%, ${colors.accent.gold}10 100%)`,
                    border: `1px solid ${colors.accent.gold}30`,
                  }}
                >
                  <span className="text-3xl">✨</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-light text-center mb-2" style={{ color: colors.text.primary }}>
                {currentNickname ? 'Change your nickname' : 'What should we call you?'}
              </h2>
              <p className="text-sm text-center mb-8" style={{ color: colors.text.tertiary }}>
                This is how you'll appear throughout the app
              </p>

              {/* Input */}
              <div className="mb-6">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your nickname"
                  maxLength={20}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                  style={{
                    background: colors.bg.card,
                    border: `1px solid ${error ? '#fb7185' : colors.border}`,
                    color: colors.text.primary,
                  }}
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-rose-500 mt-2"
                  >
                    {error}
                  </motion.p>
                )}
                <p className="text-xs mt-2 text-right" style={{ color: colors.text.tertiary }}>
                  {value.length}/20
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border transition-colors"
                  style={{ borderColor: colors.border, color: colors.text.secondary }}
                  whileHover={{ backgroundColor: colors.bg.card }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  className="flex-1 px-4 py-3 rounded-xl font-medium"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent.goldLight} 0%, ${colors.accent.gold} 100%)`,
                    color: darkMode ? '#000' : '#fff',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// First-time nickname prompt
export const NicknamePrompt = () => {
  const { user, isAuthenticated } = useAuth();
  const { nickname, setNickname, showModal, hideModal, isModalOpen, isFirstTimeUser } = useNickname();
  const userEmail = user?.email || null;
  
  const [hasPrompted, setHasPrompted] = useState(() => {
    try {
      // Track prompt per-user per-session
      if (!userEmail) return false;
      return sessionStorage.getItem(`nickname_prompted_${userEmail}`) === 'true';
    } catch {
      return false;
    }
  });

  // Reset hasPrompted when user changes
  useEffect(() => {
    if (userEmail) {
      try {
        const prompted = sessionStorage.getItem(`nickname_prompted_${userEmail}`) === 'true';
        setHasPrompted(prompted);
      } catch {
        setHasPrompted(false);
      }
    }
  }, [userEmail]);

  useEffect(() => {
    // Only prompt if:
    // - User is authenticated
    // - No nickname set for this user
    // - Haven't prompted this user this session
    // - Modal not already open
    if (isAuthenticated && userEmail && !nickname && !hasPrompted && !isModalOpen) {
      const timer = setTimeout(() => {
        showModal();
        setHasPrompted(true);
        try {
          sessionStorage.setItem(`nickname_prompted_${userEmail}`, 'true');
        } catch {}
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, userEmail, nickname, hasPrompted, showModal, isModalOpen]);

  return (
    <NicknameModal
      isOpen={isModalOpen}
      onClose={hideModal}
      onSave={setNickname}
      currentNickname={nickname || ''}
    />
  );
};

export default NicknameModal;
