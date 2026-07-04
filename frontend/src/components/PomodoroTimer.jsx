import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

// Timer modes
const TIMER_MODES = {
  WORK: { id: "work", label: "Focus", duration: 25 * 60, color: "text-red-400", bg: "bg-red-500/20" },
  SHORT_BREAK: { id: "shortBreak", label: "Short Break", duration: 5 * 60, color: "text-green-400", bg: "bg-green-500/20" },
  LONG_BREAK: { id: "longBreak", label: "Long Break", duration: 15 * 60, color: "text-blue-400", bg: "bg-blue-500/20" },
};

// Notification sound (base64 encoded short beep)
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log("Audio not supported");
  }
};

const PomodoroTimer = ({ isOpen, onClose, onSessionComplete }) => {
  const { darkMode } = useTheme();
  const [mode, setMode] = useState(TIMER_MODES.WORK);
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES.WORK.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    notifications: true,
  });
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("pomodoro_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    const savedSessions = localStorage.getItem("pomodoro_sessions_today");
    if (savedSessions) {
      const { count, date } = JSON.parse(savedSessions);
      if (date === new Date().toDateString()) {
        setSessionsCompleted(count);
      }
    }
  }, []);

  // Save settings
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem("pomodoro_settings", JSON.stringify(newSettings));
  };

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    
    if (settings.notifications) {
      playNotificationSound();
      if (Notification.permission === "granted") {
        new Notification(mode.id === "work" ? "Time for a break!" : "Back to work!", {
          body: mode.id === "work" 
            ? `Great focus session! Take a ${sessionsCompleted % settings.longBreakInterval === settings.longBreakInterval - 1 ? "long" : "short"} break.`
            : "Ready to focus again?",
          icon: "/favicon.ico",
        });
      }
    }

    if (mode.id === "work") {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      localStorage.setItem("pomodoro_sessions_today", JSON.stringify({
        count: newSessions,
        date: new Date().toDateString(),
      }));
      onSessionComplete?.(newSessions);

      // Switch to break
      const nextMode = newSessions % settings.longBreakInterval === 0 
        ? TIMER_MODES.LONG_BREAK 
        : TIMER_MODES.SHORT_BREAK;
      setMode(nextMode);
      setTimeLeft(nextMode.id === "longBreak" ? settings.longBreakDuration * 60 : settings.shortBreakDuration * 60);
      
      if (settings.autoStartBreaks) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    } else {
      setMode(TIMER_MODES.WORK);
      setTimeLeft(settings.workDuration * 60);
      
      if (settings.autoStartWork) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    }
  }, [mode, sessionsCompleted, settings, onSessionComplete]);

  const switchMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    const durations = {
      work: settings.workDuration,
      shortBreak: settings.shortBreakDuration,
      longBreak: settings.longBreakDuration,
    };
    setTimeLeft(durations[newMode.id] * 60);
  };

  const toggleTimer = () => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
      // Request notification permission
      if (settings.notifications && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const durations = {
      work: settings.workDuration,
      shortBreak: settings.shortBreakDuration,
      longBreak: settings.longBreakDuration,
    };
    setTimeLeft(durations[mode.id] * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = mode.id === "work" 
    ? 1 - (timeLeft / (settings.workDuration * 60))
    : mode.id === "shortBreak"
      ? 1 - (timeLeft / (settings.shortBreakDuration * 60))
      : 1 - (timeLeft / (settings.longBreakDuration * 60));

  if (!isOpen) return null;

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

          {/* Timer Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 w-full max-w-md z-50"
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
              <div className={`flex items-center justify-between px-5 py-4 border-b ${
                darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${mode.bg}`}>
                    <svg className={`w-5 h-5 ${mode.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Pomodoro Timer
                    </h2>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {sessionsCompleted} sessions today
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode ? 'hover:bg-[#2a2a2a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                  </button>
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
              </div>

              {/* Mode Tabs */}
              <div className={`flex p-2 gap-2 ${darkMode ? 'bg-[#1f1f1f]' : 'bg-gray-50'}`}>
                {Object.values(TIMER_MODES).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => switchMode(m)}
                    className={`
                      flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                      ${mode.id === m.id
                        ? darkMode
                          ? 'bg-white text-black'
                          : 'bg-black text-white'
                        : darkMode
                          ? 'text-gray-400 hover:bg-[#2a2a2a]'
                          : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Timer Display */}
              <div className="p-8 text-center">
                {/* Progress Ring */}
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke={darkMode ? "#2a2a2a" : "#e5e7eb"}
                      strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke={mode.id === "work" ? "#ef4444" : mode.id === "shortBreak" ? "#22c55e" : "#3b82f6"}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 88}
                      strokeDashoffset={2 * Math.PI * 88 * (1 - progress)}
                      initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - progress) }}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                  
                  {/* Time display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-bold font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatTime(timeLeft)}
                    </span>
                    <span className={`text-sm mt-1 ${mode.color}`}>
                      {mode.label}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={resetTimer}
                    className={`p-3 rounded-xl transition-colors ${
                      darkMode ? 'bg-[#2a2a2a] hover:bg-[#333] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                  </button>
                  
                  <motion.button
                    onClick={toggleTimer}
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center font-medium transition-colors
                      ${isRunning
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : darkMode
                          ? 'bg-white hover:bg-gray-200 text-black'
                          : 'bg-black hover:bg-gray-800 text-white'
                      }
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isRunning ? (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1"/>
                        <rect x="14" y="4" width="4" height="16" rx="1"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 ml-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </motion.button>
                  
                  <button
                    onClick={() => {
                      handleTimerComplete();
                    }}
                    className={`p-3 rounded-xl transition-colors ${
                      darkMode ? 'bg-[#2a2a2a] hover:bg-[#333] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>

                {/* Session indicators */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  {Array.from({ length: settings.longBreakInterval }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        i < (sessionsCompleted % settings.longBreakInterval)
                          ? 'bg-red-500'
                          : darkMode
                            ? 'bg-[#2a2a2a]'
                            : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {settings.longBreakInterval - (sessionsCompleted % settings.longBreakInterval)} sessions until long break
                </p>
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    className={`border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="p-5 space-y-4">
                      <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Timer Settings
                      </h3>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Focus</label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={settings.workDuration}
                            onChange={(e) => saveSettings({ ...settings, workDuration: parseInt(e.target.value) || 25 })}
                            className={`w-full mt-1 px-3 py-2 rounded-lg text-sm ${
                              darkMode 
                                ? 'bg-[#2a2a2a] border-[#3a3a3a] text-white' 
                                : 'bg-gray-100 border-gray-200 text-gray-900'
                            } border focus:outline-none focus:ring-2 focus:ring-white/20`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Short Break</label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={settings.shortBreakDuration}
                            onChange={(e) => saveSettings({ ...settings, shortBreakDuration: parseInt(e.target.value) || 5 })}
                            className={`w-full mt-1 px-3 py-2 rounded-lg text-sm ${
                              darkMode 
                                ? 'bg-[#2a2a2a] border-[#3a3a3a] text-white' 
                                : 'bg-gray-100 border-gray-200 text-gray-900'
                            } border focus:outline-none focus:ring-2 focus:ring-white/20`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Long Break</label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={settings.longBreakDuration}
                            onChange={(e) => saveSettings({ ...settings, longBreakDuration: parseInt(e.target.value) || 15 })}
                            className={`w-full mt-1 px-3 py-2 rounded-lg text-sm ${
                              darkMode 
                                ? 'bg-[#2a2a2a] border-[#3a3a3a] text-white' 
                                : 'bg-gray-100 border-gray-200 text-gray-900'
                            } border focus:outline-none focus:ring-2 focus:ring-white/20`}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Auto-start breaks</span>
                          <button
                            onClick={() => saveSettings({ ...settings, autoStartBreaks: !settings.autoStartBreaks })}
                            className={`w-10 h-6 rounded-full transition-colors ${
                              settings.autoStartBreaks
                                ? 'bg-green-500'
                                : darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'
                            }`}
                          >
                            <motion.div
                              className="w-4 h-4 rounded-full bg-white shadow-sm"
                              animate={{ x: settings.autoStartBreaks ? 20 : 4 }}
                            />
                          </button>
                        </label>
                        <label className="flex items-center justify-between">
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Auto-start focus</span>
                          <button
                            onClick={() => saveSettings({ ...settings, autoStartWork: !settings.autoStartWork })}
                            className={`w-10 h-6 rounded-full transition-colors ${
                              settings.autoStartWork
                                ? 'bg-green-500'
                                : darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'
                            }`}
                          >
                            <motion.div
                              className="w-4 h-4 rounded-full bg-white shadow-sm"
                              animate={{ x: settings.autoStartWork ? 20 : 4 }}
                            />
                          </button>
                        </label>
                        <label className="flex items-center justify-between">
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sound notifications</span>
                          <button
                            onClick={() => saveSettings({ ...settings, notifications: !settings.notifications })}
                            className={`w-10 h-6 rounded-full transition-colors ${
                              settings.notifications
                                ? 'bg-green-500'
                                : darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'
                            }`}
                          >
                            <motion.div
                              className="w-4 h-4 rounded-full bg-white shadow-sm"
                              animate={{ x: settings.notifications ? 20 : 4 }}
                            />
                          </button>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Mini timer widget for header
export const MiniPomodoroTimer = ({ onClick, isRunning, timeLeft, mode }) => {
  const { darkMode } = useTheme();
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isRunning && !timeLeft) return null;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        darkMode 
          ? 'bg-[#2a2a2a] hover:bg-[#333]' 
          : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
      <span className={`font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {formatTime(timeLeft)}
      </span>
    </button>
  );
};

export default PomodoroTimer;
