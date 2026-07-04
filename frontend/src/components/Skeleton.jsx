import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "./theme";

// Base skeleton with shimmer animation
const SkeletonBase = ({ className, rounded = "rounded-lg" }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`relative overflow-hidden ${rounded} ${className} ${
      darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'
    }`}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: darkMode
            ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

// Text line skeleton
export const SkeletonText = ({ lines = 1, className = "" }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase 
          key={i} 
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`} 
        />
      ))}
    </div>
  );
};

// Avatar/circle skeleton
export const SkeletonAvatar = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };
  
  return <SkeletonBase className={`${sizes[size]} ${className}`} rounded="rounded-full" />;
};

// Card skeleton
export const SkeletonCard = ({ className = "" }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`p-4 rounded-xl border ${
      darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'
    } ${className}`}>
      <div className="flex items-start gap-3">
        <SkeletonAvatar size="md" />
        <div className="flex-1">
          <SkeletonBase className="h-4 w-1/3 mb-2" />
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
};

// Chat message skeleton
export const SkeletonChatMessage = ({ isUser = false }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && <SkeletonAvatar size="sm" />}
      <div className={`flex-1 ${isUser ? 'max-w-[70%] ml-auto' : 'max-w-[80%]'}`}>
        <div className={`p-4 rounded-2xl ${
          isUser 
            ? darkMode ? 'bg-[#2f2f2f]' : 'bg-gray-100'
            : 'bg-transparent'
        }`}>
          <SkeletonText lines={isUser ? 1 : 3} />
        </div>
      </div>
    </div>
  );
};

// List item skeleton
export const SkeletonListItem = ({ hasAvatar = true, className = "" }) => {
  return (
    <div className={`flex items-center gap-3 py-2 ${className}`}>
      {hasAvatar && <SkeletonAvatar size="sm" />}
      <div className="flex-1">
        <SkeletonBase className="h-4 w-2/3 mb-1" />
        <SkeletonBase className="h-3 w-1/2" />
      </div>
      <SkeletonBase className="h-6 w-12 rounded-full" />
    </div>
  );
};

// Flashcard skeleton
export const SkeletonFlashcard = () => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`p-6 rounded-2xl border ${
      darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'
    }`}>
      <SkeletonBase className="h-6 w-1/4 mb-4" />
      <SkeletonText lines={3} />
      <div className="flex gap-2 mt-6">
        <SkeletonBase className="h-10 flex-1" rounded="rounded-xl" />
        <SkeletonBase className="h-10 flex-1" rounded="rounded-xl" />
      </div>
    </div>
  );
};

// Quiz question skeleton
export const SkeletonQuizQuestion = () => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`p-6 rounded-2xl border ${
      darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonBase className="w-8 h-8" rounded="rounded-lg" />
        <SkeletonBase className="h-5 flex-1" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBase key={i} className="h-12" rounded="rounded-xl" />
        ))}
      </div>
    </div>
  );
};

// Stats card skeleton
export const SkeletonStats = () => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`p-5 rounded-2xl border ${
      darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <SkeletonBase className="w-10 h-10" rounded="rounded-xl" />
        <SkeletonBase className="w-12 h-5" rounded="rounded-full" />
      </div>
      <SkeletonBase className="h-8 w-1/3 mb-2" />
      <SkeletonBase className="h-4 w-1/2" />
    </div>
  );
};

// Analytics grid skeleton
export const SkeletonAnalytics = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonStats key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonCard className="h-64" />
        </div>
        <SkeletonCard className="h-64" />
      </div>
    </div>
  );
};

// Full page loading skeleton
export const SkeletonPage = ({ type = "chat" }) => {
  const { darkMode } = useTheme();
  
  if (type === "chat") {
    return (
      <div className={`flex-1 p-4 space-y-6 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        <SkeletonChatMessage />
        <SkeletonChatMessage isUser />
        <SkeletonChatMessage />
      </div>
    );
  }
  
  if (type === "analytics") {
    return (
      <div className={`flex-1 p-6 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        <SkeletonAnalytics />
      </div>
    );
  }

  return (
    <div className={`flex-1 p-6 space-y-4 ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
};

// Inline loading indicator
export const LoadingDots = ({ className = "" }) => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
        />
      ))}
    </div>
  );
};

// Spinner component
export const Spinner = ({ size = "md", className = "" }) => {
  const { darkMode } = useTheme();
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };
  
  return (
    <motion.div
      className={`${sizes[size]} border-2 rounded-full ${
        darkMode ? 'border-gray-700 border-t-white' : 'border-gray-200 border-t-gray-900'
      } ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};

export default {
  Base: SkeletonBase,
  Text: SkeletonText,
  Avatar: SkeletonAvatar,
  Card: SkeletonCard,
  ChatMessage: SkeletonChatMessage,
  ListItem: SkeletonListItem,
  Flashcard: SkeletonFlashcard,
  QuizQuestion: SkeletonQuizQuestion,
  Stats: SkeletonStats,
  Analytics: SkeletonAnalytics,
  Page: SkeletonPage,
  LoadingDots,
  Spinner
};
