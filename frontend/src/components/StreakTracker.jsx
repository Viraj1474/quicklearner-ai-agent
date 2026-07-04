import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

// Streak Hook
export const useStreak = () => {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    totalDaysActive: 0,
    weeklyActivity: [false, false, false, false, false, false, false],
    achievements: [],
  });

  // Load streak data
  useEffect(() => {
    const saved = localStorage.getItem("streak_data");
    if (saved) {
      const data = JSON.parse(saved);
      // Check if streak is still valid
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (data.lastActiveDate === today) {
        // Already logged in today
        setStreakData(data);
      } else if (data.lastActiveDate === yesterday) {
        // Streak continues, but haven't logged today yet
        setStreakData(data);
      } else if (data.lastActiveDate) {
        // Streak broken
        setStreakData({
          ...data,
          currentStreak: 0,
        });
      }
    }
  }, []);

  // Save streak data
  const saveStreakData = (newData) => {
    setStreakData(newData);
    localStorage.setItem("streak_data", JSON.stringify(newData));
  };

  // Record activity for today
  const recordActivity = () => {
    const today = new Date().toDateString();
    const dayOfWeek = new Date().getDay();
    
    if (streakData.lastActiveDate === today) {
      return; // Already recorded today
    }

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const isConsecutive = streakData.lastActiveDate === yesterday;
    
    const newStreak = isConsecutive ? streakData.currentStreak + 1 : 1;
    const newLongest = Math.max(streakData.longestStreak, newStreak);
    
    // Update weekly activity
    const newWeekly = [...streakData.weeklyActivity];
    newWeekly[dayOfWeek] = true;

    // Check for new achievements
    const newAchievements = [...streakData.achievements];
    const achievementChecks = [
      { id: "first_day", condition: true, title: "First Steps", desc: "Started your streak!" },
      { id: "week_streak", condition: newStreak >= 7, title: "Week Warrior", desc: "7 day streak!" },
      { id: "two_week", condition: newStreak >= 14, title: "Dedicated", desc: "14 day streak!" },
      { id: "month", condition: newStreak >= 30, title: "Unstoppable", desc: "30 day streak!" },
      { id: "total_10", condition: streakData.totalDaysActive + 1 >= 10, title: "Getting Started", desc: "10 total days!" },
      { id: "total_50", condition: streakData.totalDaysActive + 1 >= 50, title: "Committed", desc: "50 total days!" },
      { id: "total_100", condition: streakData.totalDaysActive + 1 >= 100, title: "Century Club", desc: "100 total days!" },
    ];

    achievementChecks.forEach(({ id, condition, title, desc }) => {
      if (condition && !newAchievements.find(a => a.id === id)) {
        newAchievements.push({ id, title, desc, earnedAt: new Date().toISOString() });
      }
    });

    saveStreakData({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
      totalDaysActive: streakData.totalDaysActive + 1,
      weeklyActivity: newWeekly,
      achievements: newAchievements,
    });

    return {
      newStreak,
      isNewRecord: newStreak > streakData.longestStreak,
      newAchievements: newAchievements.filter(
        a => !streakData.achievements.find(sa => sa.id === a.id)
      ),
    };
  };

  // Reset weekly activity on Sunday
  useEffect(() => {
    const today = new Date();
    if (today.getDay() === 0 && streakData.lastActiveDate !== today.toDateString()) {
      saveStreakData({
        ...streakData,
        weeklyActivity: [false, false, false, false, false, false, false],
      });
    }
  }, []);

  return {
    ...streakData,
    recordActivity,
  };
};

// Main Streak Tracker Component
const StreakTracker = ({ isOpen, onClose }) => {
  const { darkMode } = useTheme();
  const streak = useStreak();
  const [showCelebration, setShowCelebration] = useState(false);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayIndex = new Date().getDay();

  // Get streak flame color based on streak length
  const getFlameColor = () => {
    if (streak.currentStreak >= 30) return "text-red-500";
    if (streak.currentStreak >= 14) return "text-orange-500";
    if (streak.currentStreak >= 7) return "text-yellow-500";
    return "text-gray-400";
  };

  // Motivational message based on streak
  const getMessage = () => {
    if (streak.currentStreak === 0) return "Start your streak today!";
    if (streak.currentStreak === 1) return "Great start! Keep it going!";
    if (streak.currentStreak < 7) return `${7 - streak.currentStreak} days until Week Warrior!`;
    if (streak.currentStreak < 14) return "You're on fire! 🔥";
    if (streak.currentStreak < 30) return "Incredible dedication!";
    return "You're unstoppable! 🚀";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <motion.div
          className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl overflow-hidden ${
            darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'
          }`}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b ${
            darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Daily Streak
            </h2>
            <button onClick={onClose} className={`p-2 rounded-lg ${
              darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
            }`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Streak Display */}
          <div className="px-5 py-6 text-center">
            <motion.div
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'
              }`}
              animate={{
                scale: [1, 1.05, 1],
                rotate: streak.currentStreak > 0 ? [0, -5, 5, 0] : 0,
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg className={`w-14 h-14 ${getFlameColor()}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 23c-3.866 0-7-3.358-7-7.5 0-2.624.985-4.5 2-6.5.897-1.769 2.053-3.685 2.727-5.768.105-.325.469-.538.773-.538.304 0 .668.213.773.538C12.947 5.315 14.103 7.231 15 9c1.015 2 2 3.876 2 6.5 0 4.142-3.134 7.5-7 7.5zM12 20c2.206 0 4-1.794 4-4s-.632-3-1.333-4.667C13.833 9.667 12.667 8 12 6.667 11.333 8 10.167 9.667 9.333 11.333 8.632 13 8 14 8 16s1.794 4 4 4z"/>
              </svg>
            </motion.div>
            
            <motion.h3
              className={`text-5xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
              key={streak.currentStreak}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {streak.currentStreak}
            </motion.h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {streak.currentStreak === 1 ? "day streak" : "day streak"}
            </p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {getMessage()}
            </p>
          </div>

          {/* Weekly Activity */}
          <div className={`px-5 py-4 border-t border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
            <h4 className={`text-xs font-medium mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              THIS WEEK
            </h4>
            <div className="flex justify-between">
              {dayLabels.map((day, index) => {
                const isToday = index === todayIndex;
                const isActive = streak.weeklyActivity[index];
                
                return (
                  <div key={day} className="flex flex-col items-center">
                    <span className={`text-xs mb-2 ${
                      isToday
                        ? darkMode ? 'text-white font-medium' : 'text-gray-900 font-medium'
                        : darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {day}
                    </span>
                    <motion.div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-green-500 text-white'
                          : isToday
                            ? darkMode ? 'bg-[#2a2a2a] border-2 border-purple-500' : 'bg-gray-100 border-2 border-purple-500'
                            : darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                      }`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {isActive && (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="px-5 py-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {streak.longestStreak}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Best Streak
              </p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {streak.totalDaysActive}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Total Days
              </p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {streak.achievements.length}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Badges
              </p>
            </div>
          </div>

          {/* Achievements */}
          {streak.achievements.length > 0 && (
            <div className={`px-5 py-4 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
              <h4 className={`text-xs font-medium mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                ACHIEVEMENTS
              </h4>
              <div className="flex flex-wrap gap-2">
                {streak.achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      darkMode
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    title={achievement.desc}
                  >
                    🏆 {achievement.title}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Compact Streak Widget
export const StreakWidget = ({ onClick }) => {
  const { darkMode } = useTheme();
  const streak = useStreak();

  const getFlameColor = () => {
    if (streak.currentStreak >= 30) return "text-red-500";
    if (streak.currentStreak >= 14) return "text-orange-500";
    if (streak.currentStreak >= 7) return "text-yellow-500";
    if (streak.currentStreak >= 1) return "text-orange-400";
    return darkMode ? "text-gray-500" : "text-gray-400";
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
        darkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-100 hover:bg-gray-200'
      }`}
      title={`${streak.currentStreak} day streak`}
    >
      <motion.svg 
        className={`w-4 h-4 ${getFlameColor()}`} 
        viewBox="0 0 24 24" 
        fill="currentColor"
        animate={streak.currentStreak > 0 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <path d="M12 23c-3.866 0-7-3.358-7-7.5 0-2.624.985-4.5 2-6.5.897-1.769 2.053-3.685 2.727-5.768.105-.325.469-.538.773-.538.304 0 .668.213.773.538C12.947 5.315 14.103 7.231 15 9c1.015 2 2 3.876 2 6.5 0 4.142-3.134 7.5-7 7.5z"/>
      </motion.svg>
      <span className={`font-medium ${
        streak.currentStreak > 0 
          ? darkMode ? 'text-white' : 'text-gray-900'
          : darkMode ? 'text-gray-500' : 'text-gray-400'
      }`}>
        {streak.currentStreak}
      </span>
    </button>
  );
};

// Auto-record activity component (place in App)
export const StreakAutoRecord = () => {
  const { recordActivity } = useStreak();
  
  useEffect(() => {
    // Record activity when component mounts (user opens the app)
    const result = recordActivity();
    if (result?.isNewRecord && result.newStreak > 1) {
      // Could trigger a celebration here
      console.log("New streak record:", result.newStreak);
    }
    if (result?.newAchievements?.length > 0) {
      console.log("New achievements:", result.newAchievements);
    }
  }, []);

  return null;
};

export default StreakTracker;
