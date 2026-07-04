import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme';

// Theme-aware color palette
const getColors = (darkMode) => ({
  gold: darkMode ? '#d4a574' : '#b8860b',
  goldLight: darkMode ? '#e8c9a0' : '#daa520',
  text: {
    primary: darkMode ? '#ffffff' : '#1a1a2e',
    secondary: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    tertiary: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
  },
  bg: {
    tooltip: darkMode ? 'rgba(22, 22, 31, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    card: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
  },
  border: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
});

// Tooltip Context
const TooltipContext = createContext(null);

export const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    return { showTooltip: () => {}, hideTooltip: () => {} };
  }
  return context;
};

export const TooltipProvider = ({ children }) => {
  const { darkMode } = useTheme();
  const colors = getColors(darkMode);
  const [tooltip, setTooltip] = useState(null);

  const showTooltip = (content, position) => {
    setTooltip({ content, position });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  return (
    <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="fixed z-[300] px-3 py-2 rounded-lg text-sm max-w-xs pointer-events-none"
            style={{
              left: tooltip.position?.x || 0,
              top: tooltip.position?.y || 0,
              background: colors.bg.tooltip,
              border: `1px solid ${colors.border}`,
              boxShadow: darkMode ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.15)',
              color: colors.text.secondary,
            }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            {tooltip.content}
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipContext.Provider>
  );
};

// Premium Tooltip component (inline)
export const Tooltip = ({ children, content, position = 'top' }) => {
  const { darkMode } = useTheme();
  const colors = getColors(darkMode);
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="absolute z-50 px-3 py-2 rounded-lg text-sm whitespace-nowrap pointer-events-none"
            style={{
              left: '50%',
              ...(position === 'top' 
                ? { bottom: '100%', marginBottom: '8px' }
                : { top: '100%', marginTop: '8px' }),
              transform: 'translateX(-50%)',
              background: colors.bg.tooltip,
              border: `1px solid ${colors.border}`,
              boxShadow: darkMode ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.15)',
              color: colors.text.secondary,
            }}
            initial={{ opacity: 0, y: position === 'top' ? 5 : -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === 'top' ? 5 : -5 }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Info Tooltip (icon + tooltip)
export const InfoTooltip = ({ content }) => {
  const { darkMode } = useTheme();
  const colors = getColors(darkMode);
  
  return (
    <Tooltip content={content}>
      <span 
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs cursor-help"
        style={{
          background: colors.bg.card,
          color: colors.text.tertiary,
        }}
      >
        ?
      </span>
    </Tooltip>
  );
};

// Feature Hint (subtle inline hint)
export const FeatureHint = ({ children, hint, show = true }) => {
  const { darkMode } = useTheme();
  const colors = getColors(darkMode);
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return children;

  return (
    <div className="relative">
      {children}
      <motion.div
        className="absolute -top-1 -right-1 w-2 h-2 rounded-full cursor-pointer"
        style={{ background: colors.gold }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        onClick={() => setDismissed(true)}
      />
    </div>
  );
};

// Keyboard Shortcut Display
export const ShortcutHint = ({ keys, label }) => {
  const { darkMode } = useTheme();
  const colors = getColors(darkMode);
  
  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: colors.text.tertiary }}>
      <span>{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i} className="flex items-center">
            <kbd 
              className="px-1.5 py-0.5 rounded border font-mono"
              style={{
                background: colors.bg.card,
                borderColor: colors.border,
              }}
            >
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="mx-0.5" style={{ color: colors.text.tertiary }}>+</span>}
          </span>
        ))}
      </div>
    </div>
  );
};

// Onboarding Spotlight
export const Spotlight = ({ target, content, isVisible, onDismiss }) => {
  const { darkMode } = useTheme();
  const colors = getColors(darkMode);
  const [targetRect, setTargetRect] = useState(null);

  React.useEffect(() => {
    if (isVisible && target) {
      const el = document.querySelector(target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    }
  }, [isVisible, target]);

  if (!isVisible || !targetRect) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[400]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
    >
      {/* Darkened overlay with cutout */}
      <div 
        className="absolute inset-0"
        style={{
          background: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
          maskImage: `radial-gradient(ellipse 200px 150px at ${targetRect.left + targetRect.width/2}px ${targetRect.top + targetRect.height/2}px, transparent 50%, black 70%)`,
          WebkitMaskImage: `radial-gradient(ellipse 200px 150px at ${targetRect.left + targetRect.width/2}px ${targetRect.top + targetRect.height/2}px, transparent 50%, black 70%)`,
        }}
      />
      
      {/* Content card */}
      <motion.div
        className="absolute p-4 rounded-xl border max-w-sm"
        style={{
          left: targetRect.left,
          top: targetRect.bottom + 16,
          background: colors.bg.tooltip,
          borderColor: `${colors.gold}30`,
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>{content}</p>
        <button
          onClick={onDismiss}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldLight} 100%)`,
            color: darkMode ? '#000' : '#fff',
          }}
        >
          Got it
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Tooltip;
