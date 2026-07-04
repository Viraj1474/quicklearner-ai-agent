/**
 * Quick Actions Button
 * 
 * Floating action button with quick access to common actions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme';
import { useAuth } from './AuthContext';

const QuickActionsButton = ({ 
  onNewChat, 
  onOpenTool, 
  onOpenCommand, 
  position = 'bottom-right' 
}) => {
  const { darkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-20 right-6',
    'top-left': 'top-20 left-6',
  };

  const actions = [
    {
      id: 'command',
      icon: '⌘',
      label: 'Command Palette',
      shortcut: 'Ctrl+K',
      action: onOpenCommand,
      color: '#9d8cff',
    },
    {
      id: 'new-chat',
      icon: '💬',
      label: 'New Chat',
      action: onNewChat,
      color: '#6ee7b7',
      requiresAuth: true,
    },
    {
      id: 'quiz',
      icon: '🎯',
      label: 'Quiz',
      action: () => onOpenTool?.('quiz'),
      color: '#fb7185',
      requiresAuth: true,
    },
    {
      id: 'flashcards',
      icon: '💡',
      label: 'Flashcards',
      action: () => onOpenTool?.('flashcards'),
      color: '#fbbf24',
      requiresAuth: true,
    },
  ];

  const visibleActions = actions.filter(a => !a.requiresAuth || isAuthenticated);

  const colors = {
    bg: darkMode ? '#1a1a2e' : '#ffffff',
    bgHover: darkMode ? '#252542' : '#f3f4f6',
    text: darkMode ? '#fff' : '#1a1a2e',
    border: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    shadow: darkMode 
      ? '0 10px 40px rgba(0,0,0,0.5)' 
      : '0 10px 40px rgba(0,0,0,0.1)',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 mb-2"
          >
            <div
              className="rounded-2xl border overflow-hidden backdrop-blur-lg"
              style={{
                background: colors.bg,
                borderColor: colors.border,
                boxShadow: colors.shadow,
              }}
            >
              {visibleActions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    action.action?.();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                  style={{ color: colors.text }}
                  onMouseEnter={(e) => e.currentTarget.style.background = colors.bgHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ 
                      background: `${action.color}20`,
                      border: `1px solid ${action.color}40`,
                    }}
                  >
                    {action.icon}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{action.label}</p>
                    {action.shortcut && (
                      <p 
                        className="text-xs opacity-50"
                        style={{ color: colors.text }}
                      >
                        {action.shortcut}
                      </p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
        style={{
          background: darkMode 
            ? 'linear-gradient(135deg, #d4a574 0%, #b8860b 100%)'
            : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          boxShadow: darkMode
            ? '0 4px 20px rgba(212, 165, 116, 0.4)'
            : '0 4px 20px rgba(124, 58, 237, 0.4)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke={darkMode ? '#000' : '#fff'}
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickActionsButton;
