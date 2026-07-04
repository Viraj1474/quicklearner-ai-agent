import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

// SM-2 Algorithm Constants
const MIN_EASINESS = 1.3;
const INITIAL_EASINESS = 2.5;
const INITIAL_INTERVAL = 1; // days
const GRADE_DEFINITIONS = {
  0: { label: "Again", desc: "Complete blackout", color: "bg-red-500" },
  1: { label: "Hard", desc: "Significant difficulty", color: "bg-orange-500" },
  2: { label: "Good", desc: "Correct with hesitation", color: "bg-yellow-500" },
  3: { label: "Easy", desc: "Perfect recall", color: "bg-emerald-500" },
};

// Spaced Repetition Context
const SpacedRepetitionContext = createContext(null);

export const useSpacedRepetition = () => {
  const context = useContext(SpacedRepetitionContext);
  if (!context) {
    throw new Error("useSpacedRepetition must be used within SpacedRepetitionProvider");
  }
  return context;
};

// Calculate next review date using SM-2 algorithm
const calculateNextReview = (card, grade) => {
  let { easiness = INITIAL_EASINESS, interval = INITIAL_INTERVAL, repetitions = 0 } = card;

  // Update easiness factor
  easiness = Math.max(
    MIN_EASINESS,
    easiness + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02))
  );

  // Calculate new interval
  if (grade < 2) {
    // Failed - reset
    repetitions = 0;
    interval = INITIAL_INTERVAL;
  } else {
    // Passed
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easiness);
    }
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easiness,
    interval,
    repetitions,
    lastReviewDate: new Date().toISOString(),
    nextReviewDate: nextReviewDate.toISOString(),
    grade,
  };
};

// Get cards due for review
const getDueCards = (cards) => {
  const now = new Date();
  return cards.filter(card => {
    if (!card.nextReviewDate) return true;
    return new Date(card.nextReviewDate) <= now;
  });
};

// Provider Component
export const SpacedRepetitionProvider = ({ children, storageKey = "sr_cards" }) => {
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState({
    totalCards: 0,
    dueToday: 0,
    newCards: 0,
    mastered: 0,
    streakDays: 0,
  });

  // Load cards from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCards(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load spaced repetition data:", e);
      }
    }
  }, [storageKey]);

  // Save cards to localStorage
  useEffect(() => {
    if (cards.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(cards));
    }
    updateStats();
  }, [cards, storageKey]);

  const updateStats = useCallback(() => {
    const dueCards = getDueCards(cards);
    const newCards = cards.filter(c => !c.lastReviewDate);
    const mastered = cards.filter(c => c.repetitions >= 5 && c.easiness >= 2.5);
    
    setStats({
      totalCards: cards.length,
      dueToday: dueCards.length,
      newCards: newCards.length,
      mastered: mastered.length,
      streakDays: calculateStreak(cards),
    });
  }, [cards]);

  const calculateStreak = (cards) => {
    const reviewDates = cards
      .filter(c => c.lastReviewDate)
      .map(c => new Date(c.lastReviewDate).toDateString());
    
    const uniqueDates = [...new Set(reviewDates)].sort().reverse();
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      if (uniqueDates.includes(checkDate.toDateString())) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const addCard = useCallback((card) => {
    setCards(prev => [...prev, {
      ...card,
      id: card.id || Date.now(),
      easiness: INITIAL_EASINESS,
      interval: INITIAL_INTERVAL,
      repetitions: 0,
      createdAt: new Date().toISOString(),
    }]);
  }, []);

  const addCards = useCallback((newCards) => {
    setCards(prev => [
      ...prev,
      ...newCards.map(card => ({
        ...card,
        id: card.id || Date.now() + Math.random(),
        easiness: INITIAL_EASINESS,
        interval: INITIAL_INTERVAL,
        repetitions: 0,
        createdAt: new Date().toISOString(),
      }))
    ]);
  }, []);

  const reviewCard = useCallback((cardId, grade) => {
    setCards(prev => prev.map(card => {
      if (card.id === cardId) {
        return { ...card, ...calculateNextReview(card, grade) };
      }
      return card;
    }));
  }, []);

  const getDueCardsForReview = useCallback(() => {
    return getDueCards(cards);
  }, [cards]);

  const removeCard = useCallback((cardId) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
  }, []);

  const clearAllCards = useCallback(() => {
    setCards([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const value = {
    cards,
    stats,
    addCard,
    addCards,
    reviewCard,
    removeCard,
    clearAllCards,
    getDueCardsForReview,
  };

  return (
    <SpacedRepetitionContext.Provider value={value}>
      {children}
    </SpacedRepetitionContext.Provider>
  );
};

// Review Session Component
export const ReviewSession = ({ onComplete, onClose }) => {
  const { darkMode } = useTheme();
  const { getDueCardsForReview, reviewCard, stats } = useSpacedRepetition();
  const [dueCards, setDueCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });

  useEffect(() => {
    setDueCards(getDueCardsForReview());
  }, [getDueCardsForReview]);

  const currentCard = dueCards[currentIndex];
  const progress = dueCards.length > 0 ? ((currentIndex + 1) / dueCards.length) * 100 : 0;

  const handleGrade = (grade) => {
    if (!currentCard) return;

    reviewCard(currentCard.id, grade);
    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: grade >= 2 ? prev.correct + 1 : prev.correct,
    }));

    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      onComplete?.(sessionStats);
    }
  };

  if (dueCards.length === 0) {
    return (
      <motion.div
        className={`rounded-2xl p-8 text-center ${
          darkMode ? 'bg-[#1f1f1f] border border-[#2a2a2a]' : 'bg-white border border-gray-200'
        }`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </motion.div>
        <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          All caught up!
        </h3>
        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No cards due for review right now.
        </p>
        <button
          onClick={onClose}
          className={`px-6 py-2 rounded-xl font-medium transition-colors ${
            darkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          Done
        </button>
      </motion.div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden ${
      darkMode ? 'bg-[#1f1f1f] border border-[#2a2a2a]' : 'bg-white border border-gray-200'
    }`}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Card {currentIndex + 1} of {dueCards.length}
          </span>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
            }`}
          >
            <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        {/* Progress bar */}
        <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard?.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[200px] flex flex-col"
          >
            {/* Question */}
            <div className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentCard?.front || currentCard?.question}
            </div>

            {/* Answer */}
            <AnimatePresence>
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-4 pt-4 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}
                >
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currentCard?.back || currentCard?.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className={`px-5 py-4 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
        {!showAnswer ? (
          <motion.button
            onClick={() => setShowAnswer(true)}
            className={`w-full py-3 rounded-xl font-medium transition-colors ${
              darkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
            }`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Show Answer
          </motion.button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(GRADE_DEFINITIONS).map(([grade, { label, color }]) => (
              <motion.button
                key={grade}
                onClick={() => handleGrade(parseInt(grade))}
                className={`py-3 rounded-xl text-sm font-medium text-white ${color} hover:opacity-90`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Session Stats */}
      <div className={`px-5 py-3 flex justify-center gap-6 ${
        darkMode ? 'bg-[#1a1a1a] text-gray-500' : 'bg-gray-50 text-gray-400'
      }`}>
        <span className="text-xs">
          Reviewed: {sessionStats.reviewed}
        </span>
        <span className="text-xs">
          Correct: {sessionStats.correct}
        </span>
        <span className="text-xs">
          Accuracy: {sessionStats.reviewed > 0 
            ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) 
            : 0}%
        </span>
      </div>
    </div>
  );
};

// Stats Dashboard Component
export const SpacedRepetitionStats = () => {
  const { darkMode } = useTheme();
  const { stats, cards } = useSpacedRepetition();

  const statItems = [
    { 
      label: "Due Today", 
      value: stats.dueToday, 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      ),
      color: "text-blue-400 bg-blue-500/20"
    },
    { 
      label: "Total Cards", 
      value: stats.totalCards,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="14" rx="2"/>
          <path d="M7 8h10"/>
        </svg>
      ),
      color: "text-purple-400 bg-purple-500/20"
    },
    { 
      label: "Mastered", 
      value: stats.mastered,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      color: "text-yellow-400 bg-yellow-500/20"
    },
    { 
      label: "Streak", 
      value: `${stats.streakDays} days`,
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      ),
      color: "text-orange-400 bg-orange-500/20"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          className={`p-4 rounded-xl ${darkMode ? 'bg-[#1f1f1f] border border-[#2a2a2a]' : 'bg-white border border-gray-200'}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${item.color}`}>
            {item.icon}
          </div>
          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {item.value}
          </div>
          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {item.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default {
  SpacedRepetitionProvider,
  useSpacedRepetition,
  ReviewSession,
  SpacedRepetitionStats,
};
