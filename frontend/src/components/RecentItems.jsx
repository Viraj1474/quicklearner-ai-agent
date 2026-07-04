/**
 * Recent Items Component
 * 
 * Displays recently accessed items for quick navigation
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme';
import { useRecentItems } from './hooks/useProductivity';

// Item type icons
const typeIcons = {
  quiz: '🎯',
  flashcard: '💡',
  summary: '📝',
  note: '✨',
  conversation: '💬',
  default: '📄',
};

// Time ago formatter
const formatTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const RecentItems = ({ onItemClick, maxItems = 5, showClear = true }) => {
  const { darkMode } = useTheme();
  const { recentItems, removeRecentItem, clearRecentItems } = useRecentItems();
  
  const displayItems = recentItems.slice(0, maxItems);

  if (displayItems.length === 0) {
    return null;
  }

  const colors = {
    bg: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    bgHover: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    border: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    text: darkMode ? '#fff' : '#1a1a2e',
    textMuted: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: colors.textMuted }}
        >
          Recent
        </h3>
        {showClear && (
          <button
            onClick={clearRecentItems}
            className="text-xs opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: colors.textMuted }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Items list */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {displayItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <button
                onClick={() => onItemClick?.(item)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left"
                style={{ 
                  background: colors.bg,
                  borderColor: colors.border,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.bgHover}
                onMouseLeave={(e) => e.currentTarget.style.background = colors.bg}
              >
                {/* Icon */}
                <span className="text-base flex-shrink-0">
                  {typeIcons[item.type] || typeIcons.default}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm font-medium truncate"
                    style={{ color: colors.text }}
                  >
                    {item.title || item.name || 'Untitled'}
                  </p>
                  <p 
                    className="text-xs truncate"
                    style={{ color: colors.textMuted }}
                  >
                    {item.description || formatTimeAgo(item.timestamp)}
                  </p>
                </div>

                {/* Time */}
                <span 
                  className="text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: colors.textMuted }}
                >
                  {formatTimeAgo(item.timestamp)}
                </span>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentItem(item.id);
                  }}
                  className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                  style={{ color: colors.textMuted }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View all link */}
      {recentItems.length > maxItems && (
        <button
          className="w-full text-center text-xs py-2 mt-2 opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: colors.textMuted }}
        >
          View all {recentItems.length} items
        </button>
      )}
    </motion.div>
  );
};

// Compact version for sidebar
export const RecentItemsCompact = ({ onItemClick, maxItems = 3 }) => {
  const { darkMode } = useTheme();
  const { recentItems } = useRecentItems();
  
  const displayItems = recentItems.slice(0, maxItems);

  if (displayItems.length === 0) return null;

  return (
    <div className="space-y-1">
      {displayItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors"
          style={{
            color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
          }}
        >
          <span className="text-sm">{typeIcons[item.type] || typeIcons.default}</span>
          <span className="truncate flex-1">{item.title || 'Untitled'}</span>
        </button>
      ))}
    </div>
  );
};

export default RecentItems;
