import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";
import ChatBot from "./ChatBot";
import AskForm from "./AskForm";
import NotesHighlighter from "./NotesHighlighter";
import QuizGenerator from "./QuizGenerator";
import Summary from "./Summary";
import Analytics from "./Analytics";

// Modern animation variants with spring physics
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.07,
      delayChildren: 0.1,
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 260, 
      damping: 20,
      duration: 0.5 
    }
  }
};

// Hover animations for panels
const panelHoverEffect = {
  rest: { 
    scale: 1, 
    boxShadow: "0 4px 12px -4px rgba(0, 0, 0, 0.1), 0 2px 6px -2px rgba(0, 0, 0, 0.05)" 
  },
  hover: { 
    scale: 1.01,
    y: -3,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
    transition: { 
      type: "spring",
      stiffness: 400, 
      damping: 20
    }
  }
};

export default function Dashboard() {
  const { styles, darkMode } = useTheme();
  
  const [summaries, setSummaries] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [cards, setCards] = useState([]);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  const [isFullScreen, setIsFullScreen] = useState(true);

  const addNewSummary = (s) => setSummaries((prev) => [s, ...prev]);
  const setNewQuiz = (q) => setQuiz(q);
  const addNewCard = (q, a) => setCards((prev) => [{ front: q, back: a }, ...prev]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <motion.div 
      className={`${styles?.background || 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800'} min-h-[calc(100vh-64px)]`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ 
        paddingTop: '88px', // Clear space for navbar
        paddingBottom: '2rem',
        backgroundSize: '40px 40px',
        backgroundImage: `linear-gradient(to right, ${darkMode ? 'rgba(99, 102, 241, 0.03)' : 'rgba(99, 102, 241, 0.02)'} 1px, transparent 1px), 
                         linear-gradient(to bottom, ${darkMode ? 'rgba(99, 102, 241, 0.03)' : 'rgba(99, 102, 241, 0.02)'} 1px, transparent 1px)`,
      }}
    >
      
      {/* Main content container with proper padding */}
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Full Screen Study Assistant */}
        <motion.div 
          className="relative flex flex-col w-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ 
            height: isFullScreen ? 'calc(100vh - 120px)' : 'auto'
          }}
        >
          {/* Top action bar */}
          <div className="flex justify-between items-center mb-4">
            <motion.h2 
              className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500"
              whileHover={{ scale: 1.02 }}
            >
              AI Study Assistant
            </motion.h2>
            
            <div className="flex items-center gap-3">
              <motion.button
                onClick={toggleFullScreen}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${styles?.panel || 'bg-gray-50/90 dark:bg-gray-800/90'} border ${styles?.border || 'border-gray-200/50 dark:border-gray-700/50'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isFullScreen ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Exit Full Screen
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                    Full Screen
                  </>
                )}
              </motion.button>
            </div>
          </div>
          
          {/* Main content panel */}
          <motion.div
            className={`flex-grow w-full ${styles?.panel || 'bg-gray-50/90 dark:bg-gray-800/90'} backdrop-blur-md rounded-2xl ${styles?.border || 'border border-gray-200/50 dark:border-gray-700/50'} ${styles?.glow || 'shadow-modern'} overflow-hidden flex flex-col`}
            layoutId="main-panel"
          >
            {/* Tabs navigation */}
            <div className="flex items-center px-6 py-3 border-b border-gray-200/30 dark:border-gray-700/30">
              {[
                { id: 'analytics', label: 'Study Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { id: 'notes', label: 'Notes Highlighter', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
                { id: 'summaries', label: 'Recent Summaries', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { id: 'quiz', label: 'Quiz Generator', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { id: 'ask', label: 'Topic Summarizer', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
              ].map(tab => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg mr-2 text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? `${styles?.primarySolid || 'bg-violet-600'} text-white` 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                  }`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </motion.button>
              ))}
            </div>
            
            {/* Tab content */}
            <div className="flex-grow overflow-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'analytics' && (
                  <motion.div
                    key="analytics"
                    className="h-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Analytics 
                      summaryCount={summaries.length} 
                      quizQuestionCount={quiz.length}
                    />
                  </motion.div>
                )}
                
                {activeTab === 'notes' && (
                  <motion.div
                    key="notes"
                    className="h-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <NotesHighlighter
                      onNewSummary={addNewSummary}
                      onExpandChange={setNotesExpanded}
                      expanded={true}
                    />
                  </motion.div>
                )}
                
                {activeTab === 'summaries' && (
                  <motion.div
                    key="summaries"
                    className="h-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Summary summaries={summaries} />
                  </motion.div>
                )}
                
                {activeTab === 'quiz' && (
                  <motion.div
                    key="quiz"
                    className="h-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <QuizGenerator onQuizGenerated={setNewQuiz} />
                  </motion.div>
                )}
                
                {activeTab === 'ask' && (
                  <motion.div
                    key="ask"
                    className="h-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AskForm onNewSummary={addNewSummary} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}