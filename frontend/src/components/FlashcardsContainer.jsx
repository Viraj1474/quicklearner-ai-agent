import React, { useState, useEffect } from "react";
import Flashcard from "./Flashcard";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";
import * as aiService from "./services/aiService";

export default function FlashcardsContainer({ cards = [], onNewCards = () => {} }) {
  const { darkMode } = useTheme();
  const [textInput, setTextInput] = useState("");
  const [numCards, setNumCards] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid, single
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [studyStats, setStudyStats] = useState(() => {
    try {
      const raw = localStorage.getItem('flashcardsStudyStats');
      return raw ? JSON.parse(raw) : { known: 0, unknown: 0, total: 0 };
    } catch (e) {
      return { known: 0, unknown: 0, total: 0 };
    }
  });

  useEffect(() => {
    try { localStorage.setItem('flashcardsStudyStats', JSON.stringify(studyStats)); } catch (e) {}
  }, [studyStats]);

  const handleGenerate = async () => {
    if (!textInput.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const newCards = await aiService.generateFlashcards(textInput, numCards);
      const formattedCards = newCards.map(card => ({
        front: card.front,
        back: card.back
      }));
      onNewCards(formattedCards);
      setTextInput("");
      setCurrentCardIndex(0);
      setStudyStats({ known: 0, unknown: 0, total: formattedCards.length });
    } catch (error) {
      console.error("Error generating flashcards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  return (
    <motion.div
      className={`w-full h-full overflow-auto ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${darkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-orange-500 font-medium">Active Learning</span>
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Flashcards
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Create and study AI-generated flashcards from your notes
          </p>
        </motion.div>

        {/* Generator Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl border p-6 ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Generate New Cards</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Paste your study material below</p>
            </div>
          </div>

          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your notes, textbook content, or any study material..."
            className={`w-full min-h-[120px] p-4 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 mb-4 ${
              darkMode 
                ? 'bg-[#2a2a2a] border-[#333] text-white placeholder-gray-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
          />

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4">
            {/* Card count selector */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cards:</span>
              <div className="flex flex-wrap gap-1">
                {[3, 5, 10, 15, 20].map(n => (
                  <motion.button
                    key={n}
                    onClick={() => setNumCards(n)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      numCards === n
                        ? `${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`
                        : `${darkMode ? 'text-gray-400 hover:bg-[#2a2a2a]' : 'text-gray-600 hover:bg-gray-100'}`
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {n}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <motion.button
              onClick={handleGenerate}
              disabled={!textInput.trim() || isLoading}
              className={`w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                !textInput.trim() || isLoading
                  ? `${darkMode ? 'bg-[#2a2a2a] text-gray-500' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600'
              }`}
              whileHover={textInput.trim() && !isLoading ? { scale: 1.02 } : {}}
              whileTap={textInput.trim() && !isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Generate {numCards} Cards</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Cards Display */}
        {cards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* View Mode Toggle & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Your Flashcards ({cards.length})
                </h2>
                <div className={`flex gap-1 p-1 rounded-lg ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === "grid"
                        ? `${darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} shadow`
                        : `${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("single")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === "single"
                        ? `${darkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} shadow`
                        : `${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {viewMode === "grid" ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {cards.map((card, index) => (
                    <Flashcard key={index} front={card.front} back={card.back} index={index} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="single"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  {/* Progress bar */}
                  <div className={`w-full max-w-md mb-6 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
                    />
                  </div>

                  {/* Single card view */}
                  <div className="w-full max-w-md min-h-[18rem] sm:h-64 mb-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentCardIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="h-full"
                      >
                        <Flashcard 
                          front={cards[currentCardIndex]?.front} 
                          back={cards[currentCardIndex]?.back} 
                          index={0}
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Navigation */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <motion.button
                      onClick={handlePrevCard}
                      disabled={currentCardIndex === 0}
                      className={`p-2 sm:p-3 rounded-xl transition-all ${
                        currentCardIndex === 0
                          ? `${darkMode ? 'bg-[#2a2a2a] text-gray-600' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                          : `${darkMode ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                      }`}
                      whileHover={currentCardIndex > 0 ? { scale: 1.1 } : {}}
                      whileTap={currentCardIndex > 0 ? { scale: 0.9 } : {}}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>

                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {currentCardIndex + 1} / {cards.length}
                    </span>

                    <motion.button
                      onClick={handleNextCard}
                      disabled={currentCardIndex === cards.length - 1}
                      className={`p-2 sm:p-3 rounded-xl transition-all ${
                        currentCardIndex === cards.length - 1
                          ? `${darkMode ? 'bg-[#2a2a2a] text-gray-600' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                          : `${darkMode ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                      }`}
                      whileHover={currentCardIndex < cards.length - 1 ? { scale: 1.1 } : {}}
                      whileTap={currentCardIndex < cards.length - 1 ? { scale: 0.9 } : {}}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </div>

                  {/* Keyboard hint */}
                  <p className={`mt-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Click card to flip • Use arrows to navigate
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {cards.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl border p-8 text-center ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
          >
            <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
              <svg className={`w-10 h-10 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              No flashcards yet
            </h3>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Paste your study material above to generate flashcards
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Vocabulary', 'Definitions', 'Key Facts', 'Formulas'].map((topic, i) => (
                <span key={i} className={`px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  {topic}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
