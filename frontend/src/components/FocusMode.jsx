import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

// Focus Mode Context
const FocusModeContext = createContext(null);

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error("useFocusMode must be used within FocusModeProvider");
  }
  return context;
};

// Provider Component
export const FocusModeProvider = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [focusTarget, setFocusTarget] = useState(null); // ID of focused element
  const [settings, setSettings] = useState({
    dimLevel: 0.7, // 0-1
    hideUI: true, // Hide navigation elements
    ambientSound: null, // rain, forest, cafe, etc.
    breathingReminder: false,
    reminderInterval: 30, // minutes
  });

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem("focus_mode_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const saveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    localStorage.setItem("focus_mode_settings", JSON.stringify(newSettings));
  }, []);

  const enterFocusMode = useCallback((targetId = null) => {
    setFocusTarget(targetId);
    setIsActive(true);
    document.body.style.overflow = "hidden";
  }, []);

  const exitFocusMode = useCallback(() => {
    setIsActive(false);
    setFocusTarget(null);
    document.body.style.overflow = "";
  }, []);

  const toggleFocusMode = useCallback(() => {
    if (isActive) {
      exitFocusMode();
    } else {
      enterFocusMode();
    }
  }, [isActive, enterFocusMode, exitFocusMode]);

  return (
    <FocusModeContext.Provider value={{
      isActive,
      focusTarget,
      settings,
      saveSettings,
      enterFocusMode,
      exitFocusMode,
      toggleFocusMode,
    }}>
      {children}
      <FocusModeOverlay />
    </FocusModeContext.Provider>
  );
};

// Focus Mode Overlay
const FocusModeOverlay = () => {
  const { darkMode } = useTheme();
  const { isActive, exitFocusMode, settings } = useFocusMode();
  const [showExitHint, setShowExitHint] = useState(true);
  const [breathingPhase, setBreathingPhase] = useState("inhale");

  // Hide exit hint after a few seconds
  useEffect(() => {
    if (isActive) {
      setShowExitHint(true);
      const timer = setTimeout(() => setShowExitHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  // Breathing reminder
  useEffect(() => {
    if (!isActive || !settings.breathingReminder) return;

    const interval = setInterval(() => {
      setBreathingPhase((prev) => {
        if (prev === "inhale") return "hold";
        if (prev === "hold") return "exhale";
        return "inhale";
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isActive, settings.breathingReminder]);

  // Escape key to exit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isActive) {
        exitFocusMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, exitFocusMode]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[45] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Dim overlay - doesn't block the main content */}
          <div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 60% 50% at 50% 50%, transparent 0%, rgba(0,0,0,${settings.dimLevel}) 100%)`,
            }}
          />

          {/* Exit hint */}
          <AnimatePresence>
            {showExitHint && (
              <motion.div
                className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className={`px-4 py-2 rounded-full text-sm ${
                  darkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
                }`}>
                  Press <kbd className="px-1.5 py-0.5 mx-1 rounded bg-white/20">Esc</kbd> to exit Focus Mode
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Breathing indicator */}
          {settings.breathingReminder && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <motion.div
                className="flex flex-col items-center"
                animate={{
                  scale: breathingPhase === "inhale" ? 1.2 : breathingPhase === "hold" ? 1.2 : 1,
                }}
                transition={{ duration: 4 }}
              >
                <motion.div
                  className={`w-16 h-16 rounded-full ${
                    darkMode ? 'bg-white/10' : 'bg-black/10'
                  }`}
                  animate={{
                    scale: breathingPhase === "inhale" ? 1.5 : breathingPhase === "hold" ? 1.5 : 1,
                    opacity: breathingPhase === "exhale" ? 0.5 : 1,
                  }}
                  transition={{ duration: 4 }}
                />
                <span className={`text-xs mt-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>
                  {breathingPhase === "inhale" ? "Breathe in..." : breathingPhase === "hold" ? "Hold..." : "Breathe out..."}
                </span>
              </motion.div>
            </div>
          )}

          {/* Exit button (appears on hover at bottom) */}
          <motion.button
            className="absolute bottom-4 right-4 pointer-events-auto"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            animate={{ opacity: 0.3 }}
            onClick={exitFocusMode}
          >
            <div className={`p-3 rounded-full ${
              darkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black'
            }`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Focus Mode Toggle Button
export const FocusModeToggle = ({ className = "" }) => {
  const { darkMode } = useTheme();
  const { isActive, toggleFocusMode } = useFocusMode();

  return (
    <button
      onClick={toggleFocusMode}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'bg-purple-500 text-white'
          : darkMode
            ? 'bg-[#2a2a2a] hover:bg-[#333] text-gray-300'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      } ${className}`}
      title={isActive ? "Exit Focus Mode" : "Enter Focus Mode"}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {isActive ? (
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        ) : (
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        )}
      </svg>
      <span className="hidden sm:inline">{isActive ? "Exit Focus" : "Focus"}</span>
    </button>
  );
};

// Focus Mode Settings Panel
export const FocusModeSettings = ({ isOpen, onClose }) => {
  const { darkMode } = useTheme();
  const { settings, saveSettings } = useFocusMode();

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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <div className={`flex items-center justify-between px-5 py-4 border-b ${
            darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'
          }`}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Focus Mode Settings
            </h2>
            <button onClick={onClose} className={`p-2 rounded-lg ${
              darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
            }`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Dim Level */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Dim Level: {Math.round(settings.dimLevel * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.dimLevel * 100}
                onChange={(e) => saveSettings({ ...settings, dimLevel: parseInt(e.target.value) / 100 })}
                className="w-full"
              />
            </div>

            {/* Breathing Reminder */}
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Breathing Reminder
                </span>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Gentle breathing animation
                </p>
              </div>
              <button
                onClick={() => saveSettings({ ...settings, breathingReminder: !settings.breathingReminder })}
                className={`w-10 h-6 rounded-full transition-colors ${
                  settings.breathingReminder ? 'bg-purple-500' : darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'
                }`}
              >
                <motion.div
                  className="w-4 h-4 rounded-full bg-white shadow-sm"
                  animate={{ x: settings.breathingReminder ? 20 : 4 }}
                />
              </button>
            </div>

            {/* Hide UI */}
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Hide Navigation
                </span>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Hide header and sidebar
                </p>
              </div>
              <button
                onClick={() => saveSettings({ ...settings, hideUI: !settings.hideUI })}
                className={`w-10 h-6 rounded-full transition-colors ${
                  settings.hideUI ? 'bg-purple-500' : darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'
                }`}
              >
                <motion.div
                  className="w-4 h-4 rounded-full bg-white shadow-sm"
                  animate={{ x: settings.hideUI ? 20 : 4 }}
                />
              </button>
            </div>
          </div>

          <div className={`px-5 py-4 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
            <button
              onClick={onClose}
              className={`w-full py-2 rounded-xl text-sm font-medium ${
                darkMode ? 'bg-white text-black' : 'bg-black text-white'
              }`}
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FocusModeProvider;
