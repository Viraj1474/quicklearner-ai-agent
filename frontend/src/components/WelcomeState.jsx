import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme';

// Theme-aware color palette
const getColors = (darkMode) => ({
  accent: {
    gold: darkMode ? '#d4a574' : '#b8860b',
    goldLight: darkMode ? '#e8c9a0' : '#daa520',
    purple: darkMode ? '#9d8cff' : '#7c3aed',
    cyan: darkMode ? '#6ee7b7' : '#059669',
    rose: darkMode ? '#fb7185' : '#e11d48',
  },
  text: {
    primary: darkMode ? '#ffffff' : '#1a1a2e',
    secondary: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    tertiary: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
  },
  bg: {
    card: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    cardHover: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
  },
  border: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
});

// Premium gradient orb background - optimized with CSS animations and will-change
const GradientOrb = ({ className, color, delay = 0, darkMode }) => (
  <div
    className={`absolute rounded-full blur-2xl ${className}`}
    style={{
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity: darkMode ? 0.15 : 0.08,
      willChange: 'transform',
      animation: `pulse-slow 8s ease-in-out ${delay}s infinite alternate`,
    }}
  />
);

// Elegant divider
const PremiumDivider = ({ darkMode }) => (
  <div className="flex items-center gap-4 my-8">
    <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${darkMode ? 'via-white/10' : 'via-black/10'} to-transparent`} />
    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-400/60 to-amber-600/60" />
    <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${darkMode ? 'via-white/10' : 'via-black/10'} to-transparent`} />
  </div>
);

// Premium Tool Card
const ToolCard = ({ icon, title, description, accent, onClick, darkMode, colors }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full text-left p-5 rounded-2xl border transition-all duration-500"
      style={{
        background: isHovered ? colors.bg.cardHover : colors.bg.card,
        borderColor: isHovered ? `${accent}40` : colors.border,
        boxShadow: isHovered ? `0 0 40px ${accent}15` : 'none',
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${accent}10 0%, transparent 60%)`,
        }}
      />
      
      <div className="relative flex items-start gap-4">
        <div 
          className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-lg"
          style={{
            background: `linear-gradient(135deg, ${accent}20 0%, ${accent}10 100%)`,
            border: `1px solid ${accent}30`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium mb-1 tracking-wide" style={{ color: colors.text.primary, opacity: 0.9 }}>{title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: colors.text.tertiary }}>{description}</p>
        </div>
        <motion.div
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          animate={{ x: isHovered ? 0 : -8 }}
        >
          <svg className="w-5 h-5" fill="none" stroke={accent} strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </motion.div>
      </div>
    </motion.button>
  );
};

// Premium Prompt Suggestion
const PromptSuggestion = ({ text, icon, onClick, colors }) => (
  <motion.button
    onClick={onClick}
    className="group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300"
    style={{
      background: colors.bg.card,
      borderColor: colors.border,
    }}
    whileHover={{ 
      scale: 1.02,
      backgroundColor: colors.bg.cardHover,
      borderColor: 'rgba(212, 165, 116, 0.3)',
    }}
    whileTap={{ scale: 0.98 }}
  >
    <span className="text-base opacity-60 group-hover:opacity-80 transition-opacity">{icon}</span>
    <span className="text-sm group-hover:opacity-80 transition-colors" style={{ color: colors.text.secondary }}>{text}</span>
  </motion.button>
);

// Keyboard shortcut badge
const ShortcutBadge = ({ keys, colors }) => (
  <span className="inline-flex items-center gap-1">
    {keys.map((key, i) => (
      <span key={i} className="inline-flex items-center">
        <kbd 
          className="px-2 py-0.5 text-xs font-mono rounded border"
          style={{
            background: colors.bg.card,
            borderColor: colors.border,
            color: colors.text.tertiary,
          }}
        >
          {key}
        </kbd>
        {i < keys.length - 1 && <span className="mx-0.5" style={{ color: colors.text.tertiary }}>+</span>}
      </span>
    ))}
  </span>
);

// Time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Good morning', icon: '☀️' };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon', icon: '🌤️' };
  if (hour >= 17 && hour < 21) return { text: 'Good evening', icon: '🌅' };
  return { text: 'Good night', icon: '🌙' };
};

// Main Welcome State Component
export const WelcomeState = ({ userName, onPromptSelect, onToolOpen, isAuthenticated = false, isFirstTimeUser = false }) => {
  const { darkMode } = useTheme();
  const colors = getColors(darkMode);
  
  // Show "Welcome back" only for returning users (NOT first-time users)
  // First-time users see "Welcome" even after setting their nickname
  const showWelcomeBack = isAuthenticated && userName && !isFirstTimeUser;
  const greeting = getGreeting();

  const tools = [
    {
      icon: '📝',
      title: 'Smart Summarizer',
      description: 'Condense articles and notes into key insights',
      accent: colors.accent.gold,
      action: () => onToolOpen?.('summarizer'),
    },
    {
      icon: '🎯',
      title: 'Quiz Generator',
      description: 'Create adaptive quizzes from any content',
      accent: colors.accent.purple,
      action: () => onToolOpen?.('quiz'),
    },
    {
      icon: '💡',
      title: 'Flashcard Creator',
      description: 'Build spaced repetition flashcard decks',
      accent: colors.accent.cyan,
      action: () => onToolOpen?.('flashcards'),
    },
    {
      icon: '✨',
      title: 'Note Highlighter',
      description: 'Extract and organize key points automatically',
      accent: colors.accent.rose,
      action: () => onToolOpen?.('highlighter'),
    },
  ];

  const prompts = [
    { text: 'Explain quantum computing simply', icon: '🔬' },
    { text: 'Help me study for my exam', icon: '📚' },
    { text: 'Break down this concept', icon: '🧩' },
    { text: 'Create a study plan', icon: '📋' },
  ];

  return (
    <div className="relative min-h-full flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      {/* Background gradient orbs */}
      <GradientOrb 
        className="w-96 h-96 -top-48 -right-24" 
        color={colors.accent.gold}
        darkMode={darkMode}
      />
      <GradientOrb 
        className="w-80 h-80 -bottom-40 -left-20" 
        color={colors.accent.purple}
        delay={2}
        darkMode={darkMode}
      />

      {/* Main content */}
      <div className="relative w-full max-w-2xl mx-auto">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: darkMode 
                ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(212, 165, 116, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(184, 134, 11, 0.1) 0%, rgba(184, 134, 11, 0.05) 100%)',
              border: darkMode 
                ? '1px solid rgba(212, 165, 116, 0.2)'
                : '1px solid rgba(184, 134, 11, 0.2)',
            }}
          >
            <span className="text-lg">{greeting.icon}</span>
            <span className="text-sm font-medium" style={{ color: colors.accent.gold }}>
              {greeting.text}
            </span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
            <span style={{ color: colors.text.primary, opacity: 0.9 }}>
              {showWelcomeBack ? 'Welcome back' : 'Welcome'}
            </span>
            {userName && (
              <span 
                className={`block mt-2 font-medium bg-gradient-to-r ${darkMode ? 'from-amber-200 via-amber-300 to-amber-200' : 'from-amber-600 via-amber-700 to-amber-600'} bg-clip-text text-transparent`}
              >
                {userName}
              </span>
            )}
          </h1>

          <p className="text-lg font-light max-w-md mx-auto" style={{ color: colors.text.tertiary }}>
            What would you like to learn today?
          </p>
        </motion.div>

        <PremiumDivider darkMode={darkMode} />

        {/* Tools Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium uppercase tracking-wider" style={{ color: colors.text.tertiary }}>
              Learning Tools
            </h2>
            <ShortcutBadge keys={['⌘', 'K']} colors={colors} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              >
                <ToolCard
                  icon={tool.icon}
                  title={tool.title}
                  description={tool.description}
                  accent={tool.accent}
                  onClick={tool.action}
                  darkMode={darkMode}
                  colors={colors}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Prompts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <h2 className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: colors.text.tertiary }}>
            Quick Start
          </h2>
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt, index) => (
              <motion.div
                key={prompt.text}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.05 }}
              >
                <PromptSuggestion
                  text={prompt.text}
                  icon={prompt.icon}
                  onClick={() => onPromptSelect?.(prompt.text)}
                  colors={colors}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-xs" style={{ color: colors.text.tertiary }}>
            Press <ShortcutBadge keys={['/']} colors={colors} /> to focus on chat • <ShortcutBadge keys={['?']} colors={colors} /> for all shortcuts
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// Empty State (minimal version)
export const EmptyState = ({ onPromptSelect }) => {
  const { darkMode } = useTheme();
  const colors = getColors(darkMode);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full px-6 py-16"
    >
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: darkMode 
            ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(212, 165, 116, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(184, 134, 11, 0.15) 0%, rgba(184, 134, 11, 0.05) 100%)',
          border: darkMode 
            ? '1px solid rgba(212, 165, 116, 0.2)'
            : '1px solid rgba(184, 134, 11, 0.2)',
        }}
      >
        <span className="text-2xl">💬</span>
      </div>
      <h2 className="text-xl font-light mb-2" style={{ color: colors.text.primary, opacity: 0.8 }}>Start a conversation</h2>
      <p className="text-sm text-center max-w-sm" style={{ color: colors.text.tertiary }}>
        Ask anything about your studies, or try one of the learning tools above.
      </p>
    </motion.div>
  );
};

export default WelcomeState;
