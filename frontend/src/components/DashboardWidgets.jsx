import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme';
import SubscriptionStatusCard from './premium/SubscriptionStatusCard';

// Theme-aware color palette
const getColors = (darkMode) => ({
  accent: {
    gold: darkMode ? '#d4a574' : '#b8860b',
    goldLight: darkMode ? '#e8c9a0' : '#daa520',
    purple: darkMode ? '#9d8cff' : '#7c3aed',
    cyan: darkMode ? '#6ee7b7' : '#059669',
    rose: darkMode ? '#fb7185' : '#e11d48',
    blue: darkMode ? '#60a5fa' : '#2563eb',
  },
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

// Premium Card Component
const PremiumCard = ({ children, className = '', glow, onClick, darkMode, colors }) => (
  <motion.div
    onClick={onClick}
    className={`relative rounded-2xl border backdrop-blur-sm ${onClick ? 'cursor-pointer' : ''} ${className}`}
    style={{
      background: darkMode 
        ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)'
        : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.01) 100%)',
      borderColor: colors.border,
      boxShadow: glow ? `0 0 60px ${glow}10` : 'none',
    }}
    whileHover={onClick ? { scale: 1.01, borderColor: `${glow || colors.accent.gold}30` } : {}}
    whileTap={onClick ? { scale: 0.99 } : {}}
  >
    {glow && (
      <div 
        className="absolute inset-0 rounded-2xl opacity-30"
        style={{
          background: `radial-gradient(circle at 20% 20%, ${glow}15 0%, transparent 50%)`,
        }}
      />
    )}
    <div className="relative">{children}</div>
  </motion.div>
);

// Stats Card with animated counter
const StatCard = ({ icon, label, value, suffix = '', trend, trendUp, accent, darkMode, colors }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numValue = parseInt(value) || 0;
    const duration = 1000;
    const steps = 30;
    const increment = numValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setDisplayValue(numValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <PremiumCard className="p-5" glow={accent} darkMode={darkMode} colors={colors}>
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{
            background: `linear-gradient(135deg, ${accent}20 0%, ${accent}10 100%)`,
            border: `1px solid ${accent}30`,
          }}
        >
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={trendUp ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} 
              />
            </svg>
            {trend}
          </div>
        )}
      </div>
      <div className="text-3xl font-light mb-1" style={{ color: colors.text.primary }}>
        {displayValue}<span className="text-lg" style={{ color: colors.text.tertiary }}>{suffix}</span>
      </div>
      <div className="text-sm" style={{ color: colors.text.tertiary }}>{label}</div>
    </PremiumCard>
  );
};

// Streak Display with flame animation
const StreakDisplay = ({ streak = 0, darkMode, colors }) => {
  const flames = ['🔥', '🔥', '🔥'];
  const activeFlames = Math.min(Math.floor(streak / 3) + 1, 3);

  return (
    <PremiumCard className="p-5" glow={colors.accent.gold} darkMode={darkMode} colors={colors}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm mb-1" style={{ color: colors.text.tertiary }}>Current Streak</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-light" style={{ color: colors.text.primary }}>{streak}</span>
            <span style={{ color: colors.text.tertiary }}>days</span>
          </div>
        </div>
        <div className="flex gap-1">
          {flames.map((flame, i) => (
            <motion.span
              key={i}
              className="text-2xl"
              style={{ opacity: i < activeFlames ? 1 : 0.2 }}
              animate={i < activeFlames ? {
                scale: [1, 1.2, 1],
                rotate: [-5, 5, -5],
              } : {}}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            >
              {flame}
            </motion.span>
          ))}
        </div>
      </div>
      <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${colors.accent.gold} 0%, ${colors.accent.rose} 100%)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((streak % 7) / 7 * 100, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <div className="text-xs mt-2" style={{ color: colors.text.tertiary }}>
        {7 - (streak % 7)} days until weekly milestone
      </div>
    </PremiumCard>
  );
};

// Today's Goals Widget
const GoalsWidget = ({ goals = [], darkMode, colors }) => {
  const [localGoals, setLocalGoals] = useState(goals);

  const toggleGoal = (id) => {
    setLocalGoals(prev => 
      prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
    );
  };

  const defaultGoals = [
    { id: 1, text: 'Complete 2 quiz sessions', completed: false },
    { id: 2, text: 'Review flashcards', completed: true },
    { id: 3, text: 'Study for 30 minutes', completed: false },
  ];

  const displayGoals = localGoals.length > 0 ? localGoals : defaultGoals;
  const completedCount = displayGoals.filter(g => g.completed).length;

  return (
    <PremiumCard className="p-5" glow={colors.accent.cyan} darkMode={darkMode} colors={colors}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: colors.text.tertiary }}>Today's Goals</h3>
        <span className="text-xs px-2 py-1 rounded-full" style={{ 
          background: darkMode ? 'rgba(110, 231, 183, 0.1)' : 'rgba(5, 150, 105, 0.1)',
          color: colors.accent.cyan,
        }}>
          {completedCount}/{displayGoals.length}
        </span>
      </div>
      <div className="space-y-3">
        {displayGoals.map((goal, index) => (
          <motion.button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className="w-full flex items-center gap-3 group text-left"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div 
              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                goal.completed ? 'bg-emerald-500/20 border-emerald-500/50' : ''
              }`}
              style={{ borderColor: goal.completed ? undefined : colors.border }}
            >
              {goal.completed && (
                <motion.svg 
                  className="w-3 h-3 text-emerald-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </motion.svg>
              )}
            </div>
            <span className={`text-sm transition-all ${goal.completed ? 'line-through' : ''}`} 
              style={{ color: goal.completed ? colors.text.tertiary : colors.text.secondary }}>
              {goal.text}
            </span>
          </motion.button>
        ))}
      </div>
    </PremiumCard>
  );
};

// Quick Actions Widget
const QuickActionsWidget = ({ onAction, darkMode, colors }) => {
  const actions = [
    { id: 'quiz', icon: '🎯', label: 'Quick Quiz', color: colors.accent.purple },
    { id: 'flashcards', icon: '💡', label: 'Flashcards', color: colors.accent.cyan },
    { id: 'summarize', icon: '📝', label: 'Summarize', color: colors.accent.gold },
    { id: 'ask', icon: '💬', label: 'Ask AI', color: colors.accent.rose },
  ];

  return (
    <PremiumCard className="p-5" glow={colors.accent.purple} darkMode={darkMode} colors={colors}>
      <h3 className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: colors.text.tertiary }}>Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <motion.button
            key={action.id}
            onClick={() => onAction?.(action.id)}
            className="flex items-center gap-2 p-3 rounded-xl border transition-all"
            style={{
              background: colors.bg.card,
              borderColor: colors.border,
            }}
            whileHover={{ 
              scale: 1.02,
              backgroundColor: colors.bg.cardHover,
              borderColor: `${action.color}40`,
            }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-lg">{action.icon}</span>
            <span className="text-sm" style={{ color: colors.text.secondary }}>{action.label}</span>
          </motion.button>
        ))}
      </div>
    </PremiumCard>
  );
};

// Activity Feed Widget
const ActivityFeed = ({ activities = [], darkMode, colors }) => {
  const defaultActivities = [
    { id: 1, type: 'quiz', text: 'Completed Biology quiz', time: '2h ago', score: '85%' },
    { id: 2, type: 'flashcard', text: 'Reviewed 20 flashcards', time: '4h ago' },
    { id: 3, type: 'study', text: 'Studied Chemistry', time: '1d ago', duration: '45m' },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  const getIcon = (type) => {
    switch (type) {
      case 'quiz': return '🎯';
      case 'flashcard': return '💡';
      case 'study': return '📚';
      default: return '📌';
    }
  };

  return (
    <PremiumCard className="p-5" glow={colors.accent.blue} darkMode={darkMode} colors={colors}>
      <h3 className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: colors.text.tertiary }}>Recent Activity</h3>
      <div className="space-y-4">
        {displayActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            className="flex items-start gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="text-base mt-0.5">{getIcon(activity.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm" style={{ color: colors.text.secondary }}>{activity.text}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color: colors.text.tertiary }}>{activity.time}</span>
                {activity.score && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                    {activity.score}
                  </span>
                )}
                {activity.duration && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                    {activity.duration}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </PremiumCard>
  );
};

// Main Dashboard Component
export const DashboardWidgets = ({ 
  userName, 
  onClose, 
  onAction,
  onEditNickname,
  subscription,
  onOpenPricing,
  onManageBilling,
  stats = {},
}) => {
  const { darkMode } = useTheme();
  const colors = getColors(darkMode);
  
  const defaultStats = {
    studyTime: stats.studyTime || 127,
    quizzes: stats.quizzes || 24,
    flashcards: stats.flashcards || 156,
    streak: stats.streak || 5,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-full overflow-auto"
      style={{ background: darkMode ? 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b" style={{ borderColor: colors.border }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-light" style={{ color: colors.text.primary }}>
              Dashboard
            </h1>
            {userName && (
              <div className="flex items-center gap-2">
                <span style={{ color: colors.text.tertiary }}>—</span>
                <span style={{ color: colors.text.secondary }}>{userName}</span>
                {onEditNickname && (
                  <button
                    onClick={onEditNickname}
                    className="p-1 rounded-lg transition-colors"
                    style={{ color: colors.text.tertiary }}
                    title="Edit nickname"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <SubscriptionStatusCard
            user={subscription}
            onUpgrade={onOpenPricing}
            onManage={onManageBilling}
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="⏱️"
            label="Study Time"
            value={defaultStats.studyTime}
            suffix=" min"
            trend="+12%"
            trendUp
            accent={colors.accent.gold}
            darkMode={darkMode}
            colors={colors}
          />
          <StatCard
            icon="🎯"
            label="Quizzes Completed"
            value={defaultStats.quizzes}
            trend="+3"
            trendUp
            accent={colors.accent.purple}
            darkMode={darkMode}
            colors={colors}
          />
          <StatCard
            icon="💡"
            label="Cards Reviewed"
            value={defaultStats.flashcards}
            accent={colors.accent.cyan}
            darkMode={darkMode}
            colors={colors}
          />
          <StreakDisplay streak={defaultStats.streak} darkMode={darkMode} colors={colors} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <GoalsWidget darkMode={darkMode} colors={colors} />
            <ActivityFeed darkMode={darkMode} colors={colors} />
          </div>
          <div className="space-y-4">
            <QuickActionsWidget onAction={onAction} darkMode={darkMode} colors={colors} />
            
            {/* Pro Tip Card */}
            <PremiumCard className="p-5" glow={colors.accent.rose} darkMode={darkMode} colors={colors}>
              <div className="flex items-start gap-3">
                <span className="text-xl">💎</span>
                <div>
                  <h4 className="text-sm font-medium mb-1" style={{ color: colors.text.primary, opacity: 0.8 }}>Pro Tip</h4>
                  <p className="text-xs leading-relaxed" style={{ color: colors.text.tertiary }}>
                    Use spaced repetition for flashcards. Review cards just before you're about to forget them for maximum retention.
                  </p>
                </div>
              </div>
            </PremiumCard>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardWidgets;
