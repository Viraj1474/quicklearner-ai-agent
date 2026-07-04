import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

// Goal types
const GOAL_TYPES = {
  STUDY_TIME: {
    id: "study_time",
    label: "Study Time",
    icon: "⏱️",
    unit: "minutes",
    defaultTarget: 120,
  },
  FLASHCARDS: {
    id: "flashcards",
    label: "Flashcards Reviewed",
    icon: "🗂️",
    unit: "cards",
    defaultTarget: 50,
  },
  QUIZZES: {
    id: "quizzes",
    label: "Quizzes Completed",
    icon: "📝",
    unit: "quizzes",
    defaultTarget: 3,
  },
  NOTES: {
    id: "notes",
    label: "Notes Created",
    icon: "📒",
    unit: "notes",
    defaultTarget: 5,
  },
  POMODOROS: {
    id: "pomodoros",
    label: "Pomodoro Sessions",
    icon: "🍅",
    unit: "sessions",
    defaultTarget: 4,
  },
};

// Study Goals Hook
export const useStudyGoals = () => {
  const [goals, setGoals] = useState([]);
  const [progress, setProgress] = useState({});
  const [history, setHistory] = useState([]);

  // Load goals and progress
  useEffect(() => {
    const savedGoals = localStorage.getItem("study_goals");
    const savedProgress = localStorage.getItem("study_progress");
    const savedHistory = localStorage.getItem("study_goals_history");

    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      // Check if it's today's progress
      const today = new Date().toDateString();
      if (parsed.date === today) {
        setProgress(parsed.data);
      } else {
        // Archive yesterday's progress and reset
        if (savedHistory) {
          const hist = JSON.parse(savedHistory);
          hist.push({ date: parsed.date, data: parsed.data });
          localStorage.setItem("study_goals_history", JSON.stringify(hist.slice(-30))); // Keep 30 days
          setHistory(hist.slice(-30));
        }
        setProgress({});
      }
    }
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save goals
  const saveGoals = (newGoals) => {
    setGoals(newGoals);
    localStorage.setItem("study_goals", JSON.stringify(newGoals));
  };

  // Update progress
  const updateProgress = (goalId, amount) => {
    const today = new Date().toDateString();
    const newProgress = {
      ...progress,
      [goalId]: (progress[goalId] || 0) + amount,
    };
    setProgress(newProgress);
    localStorage.setItem("study_progress", JSON.stringify({ date: today, data: newProgress }));
  };

  // Add a goal
  const addGoal = (goalType, target, period = "daily") => {
    const newGoal = {
      id: `${goalType}_${Date.now()}`,
      type: goalType,
      target,
      period,
      createdAt: new Date().toISOString(),
    };
    saveGoals([...goals, newGoal]);
  };

  // Remove a goal
  const removeGoal = (goalId) => {
    saveGoals(goals.filter(g => g.id !== goalId));
  };

  // Get goal completion percentage
  const getGoalProgress = (goal) => {
    const current = progress[goal.type] || 0;
    return Math.min((current / goal.target) * 100, 100);
  };

  return {
    goals,
    progress,
    history,
    addGoal,
    removeGoal,
    updateProgress,
    getGoalProgress,
    GOAL_TYPES,
  };
};

// Main Study Goals Component
const StudyGoals = ({ isOpen, onClose }) => {
  const { darkMode } = useTheme();
  const { goals, progress, addGoal, removeGoal, getGoalProgress, GOAL_TYPES: goalTypes } = useStudyGoals();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalType, setNewGoalType] = useState("study_time");
  const [newGoalTarget, setNewGoalTarget] = useState(120);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const total = goals.reduce((acc, goal) => acc + getGoalProgress(goal), 0);
    return Math.round(total / goals.length);
  }, [goals, progress]);

  // Get today's date formatted
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
          className={`relative w-full max-w-lg mx-4 max-h-[85vh] rounded-2xl border shadow-2xl overflow-hidden ${
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
            <div>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Daily Goals
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {todayFormatted}
              </p>
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg ${
              darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
            }`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Overall Progress */}
          <div className={`px-5 py-4 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Overall Progress
              </span>
              <span className={`text-sm font-semibold ${
                overallProgress >= 100 ? 'text-green-500' : darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {overallProgress}%
              </span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${
              darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'
            }`}>
              <motion.div
                className={`h-full rounded-full ${
                  overallProgress >= 100 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            {overallProgress >= 100 && (
              <motion.p
                className="text-sm text-green-500 mt-2 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                🎉 All goals completed! Great work!
              </motion.p>
            )}
          </div>

          {/* Goals List */}
          <div className="px-5 py-4 overflow-y-auto max-h-[40vh] space-y-3">
            {goals.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p className="text-sm">No goals set yet</p>
                <p className="text-xs mt-1">Add a goal to start tracking your progress</p>
              </div>
            ) : (
              goals.map((goal) => {
                const goalInfo = Object.values(goalTypes).find(g => g.id === goal.type);
                const goalProgress = getGoalProgress(goal);
                const current = progress[goal.type] || 0;

                return (
                  <motion.div
                    key={goal.id}
                    className={`p-4 rounded-xl border ${
                      darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'
                    }`}
                    layout
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{goalInfo?.icon}</span>
                        <div>
                          <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {goalInfo?.label}
                          </h3>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {current} / {goal.target} {goalInfo?.unit}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeGoal(goal.id)}
                        className={`p-1 rounded hover:bg-red-500/20 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${
                      darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'
                    }`}>
                      <motion.div
                        className={`h-full rounded-full ${
                          goalProgress >= 100 
                            ? 'bg-green-500' 
                            : 'bg-purple-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${goalProgress}%` }}
                      />
                    </div>
                    {goalProgress >= 100 && (
                      <p className="text-xs text-green-500 mt-1">✓ Completed!</p>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Add Goal Section */}
          <div className={`px-5 py-4 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
            {showAddGoal ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <select
                  value={newGoalType}
                  onChange={(e) => {
                    setNewGoalType(e.target.value);
                    const goalInfo = Object.values(goalTypes).find(g => g.id === e.target.value);
                    setNewGoalTarget(goalInfo?.defaultTarget || 10);
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-sm ${
                    darkMode
                      ? 'bg-[#2a2a2a] text-white border-[#333]'
                      : 'bg-gray-100 text-gray-900 border-gray-200'
                  } border`}
                >
                  {Object.values(goalTypes).map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={newGoalTarget}
                    onChange={(e) => setNewGoalTarget(parseInt(e.target.value) || 1)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                      darkMode
                        ? 'bg-[#2a2a2a] text-white border-[#333]'
                        : 'bg-gray-100 text-gray-900 border-gray-200'
                    } border`}
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {Object.values(goalTypes).find(g => g.id === newGoalType)?.unit}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      addGoal(newGoalType, newGoalTarget);
                      setShowAddGoal(false);
                    }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium bg-purple-500 text-white"
                  >
                    Add Goal
                  </button>
                  <button
                    onClick={() => setShowAddGoal(false)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      darkMode ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowAddGoal(true)}
                className={`w-full py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition-colors ${
                  darkMode 
                    ? 'border-[#333] text-gray-400 hover:border-purple-500 hover:text-purple-400'
                    : 'border-gray-300 text-gray-500 hover:border-purple-500 hover:text-purple-500'
                }`}
              >
                + Add New Goal
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Compact Goal Progress Widget
export const GoalProgressWidget = ({ onClick }) => {
  const { darkMode } = useTheme();
  const { goals, progress, getGoalProgress } = useStudyGoals();

  const overallProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const total = goals.reduce((acc, goal) => acc + getGoalProgress(goal), 0);
    return Math.round(total / goals.length);
  }, [goals, progress]);

  const completedCount = goals.filter(g => getGoalProgress(g) >= 100).length;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
        darkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-100 hover:bg-gray-200'
      }`}
      title="View Goals"
    >
      <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
        {goals.length > 0 ? `${completedCount}/${goals.length}` : "Goals"}
      </span>
      {goals.length > 0 && (
        <div className={`w-8 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-[#333]' : 'bg-gray-200'}`}>
          <div 
            className={`h-full rounded-full ${overallProgress >= 100 ? 'bg-green-500' : 'bg-purple-500'}`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      )}
    </button>
  );
};

export default StudyGoals;
