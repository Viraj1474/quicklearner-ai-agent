import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme';

// Theme-aware color palette
const getColors = (darkMode) => ({
  gold: darkMode ? '#d4a574' : '#b8860b',
  goldLight: darkMode ? '#e8c9a0' : '#daa520',
  purple: darkMode ? '#9d8cff' : '#7c3aed',
  cyan: darkMode ? '#6ee7b7' : '#059669',
  rose: darkMode ? '#fb7185' : '#e11d48',
  text: {
    primary: darkMode ? '#ffffff' : '#1a1a2e',
    secondary: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    tertiary: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
  },
  bg: {
    modal: darkMode ? 'rgba(22, 22, 31, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  },
  border: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
});

// Celebration Context
const CelebrationContext = createContext(null);

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (!context) {
    return { celebrate: () => {}, showAchievement: () => {} };
  }
  return context;
};

// Subtle particle effect
const GlowParticle = ({ color, startX, startY, delay }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full"
    style={{
      left: startX,
      top: startY,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      boxShadow: `0 0 20px ${color}60`,
    }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1.5, 0],
      y: [0, -100 - Math.random() * 50],
      x: [0, (Math.random() - 0.5) * 100],
    }}
    transition={{
      duration: 2,
      delay,
      ease: 'easeOut',
    }}
  />
);

// Subtle success effect
const SuccessGlow = ({ isVisible, onComplete, darkMode }) => {
  const colors = getColors(darkMode);
  
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[200]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Subtle edge glow */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 1.5 }}
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${colors.gold}15 0%, transparent 70%)`,
            }}
          />
          
          {/* Particles */}
          {[...Array(12)].map((_, i) => (
            <GlowParticle
              key={i}
              color={[colors.gold, colors.purple, colors.cyan][i % 3]}
              startX={`${20 + Math.random() * 60}%`}
              startY={`${40 + Math.random() * 20}%`}
              delay={i * 0.1}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Elegant Achievement Toast
const AchievementToast = ({ achievement, isVisible, onClose, darkMode }) => {
  const colors = getColors(darkMode);
  
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && achievement && (
        <motion.div
          className="fixed bottom-8 right-8 z-[200]"
          initial={{ opacity: 0, y: 50, x: 50 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, x: 50 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div
            className="flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl"
            style={{
              background: colors.bg.modal,
              borderColor: `${colors.gold}30`,
              boxShadow: darkMode 
                ? `0 20px 40px rgba(0,0,0,0.5), 0 0 60px ${colors.gold}10`
                : `0 20px 40px rgba(0,0,0,0.15), 0 0 60px ${colors.gold}10`,
            }}
          >
            {/* Icon with glow */}
            <div className="relative">
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  background: `linear-gradient(135deg, ${colors.gold}20 0%, ${colors.gold}10 100%)`,
                  border: `1px solid ${colors.gold}30`,
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                {achievement.icon || '🏆'}
              </motion.div>
              {/* Glow ring */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  border: `2px solid ${colors.gold}`,
                  boxShadow: `0 0 20px ${colors.gold}40`,
                }}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 1, repeat: 2 }}
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: colors.gold }}>
                {achievement.type || 'Achievement'}
              </p>
              <h4 className="font-medium" style={{ color: colors.text.primary }}>{achievement.title}</h4>
              {achievement.description && (
                <p className="text-sm mt-0.5" style={{ color: colors.text.tertiary }}>{achievement.description}</p>
              )}
            </div>

            <motion.button
              onClick={onClose}
              className="ml-2 p-1 rounded-lg transition-colors"
              style={{ color: colors.text.tertiary }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Level Up Modal (subtle version)
const LevelUpModal = ({ level, isVisible, onClose, darkMode }) => {
  const colors = getColors(darkMode);
  
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' }}
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            className="relative text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Glow behind */}
            <motion.div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: colors.gold }}
              animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <motion.div
              className="relative w-24 h-24 mx-auto rounded-2xl flex items-center justify-center mb-6"
              style={{
                background: `linear-gradient(135deg, ${colors.gold}30 0%, ${colors.gold}10 100%)`,
                border: `2px solid ${colors.gold}50`,
                boxShadow: `0 0 40px ${colors.gold}30`,
              }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-5xl">⭐</span>
            </motion.div>

            <motion.p
              className="text-sm uppercase tracking-widest mb-2"
              style={{ color: colors.gold }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Level Up!
            </motion.p>

            <motion.h2
              className="text-5xl font-light mb-4"
              style={{ color: colors.text.primary }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Level {level}
            </motion.h2>

            <motion.button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm transition-colors"
              style={{
                background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldLight} 100%)`,
                color: darkMode ? '#000' : '#fff',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Celebration Provider
export const CelebrationProvider = ({ children }) => {
  const { darkMode } = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [achievement, setAchievement] = useState(null);
  const [levelUp, setLevelUp] = useState(null);

  const celebrate = useCallback((type = 'success') => {
    if (type === 'success') {
      setShowSuccess(true);
    }
  }, []);

  const showAchievement = useCallback((data) => {
    setAchievement(data);
  }, []);

  const showLevelUp = useCallback((level) => {
    setLevelUp(level);
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate, showAchievement, showLevelUp }}>
      {children}
      <SuccessGlow 
        isVisible={showSuccess} 
        onComplete={() => setShowSuccess(false)}
        darkMode={darkMode}
      />
      <AchievementToast
        achievement={achievement}
        isVisible={!!achievement}
        onClose={() => setAchievement(null)}
        darkMode={darkMode}
      />
      <LevelUpModal
        level={levelUp}
        isVisible={!!levelUp}
        onClose={() => setLevelUp(null)}
        darkMode={darkMode}
      />
    </CelebrationContext.Provider>
  );
};

export default CelebrationProvider;
