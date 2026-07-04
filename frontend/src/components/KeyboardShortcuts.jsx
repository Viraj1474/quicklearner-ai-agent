import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

const KeyboardShortcuts = ({ isOpen, onClose }) => {
  const { darkMode } = useTheme();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const shortcutGroups = [
    {
      title: "Navigation",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      ),
      shortcuts: [
        { keys: ["Ctrl", "K"], description: "Open command palette" },
        { keys: ["Ctrl", "F"], description: "Search everything" },
        { keys: ["?"], description: "Show keyboard shortcuts" },
        { keys: ["Esc"], description: "Close current modal" },
      ],
    },
    {
      title: "Study Tools",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"/>
          <path d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"/>
          <path d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z"/>
          <path d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>
      ),
      shortcuts: [
        { keys: ["Ctrl", "N"], description: "Notes Highlighter" },
        { keys: ["Ctrl", "S"], description: "Text Summarizer" },
        { keys: ["Ctrl", "Q"], description: "Quiz Generator" },
        { keys: ["Ctrl", "F"], description: "Flashcards" },
        { keys: ["Ctrl", "A"], description: "Study Analytics" },
      ],
    },
    {
      title: "Chat & Conversations",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      ),
      shortcuts: [
        { keys: ["Enter"], description: "Send message" },
        { keys: ["Shift", "Enter"], description: "New line in message" },
        { keys: ["↑"], description: "Edit last message" },
      ],
    },
    {
      title: "Appearance",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ),
      shortcuts: [
        { keys: ["Ctrl", "\\"], description: "Toggle sidebar" },
        { keys: ["Ctrl", "D"], description: "Toggle dark mode" },
        { keys: ["Ctrl", "T"], description: "Open theme picker" },
      ],
    },
    {
      title: "Actions",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      ),
      shortcuts: [
        { keys: ["Ctrl", "E"], description: "Export study materials" },
        { keys: ["Ctrl", "R"], description: "Start review session" },
        { keys: ["Ctrl", ","], description: "Open settings" },
      ],
    },
    {
      title: "Productivity",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      ),
      shortcuts: [
        { keys: ["Ctrl", "P"], description: "Pomodoro timer" },
        { keys: ["Ctrl", "G"], description: "Study goals" },
        { keys: ["Alt", "F"], description: "Toggle focus mode" },
      ],
    },
  ];

  const KeyBadge = ({ children }) => (
    <span className={`
      inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md text-xs font-mono font-medium
      ${darkMode 
        ? 'bg-[#2a2a2a] text-gray-300 border border-[#3a3a3a] shadow-[0_2px_0_0_#1a1a1a]' 
        : 'bg-gray-100 text-gray-700 border border-gray-300 shadow-[0_2px_0_0_#d1d5db]'
      }
    `}>
      {children}
    </span>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 w-full max-w-2xl max-h-[80vh] z-50 overflow-hidden"
            style={{ x: "-50%", y: "-50%" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className={`
              mx-4 rounded-2xl border shadow-2xl overflow-hidden
              ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}
            `}>
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${
                darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                    <svg className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h8M6 16h.01M10 16h4"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Keyboard Shortcuts
                    </h2>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Speed up your workflow with these shortcuts
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-[#2a2a2a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {shortcutGroups.map((group, groupIndex) => (
                    <motion.div
                      key={group.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.05 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                          {group.icon}
                        </span>
                        <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {group.title}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {group.shortcuts.map((shortcut, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                              darkMode ? 'bg-[#1f1f1f]' : 'bg-gray-50'
                            }`}
                          >
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, keyIndex) => (
                                <React.Fragment key={keyIndex}>
                                  <KeyBadge>{key}</KeyBadge>
                                  {keyIndex < shortcut.keys.length - 1 && (
                                    <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className={`flex items-center justify-between px-6 py-3 border-t ${
                darkMode ? 'border-[#2a2a2a] bg-[#1f1f1f]' : 'border-gray-200 bg-gray-50'
              }`}>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Press <KeyBadge>?</KeyBadge> anytime to show this menu
                </span>
                <button
                  onClick={onClose}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    darkMode 
                      ? 'bg-white text-black hover:bg-gray-200' 
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcuts;
