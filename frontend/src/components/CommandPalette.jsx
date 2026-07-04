import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  onToolOpen, 
  onNewChat, 
  onToggleTheme,
  onExport,
  onSearch 
}) {
  const { darkMode } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // All available commands
  const commands = [
    // Tools
    { id: "notes", category: "Tools", name: "Notes Highlighter", description: "Extract key points from notes", shortcut: "⌘N", icon: "edit", action: () => onToolOpen?.("notes") },
    { id: "summary", category: "Tools", name: "Text Summarizer", description: "Summarize long texts", shortcut: "⌘S", icon: "doc", action: () => onToolOpen?.("summary") },
    { id: "quiz", category: "Tools", name: "Quiz Generator", description: "Generate practice quizzes", shortcut: "⌘Q", icon: "question", action: () => onToolOpen?.("quiz") },
    { id: "flashcards", category: "Tools", name: "Flashcards", description: "Create study flashcards", shortcut: "⌘F", icon: "cards", action: () => onToolOpen?.("flashcards") },
    { id: "analytics", category: "Tools", name: "Study Analytics", description: "View your progress", shortcut: "⌘A", icon: "chart", action: () => onToolOpen?.("analytics") },
    // Actions
    { id: "newchat", category: "Actions", name: "New Conversation", description: "Start a fresh chat", shortcut: "⌘⇧N", icon: "plus", action: onNewChat },
    { id: "theme", category: "Actions", name: "Toggle Theme", description: "Switch dark/light mode", shortcut: "⌘D", icon: "theme", action: onToggleTheme },
    { id: "export-md", category: "Export", name: "Export as Markdown", description: "Download your content", icon: "download", action: () => onExport?.("markdown") },
    { id: "export-pdf", category: "Export", name: "Export as PDF", description: "Save as PDF document", icon: "download", action: () => onExport?.("pdf") },
    // Navigation
    { id: "search", category: "Search", name: "Search Everything", description: "Find notes, quizzes, cards", shortcut: "⌘/", icon: "search", action: onSearch },
  ];

  // Filter commands based on query
  const filteredCommands = query.trim()
    ? commands.filter(cmd => 
        cmd.name.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  // Flatten for index navigation
  const flatCommands = Object.values(groupedCommands).flat();

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && flatCommands.length > 0) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, flatCommands.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatCommands.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          flatCommands[selectedIndex].action?.();
          onClose();
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, flatCommands, selectedIndex, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const getIcon = (iconName) => {
    const icons = {
      edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />,
      doc: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      question: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      cards: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
      chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />,
      theme: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />,
      download: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />,
      search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
    };
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[iconName] || icons.doc}
      </svg>
    );
  };

  let currentIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Palette */}
          <motion.div
            className={`relative w-full max-w-xl mx-4 rounded-2xl shadow-2xl overflow-hidden ${
              darkMode 
                ? 'bg-[#1f1f1f]/95 border border-[#333] backdrop-blur-xl' 
                : 'bg-white/95 border border-gray-200 backdrop-blur-xl'
            }`}
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
          >
            {/* Search input */}
            <div className={`flex items-center gap-3 px-4 py-3 border-b ${darkMode ? 'border-[#333]' : 'border-gray-200'}`}>
              <svg className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands..."
                className={`flex-1 bg-transparent outline-none text-sm ${
                  darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                }`}
              />
              <kbd className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono ${
                darkMode ? 'bg-[#2a2a2a] text-gray-500' : 'bg-gray-100 text-gray-400'
              }`}>
                ESC
              </kbd>
            </div>

            {/* Command list */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
              {flatCommands.length === 0 ? (
                <div className={`px-4 py-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No commands found for "{query}"
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category}>
                    <div className={`px-4 py-2 text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {category}
                    </div>
                    {cmds.map((cmd) => {
                      const idx = currentIndex++;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={cmd.id}
                          data-index={idx}
                          onClick={() => {
                            cmd.action?.();
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isSelected
                              ? darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                              : ''
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            darkMode ? 'bg-[#333] text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {getIcon(cmd.icon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              {cmd.name}
                            </div>
                            <div className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {cmd.description}
                            </div>
                          </div>
                          {cmd.shortcut && (
                            <kbd className={`hidden sm:inline-flex px-2 py-1 rounded text-xs font-mono flex-shrink-0 ${
                              darkMode ? 'bg-[#333] text-gray-500' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className={`px-4 py-2 border-t text-xs flex items-center gap-4 ${
              darkMode ? 'border-[#333] text-gray-500' : 'border-gray-200 text-gray-400'
            }`}>
              <span className="flex items-center gap-1">
                <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>esc</kbd>
                close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
