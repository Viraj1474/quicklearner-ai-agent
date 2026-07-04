import React, { Suspense, useState, useEffect, useRef } from "react";
import { useTheme } from "./components/theme";
import { useAuth } from "./components/AuthContext";
import AuthModal from "./components/AuthModal";
import UserProfile from "./components/UserProfile";
import Avatar from "./components/Avatar";
import ClaudeChat from "./components/ClaudeChat";
import NotesHighlighter from "./components/NotesHighlighter";
import { motion, AnimatePresence } from "framer-motion";

// New enhancement components
import CommandPalette from "./components/CommandPalette";
import { ToastProvider, useToast } from "./components/ToastProvider";
import Confetti, { useConfetti } from "./components/Confetti";
import ErrorBoundary from "./components/ErrorBoundary";
import SearchEverything, { useSearch } from "./components/SearchEverything";
import ExportOptions, { useExport } from "./components/ExportOptions";
import { SpacedRepetitionProvider, useSpacedRepetition, SpacedRepetitionStats } from "./components/SpacedRepetition";

// Additional UI components
import KeyboardShortcuts from "./components/KeyboardShortcuts";
import { OnboardingProvider, useOnboarding } from "./components/OnboardingTour";
import ThemePicker, { useCustomTheme } from "./components/ThemePicker";
import PageTransition, { AnimatedSwitch } from "./components/PageTransition";

// Productivity features
import { MiniPomodoroTimer } from "./components/PomodoroTimer";
import { FocusModeProvider, useFocusMode, FocusModeToggle } from "./components/FocusMode";
import StudyGoals, { GoalProgressWidget, useStudyGoals } from "./components/StudyGoals";
import StreakTracker, { StreakWidget, StreakAutoRecord, useStreak } from "./components/StreakTracker";

// New UI/UX Enhancement Components
import { WelcomeState, EmptyState } from "./components/WelcomeState";
import LearningPath, { LearningPathWidget, useLearningPath } from "./components/LearningPath";
import { CelebrationProvider, useCelebration, QuizCompletionScreen } from "./components/Celebrations";
import { Tooltip, InfoTooltip, ContextualHint, SuggestedActions } from "./components/ContextualHelp";
import DashboardWidgets from "./components/DashboardWidgets";
import { NicknameProvider, useNickname, NicknamePrompt } from "./components/NicknameModal";

// Productivity & Auth enhancements
import SessionTimeoutWarning from "./components/SessionTimeoutWarning";
import RecentItems from "./components/RecentItems";
import { useRecentItems } from "./components/hooks/useProductivity";
import QuickActionsButton from "./components/QuickActionsButton";
import UpgradeModal from "./components/premium/UpgradeModal";
import PremiumFeatureGate from "./components/premium/PremiumFeatureGate";
import { useQuota } from "./components/hooks/useQuota";

const Summary = React.lazy(() => import("./components/Summary"));
const QuizGenerator = React.lazy(() => import("./components/QuizGenerator"));
const FlashcardsContainer = React.lazy(() => import("./components/FlashcardsContainer"));
const Analytics = React.lazy(() => import("./components/Analytics"));
const PricingPage = React.lazy(() => import("./components/premium/PricingPage"));
const PomodoroTimer = React.lazy(() => import("./components/PomodoroTimer"));
const ReviewSession = React.lazy(() => import("./components/SpacedRepetition").then((module) => ({ default: module.ReviewSession })));

const LoadingPanel = () => (
  <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
);

// Main App component - Claude-like UI
function AppContent() {
  const { darkMode, toggleDarkMode } = useTheme();
  const {
    isAuthenticated,
    user,
    loading,
    hasPremiumAccess,
    isDeveloperOrAdmin,
    createCheckoutSession,
    verifyRazorpayPayment,
    refreshUser,
  } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [authModalView, setAuthModalView] = useState('login');
  const [activeTool, setActiveTool] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [cards, setCards] = useState([]);
  
  // Sidebar and chat state (lifted from ClaudeChat for unified header)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatRef = React.useRef(null);

  // New feature states and refs
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showReviewSession, setShowReviewSession] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showStudyGoals, setShowStudyGoals] = useState(false);
  const [showStreakTracker, setShowStreakTracker] = useState(false);
  const [showLearningPath, setShowLearningPath] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const toast = useToast();
  const { confettiRef, fireConfetti } = useConfetti();
  const { isFeatureLocked } = useQuota();
  const { searchRef, openSearch } = useSearch();
  const { exportRef, openExport } = useExport();
  const { nickname, showNicknameModal } = useNickname();
  
  // Recent items tracking for productivity
  const { addRecentItem } = useRecentItems();

  // Apply custom theme on mount
  useCustomTheme();

  const subscriptionLabel = isDeveloperOrAdmin
    ? 'Developer access'
    : hasPremiumAccess
    ? `Premium ${user?.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : ''}`.trim()
    : 'Free Plan';

  // Check for reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token && window.location.pathname.includes('reset-password')) {
      setAuthModalView('reset-password');
      setShowAuthModal(true);
    }
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAuthSuccess = (authUser) => {
    setShowAuthModal(false);
    window.history.replaceState({}, document.title, window.location.pathname);
    setShowPricing(false);
    setShowUpgradeModal(false);
  };

  const openAuthModal = (view = 'login') => {
    setAuthModalView(view);
    setShowAuthModal(true);
  };

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handleCheckout = async (selectedPlan = 'pro_monthly', selectedProvider = 'stripe') => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    try {
      setCheckoutLoading(true);
      const session = await createCheckoutSession({
        plan: selectedPlan,
        provider: selectedProvider,
        country: user?.country,
      });
      const checkoutUrl = session?.checkout_url || session?.url || session?.redirect_url || session?.payment_url;
      const razorpayOrderId = session?.order_id || session?.razorpay_order_id;

      if (session?.provider === 'razorpay' && razorpayOrderId) {
        const ready = await loadRazorpayScript();
        if (!ready) {
          throw new Error('Razorpay SDK failed to load. Please try Stripe checkout.');
        }

        const razorpay = new window.Razorpay({
          key: session.key,
          amount: session.amount,
          currency: session.currency || 'INR',
          name: 'AI Agent Premium',
          description: selectedPlan === 'pro_yearly' ? 'Pro Yearly' : 'Pro Monthly',
          order_id: razorpayOrderId,
          handler: async (response) => {
            try {
              await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_code: selectedPlan,
              });
              await refreshUser();
              toast.success('Upgrade successful', 'Your Premium subscription is now active.');
              setShowUpgradeModal(false);
              setShowPricing(false);
            } catch (paymentError) {
              console.error('Razorpay verify failed', paymentError);
              toast.error('Payment verification failed', paymentError.message || 'Please try again or use another payment method.');
            }
          },
          modal: {
            ondismiss: () => toast.info('Checkout canceled', 'You can resume the upgrade any time.'),
          },
          prefill: {
            name: user?.username || '',
            email: user?.email || '',
          },
        });
        razorpay.open();
        return;
      }

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      throw new Error(`Checkout session was not created. Response: ${JSON.stringify(session)}`);
    } catch (error) {
      console.error('Checkout failed', error);
      toast.error('Checkout failed', error.message || 'Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const openPricingPage = () => {
    setShowUpgradeModal(false);
    setShowPricing(true);
  };

  const openUpgradePrompt = () => {
    setShowPricing(false);
    setShowUpgradeModal(true);
  };

  const handleToolOpen = (toolId) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setActiveTool(toolId);
    
    // Track in recent items
    const toolNames = {
      notes: 'Notes Highlighter',
      summary: 'Text Summarizer',
      quiz: 'Quiz Generator',
      flashcards: 'Flashcards',
      analytics: 'Study Analytics',
    };
    addRecentItem({
      id: `tool-${toolId}`,
      type: toolId,
      title: toolNames[toolId] || toolId,
      description: 'Learning tool',
    });
  };

  // Enhanced tool definitions with descriptions, shortcuts, and colors
  const tools = [
    { 
      id: 'notes', 
      name: 'Notes Highlighter', 
      description: 'Extract key points from your notes',
      shortcut: 'N',
      color: 'blue',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    },
    { 
      id: 'summary', 
      name: 'Text Summarizer', 
      description: 'Create concise summaries of long texts',
      shortcut: 'S',
      color: 'green',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'quiz', 
      name: 'Quiz Generator', 
      description: 'Generate quizzes to test your knowledge',
      shortcut: 'Q',
      color: 'purple',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'flashcards', 
      name: 'Flashcards', 
      description: 'Create and study with AI flashcards',
      shortcut: 'F',
      color: 'orange',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    { 
      id: 'analytics', 
      name: 'Study Analytics', 
      description: 'Track your learning progress',
      shortcut: 'A',
      color: 'pink',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
  ];

  // Keyboard shortcuts for tools
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input (except for Escape)
      const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
      
      // Show keyboard shortcuts with ? (Shift + /)
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
        return;
      }
      
      if (isTyping) return;
      
      // Command palette with Ctrl+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }
      
      // Theme picker with Ctrl+T
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        setShowThemePicker(prev => !prev);
        return;
      }
      
      // Toggle dark mode with Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleDarkMode();
        return;
      }
      
      // Toggle sidebar with Ctrl+\
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
        return;
      }
      
      // Export with Ctrl+E
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        openExport();
        return;
      }
      
      // Review session with Ctrl+R
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        setShowReviewSession(true);
        return;
      }
      
      // Pomodoro with Ctrl+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setShowPomodoro(prev => !prev);
        return;
      }
      
      // Study Goals with Ctrl+G
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setShowStudyGoals(prev => !prev);
        return;
      }
      
      // Global search with Ctrl+F (when not in input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !activeTool) {
        e.preventDefault();
        openSearch();
        return;
      }
      
      // Close tool modal with Escape
      if (e.key === 'Escape' && activeTool) {
        setActiveTool(null);
        return;
      }
      
      // Tool shortcuts (Ctrl/Cmd + key)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        const key = e.key.toUpperCase();
        const tool = tools.find(t => t.shortcut === key);
        if (tool) {
          e.preventDefault();
          handleToolOpen(tool.id);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, isAuthenticated, showCommandPalette]);

  // Color classes for tool icons
  const getToolColors = (color, isDark) => {
    const colors = {
      blue: isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600',
      green: isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600',
      purple: isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600',
      orange: isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600',
      pink: isDark ? 'bg-pink-500/20 text-pink-400' : 'bg-pink-100 text-pink-600',
    };
    return colors[color] || colors.blue;
  };

  // Command palette commands
  const commandPaletteCommands = [
    // Tools
    ...tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      category: 'Tools',
      shortcut: `Ctrl+${tool.shortcut}`,
      action: () => handleToolOpen(tool.id),
    })),
    // Actions
    { id: 'new-chat', name: 'New Conversation', category: 'Actions', shortcut: 'Ctrl+N', action: () => chatRef.current?.startNewConversation() },
    { id: 'toggle-theme', name: darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode', category: 'Actions', action: toggleDarkMode },
    { id: 'toggle-sidebar', name: sidebarOpen ? 'Close Sidebar' : 'Open Sidebar', category: 'Actions', action: () => setSidebarOpen(!sidebarOpen) },
    // Search & Export
    { id: 'search', name: 'Search Everything', category: 'Search', shortcut: 'Ctrl+F', action: () => openSearch() },
    { id: 'export', name: 'Export Study Materials', category: 'Export', action: () => openExport() },
    // Spaced Repetition
    { id: 'review', name: 'Start Review Session', category: 'Learning', action: () => setShowReviewSession(true) },
    // Productivity
    { id: 'pomodoro', name: 'Pomodoro Timer', category: 'Productivity', shortcut: 'Ctrl+P', action: () => setShowPomodoro(true) },
    { id: 'goals', name: 'Study Goals', category: 'Productivity', shortcut: 'Ctrl+G', action: () => setShowStudyGoals(true) },
    { id: 'streak', name: 'Streak Tracker', category: 'Productivity', action: () => setShowStreakTracker(true) },
    { id: 'theme-picker', name: 'Change Theme', category: 'Appearance', shortcut: 'Ctrl+T', action: () => setShowThemePicker(true) },
  ];

  const handleCommandSelect = (command) => {
    command.action();
    setShowCommandPalette(false);
  };
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`w-8 h-8 border-2 rounded-full ${darkMode ? 'border-gray-600 border-t-white' : 'border-gray-200 border-t-gray-900'}`}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col overflow-hidden ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
      {/* Unified header - Single navigation bar */}
      <header className={`h-14 flex-shrink-0 flex items-center justify-between px-3 sm:px-4 border-b ${
        darkMode ? 'border-[#2a2a2a] bg-[#1a1a1a]' : 'border-gray-100 bg-white'
      }`}>
        {/* Left side: Menu toggle + Logo */}
        <div className="flex items-center gap-3">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-[#2a2a2a] text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
            aria-label="Toggle sidebar"
            data-tour="sidebar-toggle"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Logo + App name + AI badge */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              darkMode ? 'bg-white text-black' : 'bg-black text-white'
            }`}>
              Q
            </div>
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Quicklearner
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}>
              AI
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* New conversation button */}
          <button
            onClick={() => chatRef.current?.startNewConversation()}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-[#2a2a2a] text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="New conversation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          {/* Tools dropdown */}
          <div className="relative group hidden sm:block" data-tour="tools-menu">
            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              darkMode 
                ? 'hover:bg-[#2a2a2a] text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">Tools</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Enhanced dropdown menu */}
            <div className={`absolute right-0 mt-2 w-72 rounded-xl shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 ${
              darkMode 
                ? 'bg-[#1f1f1f] border-[#2a2a2a]' 
                : 'bg-white border-gray-200'
            }`}>
              {/* Dropdown header */}
              <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  AI Study Tools
                </h3>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Press Ctrl + shortcut key for quick access
                </p>
              </div>
              
              {/* Tool list */}
              <div className="py-2">
                {tools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolOpen(tool.id)}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                      darkMode 
                        ? 'hover:bg-[#2a2a2a]' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Tool icon with color */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getToolColors(tool.color, darkMode)}`}>
                      {tool.icon}
                    </div>
                    
                    {/* Tool info */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {tool.name}
                      </div>
                      <div className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {tool.description}
                      </div>
                    </div>
                    
                    {/* Shortcut badge or lock */}
                    {!isAuthenticated ? (
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${
                        darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        ⌘{tool.shortcut}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Dropdown footer */}
              {!isAuthenticated && (
                <div className={`px-4 py-3 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                  <button
                    onClick={() => openAuthModal('login')}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      darkMode 
                        ? 'bg-white text-black hover:bg-gray-200' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    Sign in to unlock tools
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Productivity widgets */}
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-1">
              {/* Mini Pomodoro */}
              <MiniPomodoroTimer onClick={() => setShowPomodoro(true)} />
              
              {/* Learning Path / XP */}
              <LearningPathWidget onClick={() => setShowLearningPath(true)} />
              
              {/* Streak */}
              <StreakWidget onClick={() => setShowStreakTracker(true)} />
              
              {/* Goals */}
              <GoalProgressWidget onClick={() => setShowStudyGoals(true)} />
              
              {/* Focus Mode */}
              <FocusModeToggle />
              
              {/* Dashboard */}
              <Tooltip content="Dashboard" shortcut="Ctrl+D">
                <button
                  onClick={() => setShowDashboard(true)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'hover:bg-[#2a2a2a] text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </button>
              </Tooltip>
            </div>
          )}

          {!isDeveloperOrAdmin && (
            <>
              <button
                onClick={openPricingPage}
                className={`hidden md:inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
                  hasPremiumAccess
                    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                    : 'border-indigo-400/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                }`}
              >
                {isAuthenticated ? subscriptionLabel : 'Pricing'}
              </button>

              <button
                onClick={openPricingPage}
                className="inline-flex rounded-lg bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 px-3 sm:px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-transform hover:scale-[1.01]"
              >
                {hasPremiumAccess ? 'Manage plan' : 'Upgrade'}
              </button>
            </>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-[#2a2a2a] text-gray-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
            data-tour="theme-toggle"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* User button */}
          {isAuthenticated && user ? (
            <button
              onClick={() => setShowProfile(true)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-[#2a2a2a]' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <Avatar
                src={user.profile_picture}
                name={user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : user.username}
                email={user.email}
                size="sm"
              />
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                darkMode 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 min-h-0 h-[calc(100vh-3.5rem)] overflow-hidden">
        <ClaudeChat 
          ref={chatRef}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onToolOpen={handleToolOpen}
          onSignInRequired={() => openAuthModal('login')}
        />
      </main>

      {/* Tool modal */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setActiveTool(null)}
            />
            
            {/* Modal */}
            <motion.div
              className={`relative w-full max-w-4xl max-h-[calc(100vh-1rem)] sm:max-h-[85vh] mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
                darkMode ? 'bg-[#1a1a1a]' : 'bg-white'
              }`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              {/* Modal header */}
              <div className={`flex items-center justify-between px-4 sm:px-6 py-4 border-b ${
                darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  {/* Tool icon with color background */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    getToolColors(tools.find(t => t.id === activeTool)?.color, darkMode)
                  }`}>
                    {tools.find(t => t.id === activeTool)?.icon}
                  </div>
                  <div>
                    <h2 className={`text-base sm:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {tools.find(t => t.id === activeTool)?.name}
                    </h2>
                    <p className={`hidden sm:block text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {tools.find(t => t.id === activeTool)?.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Keyboard shortcut hint */}
                  <span className={`hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
                    darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className="font-mono">Esc</span>
                    <span>to close</span>
                  </span>
                  <button
                    onClick={() => setActiveTool(null)}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'hover:bg-[#2a2a2a] text-gray-400' 
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Modal content */}
              <div className="flex-1 overflow-auto p-4 sm:p-6">
                {activeTool === 'notes' && (
                  <NotesHighlighter
                    onNewSummary={(s) => setSummaries(prev => [s, ...prev])}
                    expanded={true}
                  />
                )}
                {activeTool === 'summary' && (
                  <ErrorBoundary darkMode={darkMode}>
                    <Summary 
                      summaries={summaries} 
                      onNewSummary={(s) => setSummaries(prev => [s, ...prev])} 
                    />
                  </ErrorBoundary>
                )}
                {activeTool === 'quiz' && (
                  <ErrorBoundary darkMode={darkMode}>
                    <QuizGenerator onQuizGenerated={setQuiz} />
                  </ErrorBoundary>
                )}
                {activeTool === 'flashcards' && (
                  <ErrorBoundary darkMode={darkMode}>
                    <FlashcardsContainer 
                      cards={cards} 
                      onNewCards={(newCards) => setCards(prev => [...newCards, ...prev])}
                    />
                  </ErrorBoundary>
                )}
                {activeTool === 'analytics' && (
                  <PremiumFeatureGate
                    user={user}
                    hasPremium={hasPremiumAccess}
                    title="Premium analytics locked"
                    featureName="Study analytics"
                    description="Analytics is part of the premium workflow here. Upgrade once to remove the ceiling and keep the richer dashboard experience."
                    onUpgrade={openUpgradePrompt}
                    onSecondaryAction={openPricingPage}
                  >
                    <Analytics
                      summaryCount={summaries.length}
                      quizQuestionCount={quiz.length}
                    />
                  </PremiumFeatureGate>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            initialView={authModalView}
            onClose={() => setShowAuthModal(false)}
            onAuthSuccess={handleAuthSuccess}
            onSwitchView={setAuthModalView}
          />
        )}
      </AnimatePresence>

      {/* User profile modal */}
      <AnimatePresence>
        {showProfile && isAuthenticated && (
          <UserProfile
            onClose={() => setShowProfile(false)}
            onOpenPricing={openPricingPage}
          />
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commandPaletteCommands}
        onCommandSelect={handleCommandSelect}
      />

      {/* Confetti for celebrations */}
      <Confetti ref={confettiRef} />

      {/* Search Everything */}
      <SearchEverything
        ref={searchRef}
        searchData={{
          flashcards: cards,
          summaries: summaries.map((s, i) => ({ id: i, title: `Summary ${i + 1}`, content: s })),
          quizzes: quiz,
        }}
        onResultSelect={(result) => {
          // Handle search result selection
          if (result.category === 'flashcards') {
            handleToolOpen('flashcards');
          } else if (result.category === 'summaries') {
            handleToolOpen('summary');
          } else if (result.category === 'quizzes') {
            handleToolOpen('quiz');
          }
          toast.success('Opened item', result.title);
        }}
      />

      {/* Export Options */}
      <ExportOptions
        ref={exportRef}
        data={{
          flashcards: cards,
          summary: summaries.join('\n\n---\n\n'),
          quiz: quiz,
        }}
        title="My Study Materials"
        onExportComplete={(format) => {
          toast.success('Export complete', `Exported as ${format.toUpperCase()}.`);
          fireConfetti('confetti');
        }}
      />

      {/* Spaced Repetition Review Session Modal */}
      <AnimatePresence>
        {showReviewSession && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowReviewSession(false)}
            />
            <motion.div
              className="relative w-full max-w-xl mx-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <Suspense fallback={<LoadingPanel />}>
                <ReviewSession
                  onComplete={(stats) => {
                    setShowReviewSession(false);
                    if (stats.reviewed > 0) {
                      toast.success(
                        'Review complete',
                        `Reviewed ${stats.reviewed} cards with ${Math.round((stats.correct / stats.reviewed) * 100)}% accuracy.`
                      );
                      fireConfetti('celebration');
                    }
                  }}
                  onClose={() => setShowReviewSession(false)}
                />
              </Suspense>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts 
        isOpen={showKeyboardShortcuts} 
        onClose={() => setShowKeyboardShortcuts(false)} 
      />

      {/* Theme Picker Modal */}
      <ThemePicker 
        isOpen={showThemePicker} 
        onClose={() => setShowThemePicker(false)} 
      />

      {/* Pomodoro Timer Modal */}
      <Suspense fallback={<LoadingPanel />}>
        <PomodoroTimer 
          isOpen={showPomodoro} 
          onClose={() => setShowPomodoro(false)} 
        />
      </Suspense>

      {/* Study Goals Modal */}
      <StudyGoals 
        isOpen={showStudyGoals} 
        onClose={() => setShowStudyGoals(false)} 
      />

      {/* Streak Tracker Modal */}
      <StreakTracker 
        isOpen={showStreakTracker} 
        onClose={() => setShowStreakTracker(false)} 
      />

      {/* Learning Path Modal */}
      <LearningPath
        isOpen={showLearningPath}
        onClose={() => setShowLearningPath(false)}
      />

      {/* Dashboard Modal */}
      <AnimatePresence>
        {showDashboard && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDashboard(false)} />
            <motion.div
              className={`absolute inset-4 md:inset-8 rounded-2xl overflow-hidden shadow-2xl ${
                darkMode ? 'bg-[#0d0d0d]' : 'bg-gray-50'
              }`}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <button
                onClick={() => setShowDashboard(false)}
                className={`absolute top-4 right-4 z-10 p-2 rounded-lg ${
                  darkMode ? 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white' : 'bg-white hover:bg-gray-100 text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="h-full overflow-auto">
                <DashboardWidgets
                  userName={nickname}
                  subscription={user}
                  onClose={() => setShowDashboard(false)}
                  onToolOpen={(tool) => { setShowDashboard(false); handleToolOpen(tool); }}
                  onStartReview={() => { setShowDashboard(false); setShowReviewSession(true); }}
                  onViewGoals={() => { setShowDashboard(false); setShowStudyGoals(true); }}
                  onEditNickname={showNicknameModal}
                  onOpenPricing={openPricingPage}
                  onManageBilling={() => setShowProfile(true)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pricing page */}
      <Suspense fallback={<LoadingPanel />}>
        <PricingPage
          isOpen={showPricing}
          onClose={() => setShowPricing(false)}
          onSelectPlan={handleCheckout}
          checkoutLoading={checkoutLoading}
          onAuthRequired={(view) => {
            setShowPricing(false);
            openAuthModal(view);
          }}
          user={user}
          subscription={user}
        />
      </Suspense>

      {/* Quick upgrade modal */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            console.log('closing modal from parent');
            setShowUpgradeModal(false);
          }}
          onSelectPlan={handleCheckout}
          checkoutLoading={checkoutLoading}
          currentBillingCycle={user?.billing_cycle || 'yearly'}
          user={user}
        />
      )}

      {/* Auto-record streak on app load */}
      {isAuthenticated && <StreakAutoRecord />}
      
      {/* Nickname prompt for first-time users */}
      {isAuthenticated && <NicknamePrompt />}
      
      {/* Session timeout warning */}
      <SessionTimeoutWarning />
      
      {/* Quick actions FAB */}
      <QuickActionsButton
        onNewChat={() => chatRef.current?.startNewConversation?.()}
        onOpenTool={handleToolOpen}
        onOpenCommand={() => setShowCommandPalette(true)}
      />
    </div>
  );
}

// Wrap with providers
function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <NicknameProvider>
          <CelebrationProvider>
            <SpacedRepetitionProvider>
              <OnboardingProvider>
                <FocusModeProvider>
                  <Suspense fallback={<LoadingPanel />}>
                    <AppContent />
                  </Suspense>
                </FocusModeProvider>
              </OnboardingProvider>
            </SpacedRepetitionProvider>
          </CelebrationProvider>
        </NicknameProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;