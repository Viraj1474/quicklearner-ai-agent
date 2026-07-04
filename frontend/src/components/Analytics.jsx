import React, { useEffect, useState } from "react";
import * as aiService from "./services/aiService";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

// Circular progress component
const CircularProgress = ({ value, color, size = 100, strokeWidth = 8, showValue = true, label = "" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" className="opacity-10" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} stroke={color} fill="transparent"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }} strokeLinecap="round"
        />
      </svg>
      {showValue && (
        <motion.div className="absolute flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <span className="text-2xl font-bold">{value}%</span>
          {label && <span className="text-xs opacity-60">{label}</span>}
        </motion.div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, subtitle, trend, trendUp, color, delay = 0 }) => {
  const { darkMode } = useTheme();
  return (
    <motion.div
      className={`p-5 rounded-2xl border backdrop-blur-sm ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02, boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 40px rgba(0,0,0,0.1)' }}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            <svg className={`w-3 h-3 ${trendUp ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {trend}
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</div>
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</div>
        {subtitle && <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{subtitle}</div>}
      </div>
    </motion.div>
  );
};

// Learning Heatmap Component (GitHub-style)
const LearningHeatmap = ({ darkMode }) => {
  const weeks = 12;
  const days = 7;
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  
  // Generate random activity data
  const generateData = () => {
    const data = [];
    for (let w = 0; w < weeks; w++) {
      const week = [];
      for (let d = 0; d < days; d++) {
        week.push(Math.floor(Math.random() * 5)); // 0-4 activity levels
      }
      data.push(week);
    }
    return data;
  };
  
  const [activityData] = useState(generateData);
  
  const getColor = (level) => {
    if (darkMode) {
      const colors = ['#1a1a1a', '#0e4429', '#006d32', '#26a641', '#39d353'];
      return colors[level];
    }
    const colors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
    return colors[level];
  };

  return (
    <motion.div
      className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Learning Activity</h3>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Last 12 weeks of study sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap sm:flex-nowrap">
          <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>Less</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(level) }} />
          ))}
          <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>More</span>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-1">
        {/* Day labels */}
        <div className="flex flex-row sm:flex-col gap-1 pr-2 overflow-x-auto sm:overflow-visible">
          {dayLabels.map((label, i) => (
            <div key={i} className={`h-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</div>
          ))}
        </div>
        
        {/* Heatmap grid */}
        <div className="flex gap-1 flex-1 overflow-x-auto sm:overflow-hidden pb-1 sm:pb-0">
          {activityData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1 flex-1">
              {week.map((level, dayIndex) => (
                <motion.div
                  key={dayIndex}
                  className="h-3 rounded-sm cursor-pointer"
                  style={{ backgroundColor: getColor(level) }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + weekIndex * 0.03 + dayIndex * 0.01 }}
                  whileHover={{ scale: 1.3, zIndex: 10 }}
                  title={`${level * 30} minutes studied`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2`}>
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <span className="font-semibold text-emerald-500">47</span> active study days
        </div>
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Longest streak: <span className="font-semibold text-amber-500">14 days</span>
        </div>
      </div>
    </motion.div>
  );
};

// Focus Timer Component (Pomodoro)
const FocusTimer = ({ darkMode }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus'); // focus, shortBreak, longBreak
  
  const modes = {
    focus: { time: 25 * 60, label: 'Focus Time', color: 'rose' },
    shortBreak: { time: 5 * 60, label: 'Short Break', color: 'emerald' },
    longBreak: { time: 15 * 60, label: 'Long Break', color: 'blue' }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progress = ((modes[mode].time - timeLeft) / modes[mode].time) * 100;
  
  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);
  
  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(modes[newMode].time);
    setIsRunning(false);
  };
  
  const colorClasses = {
    rose: { bg: darkMode ? 'bg-rose-500/20' : 'bg-rose-100', text: 'text-rose-500' },
    emerald: { bg: darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100', text: 'text-emerald-500' },
    blue: { bg: darkMode ? 'bg-blue-500/20' : 'bg-blue-100', text: 'text-blue-500' }
  };

  return (
    <motion.div
      className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-xl ${colorClasses[modes[mode].color].bg} ${colorClasses[modes[mode].color].text}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Focus Timer</h3>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{modes[mode].label}</p>
        </div>
      </div>
      
      {/* Mode switcher */}
      <div className={`flex gap-1 p-1 rounded-xl mb-6 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
        {Object.entries(modes).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              mode === key
                ? `${darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} shadow`
                : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      
      {/* Timer display */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" strokeWidth="8" stroke={darkMode ? '#2a2a2a' : '#e5e7eb'} fill="transparent" />
            <motion.circle
              cx="80" cy="80" r="70" strokeWidth="8" fill="transparent"
              stroke={modes[mode].color === 'rose' ? '#f43f5e' : modes[mode].color === 'emerald' ? '#10b981' : '#3b82f6'}
              strokeLinecap="round" strokeDasharray={439.8} strokeDashoffset={439.8 * (1 - progress / 100)}
              initial={{ strokeDashoffset: 439.8 }} animate={{ strokeDashoffset: 439.8 * (1 - progress / 100) }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-mono font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex gap-3 mt-6">
          <motion.button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              isRunning
                ? `${darkMode ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-200 text-gray-700'}`
                : `${colorClasses[modes[mode].color].bg} ${colorClasses[modes[mode].color].text}`
            }`}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            {isRunning ? 'Pause' : 'Start'}
          </motion.button>
          <motion.button
            onClick={() => { setTimeLeft(modes[mode].time); setIsRunning(false); }}
            className={`px-4 py-2.5 rounded-xl font-medium ${darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-600'}`}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            Reset
          </motion.button>
        </div>
      </div>
      
      {/* Session stats */}
      <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'} grid grid-cols-1 sm:grid-cols-3 gap-4 text-center`}>
        <div>
          <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>4</div>
          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Today</div>
        </div>
        <div>
          <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>28</div>
          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>This Week</div>
        </div>
        <div>
          <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>1h 40m</div>
          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Focus Time</div>
        </div>
      </div>
    </motion.div>
  );
};

// Skill Mastery Component
const SkillMastery = ({ darkMode }) => {
  const skills = [
    { name: 'Mathematics', level: 78, color: '#6366f1', xp: 2340 },
    { name: 'Science', level: 65, color: '#10b981', xp: 1890 },
    { name: 'History', level: 82, color: '#f59e0b', xp: 2560 },
    { name: 'Literature', level: 45, color: '#ec4899', xp: 1230 },
    { name: 'Programming', level: 91, color: '#06b6d4', xp: 3120 },
  ];

  return (
    <motion.div
      className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-xl ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Skill Mastery</h3>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Track your expertise in each subject</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {skills.map((skill, index) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: skill.color }} />
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{skill.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{skill.xp} XP</span>
                <span className="text-sm font-semibold" style={{ color: skill.color }}>{skill.level}%</span>
              </div>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: skill.color }}
                initial={{ width: 0 }}
                animate={{ width: `${skill.level}%` }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.8, type: "spring" }}
              />
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.button
        className={`w-full mt-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
          darkMode ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      >
        View All Skills →
      </motion.button>
    </motion.div>
  );
};

// AI Insights Component
const AIInsights = ({ darkMode }) => {
  const insightIcons = {
    recommendation: (
      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    achievement: (
      <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    tip: (
      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  };

  const insights = [
    {
      type: 'recommendation',
      title: 'Focus on Weak Areas',
      message: 'Your Literature score has dropped 12% this week. Consider spending 30 mins daily on reading comprehension.',
      action: 'Start Practice',
      color: 'amber'
    },
    {
      type: 'achievement',
      title: 'New Milestone!',
      message: "You've completed 50 quiz sessions! You're in the top 15% of learners.",
      action: 'View Badge',
      color: 'emerald'
    },
    {
      type: 'tip',
      title: 'Optimal Study Time',
      message: 'Based on your patterns, you perform 23% better between 9-11 AM. Schedule important topics then!',
      action: 'Set Reminder',
      color: 'blue'
    }
  ];
  
  const [currentInsight, setCurrentInsight] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentInsight(prev => (prev + 1) % insights.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [insights.length]);

  const colorMap = {
    amber: { bg: darkMode ? 'bg-amber-500/10' : 'bg-amber-50', border: 'border-amber-500/30', text: 'text-amber-500' },
    emerald: { bg: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50', border: 'border-emerald-500/30', text: 'text-emerald-500' },
    blue: { bg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50', border: 'border-blue-500/30', text: 'text-blue-500' }
  };

  return (
    <motion.div
      className={`p-6 rounded-2xl border ${darkMode ? 'bg-gradient-to-br from-[#1f1f1f] to-[#252525] border-[#2a2a2a]' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Study Coach</h3>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Personalized insights just for you</p>
          </div>
        </div>
        <div className="flex gap-1">
          {insights.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentInsight(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentInsight ? 'bg-violet-500 w-4' : darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentInsight}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={`p-4 rounded-xl border ${colorMap[insights[currentInsight].color].bg} ${colorMap[insights[currentInsight].color].border}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">{insightIcons[insights[currentInsight].type]}</div>
            <div className="flex-1">
              <h4 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {insights[currentInsight].title}
              </h4>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {insights[currentInsight].message}
              </p>
              <motion.button
                className={`mt-3 text-sm font-medium ${colorMap[insights[currentInsight].color].text}`}
                whileHover={{ x: 5 }}
              >
                {insights[currentInsight].action} →
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// Study Goals Component
const StudyGoals = ({ darkMode }) => {
  const goalIcons = {
    summary: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    timer: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    cards: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    target: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
        <circle cx="12" cy="12" r="6" strokeWidth={1.5} />
        <circle cx="12" cy="12" r="2" strokeWidth={1.5} />
      </svg>
    ),
  };

  const goals = [
    { name: 'Complete 5 summaries', current: 3, target: 5, iconKey: 'summary', deadline: 'Today' },
    { name: 'Study 2 hours', current: 85, target: 120, iconKey: 'timer', deadline: 'Today', unit: 'min' },
    { name: 'Master 10 flashcards', current: 7, target: 10, iconKey: 'cards', deadline: 'Today' },
    { name: 'Quiz score above 80%', current: 85, target: 80, iconKey: 'target', deadline: 'Achieved!', completed: true },
  ];

  return (
    <motion.div
      className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Daily Goals</h3>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>3 of 4 completed</p>
          </div>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full font-medium ${darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}>
          75%
        </div>
      </div>
      
      <div className="space-y-3">
        {goals.map((goal, index) => {
          const progress = goal.unit ? (goal.current / goal.target) * 100 : (goal.current / goal.target) * 100;
          return (
            <motion.div
              key={goal.name}
              className={`p-3 rounded-xl ${goal.completed 
                ? darkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
                : darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <span className={`${goal.completed ? 'text-emerald-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{goalIcons[goal.iconKey]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium truncate ${goal.completed ? 'line-through opacity-60' : ''} ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {goal.name}
                    </span>
                    <span className={`text-xs flex-shrink-0 ml-2 ${goal.completed ? 'text-emerald-500' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {goal.deadline}
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-200'}`}>
                    <motion.div
                      className={`h-full rounded-full ${goal.completed ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                    />
                  </div>
                </div>
                <span className={`text-xs font-medium ${goal.completed ? 'text-emerald-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {goal.unit ? `${goal.current}/${goal.target}${goal.unit}` : `${goal.current}/${goal.target}`}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// Brain Power Index (Gamification)
const BrainPowerIndex = ({ darkMode }) => {
  const level = 12;
  const currentXP = 2340;
  const nextLevelXP = 3000;
  const progress = (currentXP / nextLevelXP) * 100;
  
  const badgeIcons = {
    streak: (
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    brain: (
      <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    book: (
      <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    star: (
      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  };

  const badges = [
    { iconKey: 'streak', name: 'On Fire', desc: '7-day streak' },
    { iconKey: 'brain', name: 'Quick Thinker', desc: '10 quizzes aced' },
    { iconKey: 'book', name: 'Bookworm', desc: '50 summaries' },
    { iconKey: 'star', name: 'Rising Star', desc: 'Top 10%' },
  ];

  return (
    <motion.div
      className={`p-6 rounded-2xl border overflow-hidden relative ${darkMode ? 'bg-gradient-to-br from-[#1f1f1f] via-[#1a1a2e] to-[#1f1f1f] border-[#2a2a2a]' : 'bg-gradient-to-br from-white via-violet-50 to-white border-gray-200'}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-fuchsia-500/20 to-transparent rounded-full blur-2xl" />
      
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Brain Power</h3>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Your learning score</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${darkMode ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
            <span className="text-violet-500 font-bold">Lvl {level}</span>
          </div>
        </div>
        
        {/* XP Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Experience Points</span>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currentXP} / {nextLevelXP} XP</span>
          </div>
          <div className={`h-3 rounded-full overflow-hidden ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 0.8, duration: 1, type: "spring" }}
            />
          </div>
          <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {nextLevelXP - currentXP} XP until Level {level + 1}
          </p>
        </div>
        
        {/* Badges */}
        <div>
          <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Recent Badges</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {badges.map((badge, i) => (
              <motion.div
                key={badge.name}
                className={`p-3 rounded-xl text-center cursor-pointer ${darkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-50 hover:bg-gray-100'}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                title={badge.desc}
              >
                <div className="flex justify-center mb-1">{badgeIcons[badge.iconKey]}</div>
                <div className={`text-xs font-medium truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{badge.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Weekly Progress Chart
const WeeklyProgress = ({ darkMode }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = [45, 72, 58, 90, 65, 85, 40];
  const maxValue = Math.max(...data);

  return (
    <motion.div
      className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Weekly Progress</h3>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Study minutes per day</p>
          </div>
        </div>
        <div className={`text-sm px-3 py-1 rounded-lg ${darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
          Total: <span className="font-semibold text-indigo-500">7.6h</span>
        </div>
      </div>
      
      <div className="flex items-end justify-between gap-2 h-40">
        {days.map((day, i) => (
          <div key={day} className="flex flex-col items-center flex-1">
            <motion.div
              className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400"
              initial={{ height: 0 }}
              animate={{ height: `${(data[i] / maxValue) * 100}%` }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.6, type: "spring" }}
              whileHover={{ opacity: 0.8 }}
            />
            <div className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{day}</div>
            <div className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{data[i]}m</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Main Analytics Component
export default function Analytics({ summaryCount = 0, quizQuestionCount = 0 }) {
  const { darkMode } = useTheme();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAnalytics = async () => {
      try {
        const res = await aiService.getAnalytics();
        if (mounted) setAnalyticsData(res || null);
      } catch (e) {
        console.warn('Failed to load analytics', e);
        if (mounted) setAnalyticsData(null);
      } finally {
        if (mounted) setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
    return () => { mounted = false; };
  }, []);

  return (
    <motion.div
      className={`w-full h-full overflow-auto p-6 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Study Analytics
            </motion.h1>
            <motion.p
              className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Track your learning progress and boost productivity
            </motion.p>
          </div>
          <motion.div
            className={`text-sm px-4 py-2 rounded-xl ${darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-white text-gray-600'} border ${darkMode ? 'border-[#333]' : 'border-gray-200'}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </motion.div>
        </div>

        {/* Empty analytics fallback */}
        {!analyticsLoading && (!analyticsData || (analyticsData.records && analyticsData.records.length === 0)) && (
          <motion.div
            className={`rounded-2xl border p-6 ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-center py-6">
              <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No analytics data yet</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Use the app to start tracking study sessions and quizzes - analytics will appear here.</p>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            title="Study Sessions" value="47" subtitle="This month" trend="+12%" trendUp
            color={darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'} delay={0.1}
          />
          <StatCard
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            title="Hours Studied" value="32.5" subtitle="This month" trend="+8%" trendUp
            color={darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'} delay={0.15}
          />
          <StatCard
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            title="Quiz Accuracy" value="87%" subtitle="Last 10 quizzes" trend="+5%" trendUp
            color={darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'} delay={0.2}
          />
          <StatCard
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            title="Current Streak" value="14" subtitle="Days in a row" trend="Hot!" trendUp
            color={darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'} delay={0.25}
          />
        </div>

        {/* AI Insights */}
        <AIInsights darkMode={darkMode} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <LearningHeatmap darkMode={darkMode} />
            <WeeklyProgress darkMode={darkMode} />
            <SkillMastery darkMode={darkMode} />
          </div>
          
          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            <FocusTimer darkMode={darkMode} />
            <StudyGoals darkMode={darkMode} />
          </div>
        </div>

        {/* Brain Power Section - Full Width */}
        <BrainPowerIndex darkMode={darkMode} />
      </div>
    </motion.div>
  );
}
