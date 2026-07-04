import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "./theme";

export default function Flashcard({ front, back, index = 0 }) {
  const { darkMode } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isKnown, setIsKnown] = useState(null);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMarkKnown = (e, known) => {
    e.stopPropagation();
    setIsKnown(known);
  };

  return (
    <motion.div
      className="perspective-1000 h-48 cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleFlip}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 80 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <div
          className={`absolute inset-0 rounded-2xl border p-5 flex flex-col ${
            isKnown === true
              ? darkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
              : isKnown === false
              ? darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
              : darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'
          }`}
          style={{ backfaceVisibility: "hidden", overflow: "hidden" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
              darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
            }`}>
              Question
            </span>
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Click to flip
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center">
            <p className={`text-center font-medium break-words whitespace-pre-wrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {front}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <motion.button
              onClick={(e) => handleMarkKnown(e, false)}
              className={`p-2 rounded-lg transition-colors ${
                isKnown === false
                  ? 'bg-red-500 text-white'
                  : darkMode ? 'bg-[#2a2a2a] text-gray-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
            <motion.button
              onClick={(e) => handleMarkKnown(e, true)}
              className={`p-2 rounded-lg transition-colors ${
                isKnown === true
                  ? 'bg-green-500 text-white'
                  : darkMode ? 'bg-[#2a2a2a] text-gray-400 hover:bg-green-500/20 hover:text-green-400' : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-500'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Back of card */}
        <div
          className={`absolute inset-0 rounded-2xl border p-5 flex flex-col ${
            isKnown === true
              ? darkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
              : isKnown === false
              ? darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
              : darkMode ? 'bg-gradient-to-br from-[#1f1f1f] to-[#252525] border-[#2a2a2a]' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
          }`}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", overflow: "hidden" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
              darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
            }`}>
              Answer
            </span>
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Click to flip back
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center">
            <p className={`text-center font-medium break-words whitespace-pre-wrap ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {back}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <motion.button
              onClick={(e) => handleMarkKnown(e, false)}
              className={`p-2 rounded-lg transition-colors ${
                isKnown === false
                  ? 'bg-red-500 text-white'
                  : darkMode ? 'bg-[#2a2a2a] text-gray-400 hover:bg-red-500/20 hover:text-red-400' : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
            <motion.button
              onClick={(e) => handleMarkKnown(e, true)}
              className={`p-2 rounded-lg transition-colors ${
                isKnown === true
                  ? 'bg-green-500 text-white'
                  : darkMode ? 'bg-[#2a2a2a] text-gray-400 hover:bg-green-500/20 hover:text-green-400' : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-500'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
