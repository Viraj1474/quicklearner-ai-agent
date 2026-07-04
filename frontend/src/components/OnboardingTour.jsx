import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

// Onboarding Context
const OnboardingContext = createContext(null);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
};

// Storage key for onboarding state
const ONBOARDING_STORAGE_KEY = "quicklearner_onboarding_complete";

// Default tour steps
const DEFAULT_TOUR_STEPS = [
  {
    id: "welcome",
    title: "Welcome to Quicklearner! 🎉",
    description: "Your AI-powered study assistant. Let me show you around quickly!",
    target: null, // No specific target - centered modal
    position: "center",
  },
  {
    id: "sidebar",
    title: "Conversation History",
    description: "Access your past conversations here. Click the menu icon to toggle the sidebar.",
    target: "[data-tour='sidebar-toggle']",
    position: "right",
  },
  {
    id: "chat",
    title: "Chat with AI",
    description: "Ask questions, get explanations, and learn interactively. The AI adapts to your learning style.",
    target: "[data-tour='chat-input']",
    position: "top",
  },
  {
    id: "tools",
    title: "Powerful Study Tools",
    description: "Access Notes Highlighter, Summarizer, Quiz Generator, Flashcards, and Analytics from the Tools menu.",
    target: "[data-tour='tools-menu']",
    position: "bottom",
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    description: "Press Ctrl+K to open the command palette, or ? to see all keyboard shortcuts. Speed up your workflow!",
    target: null,
    position: "center",
  },
  {
    id: "theme",
    title: "Customize Your Experience",
    description: "Toggle between light and dark mode, or explore custom themes for a personalized look.",
    target: "[data-tour='theme-toggle']",
    position: "bottom",
  },
  {
    id: "complete",
    title: "You're All Set! ✨",
    description: "Start learning smarter. If you need help, press ? for shortcuts or use the AI assistant.",
    target: null,
    position: "center",
  },
];

// Provider Component
export const OnboardingProvider = ({ children, steps = DEFAULT_TOUR_STEPS }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(true);

  // Check if onboarding was completed
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!completed) {
      setHasCompleted(false);
      // Auto-start tour for new users after a brief delay
      setTimeout(() => setIsActive(true), 500);
    }
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setHasCompleted(true);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, steps.length, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    endTour();
  }, [endTour]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setHasCompleted(false);
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const value = {
    isActive,
    currentStep,
    steps,
    hasCompleted,
    startTour,
    endTour,
    nextStep,
    prevStep,
    skipTour,
    resetTour,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <OnboardingOverlay />
    </OnboardingContext.Provider>
  );
};

// Overlay Component
const OnboardingOverlay = () => {
  const { darkMode } = useTheme();
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour } = useOnboarding();
  const [targetRect, setTargetRect] = useState(null);

  const step = steps[currentStep];

  // Find and highlight target element
  useEffect(() => {
    if (!isActive || !step?.target) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
    window.addEventListener("resize", findTarget);
    window.addEventListener("scroll", findTarget);

    return () => {
      window.removeEventListener("resize", findTarget);
      window.removeEventListener("scroll", findTarget);
    };
  }, [isActive, step]);

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect || step?.position === "center") {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 16;
    const tooltipWidth = 320;

    switch (step?.position) {
      case "right":
        return {
          position: "fixed",
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left + targetRect.width + padding,
          transform: "translateY(-50%)",
        };
      case "left":
        return {
          position: "fixed",
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.left - tooltipWidth - padding,
          transform: "translateY(-50%)",
        };
      case "top":
        return {
          position: "fixed",
          top: targetRect.top - padding,
          left: targetRect.left + targetRect.width / 2,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
      default:
        return {
          position: "fixed",
          top: targetRect.top + targetRect.height + padding,
          left: targetRect.left + targetRect.width / 2,
          transform: "translateX(-50%)",
        };
    }
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Backdrop with spotlight */}
        <motion.div
          className="absolute inset-0 pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: targetRect
              ? `radial-gradient(ellipse ${targetRect.width + 40}px ${targetRect.height + 40}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 0%, rgba(0,0,0,0.8) 100%)`
              : "rgba(0,0,0,0.8)",
          }}
          onClick={skipTour}
        />

        {/* Highlighted element border */}
        {targetRect && (
          <motion.div
            className="absolute border-2 border-white rounded-lg pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
              boxShadow: "0 0 0 4px rgba(255,255,255,0.2), 0 0 30px rgba(255,255,255,0.3)",
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          className="pointer-events-auto"
          style={getTooltipStyle()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          key={currentStep}
        >
          <div className={`
            w-80 rounded-2xl border shadow-2xl overflow-hidden
            ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}
          `}>
            {/* Progress bar */}
            <div className={`h-1 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {step?.title}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  {currentStep + 1}/{steps.length}
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {step?.description}
              </p>
            </div>

            {/* Actions */}
            <div className={`flex items-center justify-between px-5 py-3 border-t ${
              darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'
            }`}>
              <button
                onClick={skipTour}
                className={`text-sm ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      darkMode
                        ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Back
                  </button>
                )}
                <motion.button
                  onClick={nextStep}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    darkMode
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Arrow pointer */}
          {targetRect && step?.position !== "center" && (
            <div
              className={`absolute w-3 h-3 rotate-45 ${
                darkMode ? 'bg-[#1a1a1a]' : 'bg-white'
              }`}
              style={{
                ...(step?.position === "right" && { left: -6, top: "50%", marginTop: -6 }),
                ...(step?.position === "left" && { right: -6, top: "50%", marginTop: -6 }),
                ...(step?.position === "top" && { bottom: -6, left: "50%", marginLeft: -6 }),
                ...(step?.position === "bottom" && { top: -6, left: "50%", marginLeft: -6 }),
              }}
            />
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Tour trigger button component
export const StartTourButton = ({ className = "" }) => {
  const { darkMode } = useTheme();
  const { startTour, hasCompleted } = useOnboarding();

  return (
    <button
      onClick={startTour}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        darkMode
          ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${className}`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4M12 8h.01"/>
      </svg>
      {hasCompleted ? "Replay Tour" : "Start Tour"}
    </button>
  );
};

export default OnboardingProvider;
