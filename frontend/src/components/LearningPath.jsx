import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme';

// Theme-aware color palette
const getColors = (darkMode) => ({
  gold: darkMode ? '#d4a574' : '#b8860b',
  goldLight: darkMode ? '#e8c9a0' : '#daa520',
  purple: darkMode ? '#9d8cff' : '#7c3aed',
  cyan: darkMode ? '#6ee7b7' : '#059669',
  rose: darkMode ? '#fb7185' : '#e11d48',
  blue: darkMode ? '#60a5fa' : '#2563eb',
  text: {
    primary: darkMode ? '#ffffff' : '#1a1a2e',
    secondary: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    tertiary: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
  },
  bg: {
    primary: darkMode ? '#0a0a0f' : '#ffffff',
    secondary: darkMode ? '#12121a' : '#f8f9fa',
    card: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    cardHover: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
  },
  border: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
});

// XP and Level calculations
const calculateLevel = (xp) => Math.floor(xp / 100) + 1;
const calculateProgress = (xp) => (xp % 100);

// Custom hook for learning progress
export const useLearningPath = () => {
  const [xp, setXp] = useState(() => {
    try {
      return parseInt(localStorage.getItem('learner_xp') || '0');
    } catch {
      return 0;
    }
  });

  const addXp = (amount) => {
    setXp(prev => {
      const newXp = prev + amount;
      try {
        localStorage.setItem('learner_xp', String(newXp));
      } catch {}
      return newXp;
    });
  };

  return {
    xp,
    level: calculateLevel(xp),
    progress: calculateProgress(xp),
    addXp,
  };
};

// XP Bar Widget (compact for header)
export const XPBarWidget = ({ xp = 0, onClick }) => {
  const { darkMode } = useTheme();
  const colors = getColors(darkMode);
  const level = calculateLevel(xp);
  const progress = calculateProgress(xp);

  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-xl border transition-all"
      style={{
        background: colors.bg.card,
        borderColor: colors.border,
      }}
      whileHover={{ 
        borderColor: `${colors.gold}40`,
        backgroundColor: colors.bg.cardHover,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Level badge */}
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center font-medium text-sm"
        style={{
          background: `linear-gradient(135deg, ${colors.gold}20 0%, ${colors.gold}10 100%)`,
          border: `1px solid ${colors.gold}30`,
          color: colors.gold,
        }}
      >
        {level}
      </div>
      
      {/* XP bar */}
      <div className="w-20">
        <div className="text-xs mb-1" style={{ color: colors.text.tertiary }}>Level {level}</div>
        <div 
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${colors.gold} 0%, ${colors.goldLight} 100%)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.button>
  );
};

// Learning Path Card
const PathCard = ({ path, isExpanded, onClick, darkMode, colors }) => (
  <motion.div
    className="rounded-xl border overflow-hidden cursor-pointer"
    style={{
      background: darkMode 
        ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
        : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.01) 100%)',
      borderColor: isExpanded ? `${path.color}40` : colors.border,
    }}
    onClick={onClick}
    whileHover={{ borderColor: `${path.color}30` }}
    layout
  >
    <div className="p-4 flex items-center gap-4">
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
        style={{
          background: `linear-gradient(135deg, ${path.color}20 0%, ${path.color}10 100%)`,
          border: `1px solid ${path.color}30`,
        }}
      >
        {path.icon}
      </div>
      <div className="flex-1">
        <h3 className="font-medium" style={{ color: colors.text.primary, opacity: 0.9 }}>{path.name}</h3>
        <p className="text-xs" style={{ color: colors.text.tertiary }}>{path.skills.length} skills</p>
      </div>
      <div className="text-sm" style={{ color: colors.text.tertiary }}>
        {path.completed}/{path.skills.length}
      </div>
    </div>
    
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-4"
        >
          <div 
            className="h-2 rounded-full overflow-hidden mb-4"
            style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
          >
            <motion.div
              className="h-full"
              style={{ 
                background: `linear-gradient(90deg, ${path.color} 0%, ${path.color}80 100%)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(path.completed / path.skills.length) * 100}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {path.skills.map((skill, i) => (
              <div
                key={skill.id}
                className="px-2 py-1 rounded-lg text-xs"
                style={{
                  background: i < path.completed ? `${path.color}20` : colors.bg.card,
                  color: i < path.completed ? path.color : colors.text.tertiary,
                }}
              >
                {skill.name}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

// Full Learning Path Modal
export const LearningPathWidget = ({ isOpen, onClose }) => {
  const { darkMode } = useTheme();
  const colors = getColors(darkMode);
  const [expandedPath, setExpandedPath] = useState(null);
  const { xp, level, progress } = useLearningPath();

  const paths = [
    {
      id: 'study',
      name: 'Study Mastery',
      icon: '📚',
      color: colors.cyan,
      completed: 2,
      skills: [
        { id: 1, name: 'Note Taking', icon: '📝', tier: 'basics' },
        { id: 2, name: 'Summarizing', icon: '📋', tier: 'basics' },
        { id: 3, name: 'Active Recall', icon: '🧠', tier: 'intermediate' },
        { id: 4, name: 'Spaced Rep', icon: '📅', tier: 'advanced' },
      ],
    },
    {
      id: 'quiz',
      name: 'Quiz Champion',
      icon: '🎯',
      color: colors.purple,
      completed: 1,
      skills: [
        { id: 1, name: 'MCQ', icon: '✅', tier: 'basics' },
        { id: 2, name: 'Short Answer', icon: '✍️', tier: 'intermediate' },
        { id: 3, name: 'Essay', icon: '📄', tier: 'advanced' },
      ],
    },
    {
      id: 'streaks',
      name: 'Consistency',
      icon: '🔥',
      color: colors.gold,
      completed: 3,
      skills: [
        { id: 1, name: '3 Day Streak', icon: '3️⃣', tier: 'basics' },
        { id: 2, name: '7 Day Streak', icon: '7️⃣', tier: 'intermediate' },
        { id: 3, name: '30 Day Streak', icon: '🗓️', tier: 'advanced' },
        { id: 4, name: '100 Day Streak', icon: '💯', tier: 'expert' },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 overflow-auto"
          style={{ 
            background: darkMode 
              ? 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)' 
              : 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)' 
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 backdrop-blur-xl border-b" style={{ borderColor: colors.border }}>
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-light" style={{ color: colors.text.primary }}>Learning Path</h1>
                <div 
                  className="px-3 py-1 rounded-lg text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${colors.gold}20 0%, ${colors.gold}10 100%)`,
                    border: `1px solid ${colors.gold}30`,
                    color: colors.gold,
                  }}
                >
                  Level {level} • {xp} XP
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-xl border transition-all"
                style={{ borderColor: colors.border }}
                whileHover={{ scale: 1.05, backgroundColor: colors.bg.cardHover }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" style={{ color: colors.text.secondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* XP Progress */}
            <div className="mb-8 p-6 rounded-2xl border" style={{ 
              background: darkMode
                ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
                : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.01) 100%)',
              borderColor: colors.border,
            }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-light" style={{ color: colors.text.primary }}>Level {level}</h2>
                  <p className="text-sm" style={{ color: colors.text.tertiary }}>{100 - progress} XP to next level</p>
                </div>
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                  style={{
                    background: `linear-gradient(135deg, ${colors.gold}20 0%, ${colors.gold}10 100%)`,
                    border: `1px solid ${colors.gold}30`,
                  }}
                >
                  ⭐
                </div>
              </div>
              <div 
                className="h-3 rounded-full overflow-hidden"
                style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${colors.gold} 0%, ${colors.goldLight} 100%)`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>

            {/* Paths */}
            <h3 className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: colors.text.tertiary }}>
              Learning Paths
            </h3>
            <div className="space-y-3">
              {paths.map((path) => (
                <PathCard
                  key={path.id}
                  path={path}
                  isExpanded={expandedPath === path.id}
                  onClick={() => setExpandedPath(expandedPath === path.id ? null : path.id)}
                  darkMode={darkMode}
                  colors={colors}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LearningPathWidget;
