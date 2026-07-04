import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

// Search result categories
const SEARCH_CATEGORIES = {
  flashcards: {
    name: "Flashcards",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="14" rx="2"/>
        <path d="M7 8h10M7 12h6"/>
      </svg>
    ),
    color: "text-blue-400",
  },
  summaries: {
    name: "Summaries",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
    ),
    color: "text-emerald-400",
  },
  quizzes: {
    name: "Quizzes",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>
      </svg>
    ),
    color: "text-purple-400",
  },
  notes: {
    name: "Notes",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    color: "text-orange-400",
  },
  analytics: {
    name: "Analytics",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 20V10M12 20V4M6 20v-6"/>
      </svg>
    ),
    color: "text-cyan-400",
  },
};

const SearchEverything = forwardRef(({ 
  onResultSelect, 
  searchData = {},
  placeholder = "Search everything..."
}, ref) => {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  }));

  // Mock search function - integrate with your actual data
  const performSearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const allResults = [];

    // Search through provided data
    Object.entries(searchData).forEach(([category, items]) => {
      if (!Array.isArray(items)) return;
      
      items.forEach(item => {
        const searchableText = [
          item.title,
          item.content,
          item.question,
          item.answer,
          item.front,
          item.back,
        ].filter(Boolean).join(" ").toLowerCase();

        if (searchableText.includes(lowerQuery)) {
          allResults.push({
            id: item.id || Math.random(),
            category,
            title: item.title || item.question || item.front || "Untitled",
            preview: item.content?.slice(0, 100) || item.answer?.slice(0, 100) || item.back?.slice(0, 100) || "",
            data: item,
          });
        }
      });
    });

    // Filter by active category
    const filteredResults = activeCategory === "all" 
      ? allResults 
      : allResults.filter(r => r.category === activeCategory);

    setResults(filteredResults.slice(0, 20));
    setSelectedIndex(0);
  };

  useEffect(() => {
    performSearch(query);
  }, [query, activeCategory, searchData]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) {
        if ((e.ctrlKey || e.metaKey) && e.key === "f") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          setIsOpen(false);
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultSelect(results[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const selectedEl = listRef.current.children[selectedIndex];
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const handleResultSelect = (result) => {
    onResultSelect?.(result);
    setIsOpen(false);
    setQuery("");
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
  };

  const categories = ["all", ...Object.keys(SEARCH_CATEGORIES)];

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
            onClick={handleClose}
          />

          {/* Search Modal */}
          <motion.div
            className="fixed top-[15%] left-1/2 w-full max-w-2xl z-50"
            style={{ x: "-50%" }}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className={`
              mx-4 rounded-2xl border shadow-2xl overflow-hidden
              ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}
            `}>
              {/* Search Input */}
              <div className={`flex items-center gap-3 px-4 py-3 border-b ${
                darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'
              }`}>
                <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className={`flex-1 bg-transparent outline-none text-base ${
                    darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                  }`}
                />
                <div className={`px-2 py-1 rounded text-xs font-mono ${
                  darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  Esc
                </div>
              </div>

              {/* Category Tabs */}
              <div className={`flex gap-1 px-3 py-2 border-b ${
                darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'
              }`}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${activeCategory === cat
                        ? darkMode
                          ? 'bg-white text-black'
                          : 'bg-black text-white'
                        : darkMode
                          ? 'text-gray-400 hover:bg-[#2a2a2a]'
                          : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    {cat === "all" ? "All" : SEARCH_CATEGORIES[cat]?.name || cat}
                  </button>
                ))}
              </div>

              {/* Results */}
              <div 
                ref={listRef}
                className="max-h-[400px] overflow-y-auto py-2"
              >
                {query.trim() === "" ? (
                  <div className={`px-4 py-8 text-center ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <p className="text-sm">Type to search across all your content</p>
                    <p className="text-xs mt-1 opacity-75">Flashcards, summaries, quizzes, and more</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className={`px-4 py-8 text-center ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01"/>
                    </svg>
                    <p className="text-sm">No results found for "{query}"</p>
                    <p className="text-xs mt-1 opacity-75">Try different keywords</p>
                  </div>
                ) : (
                  results.map((result, index) => {
                    const categoryInfo = SEARCH_CATEGORIES[result.category];
                    return (
                      <motion.button
                        key={result.id}
                        onClick={() => handleResultSelect(result)}
                        className={`
                          w-full px-4 py-3 text-left transition-all
                          ${index === selectedIndex
                            ? darkMode
                              ? 'bg-[#2a2a2a]'
                              : 'bg-gray-100'
                            : ''
                          }
                          hover:${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}
                        `}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            darkMode ? 'bg-[#1f1f1f]' : 'bg-gray-100'
                          } ${categoryInfo?.color || 'text-gray-400'}`}>
                            {categoryInfo?.icon || (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium truncate ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {result.title}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                darkMode ? 'bg-[#1f1f1f] text-gray-400' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {categoryInfo?.name || result.category}
                              </span>
                            </div>
                            {result.preview && (
                              <p className={`text-xs truncate mt-1 ${
                                darkMode ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {result.preview}
                              </p>
                            )}
                          </div>
                          {index === selectedIndex && (
                            <span className={`text-xs ${
                              darkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              ↵
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className={`flex items-center justify-between px-4 py-2 border-t ${
                darkMode ? 'border-[#2a2a2a] text-gray-500' : 'border-gray-200 text-gray-400'
              }`}>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-current/10">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-current/10">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-current/10">Esc</kbd>
                    Close
                  </span>
                </div>
                <span className="text-xs">{results.length} results</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

SearchEverything.displayName = "SearchEverything";

// Hook for using search
export const useSearch = () => {
  const searchRef = useRef(null);

  return {
    searchRef,
    openSearch: () => searchRef.current?.open(),
    closeSearch: () => searchRef.current?.close(),
    toggleSearch: () => searchRef.current?.toggle(),
  };
};

export default SearchEverything;
