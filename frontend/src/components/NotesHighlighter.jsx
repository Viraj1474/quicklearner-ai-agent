import React, { useState, useCallback, useMemo } from "react";
import * as ai from "./services/aiService";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

export default function NotesHighlighter({
  onNewSummary = () => {},
  onExpandChange = () => {},
  expanded = false,
}) {
  const { darkMode } = useTheme();
  const [notes, setNotes] = useState("");
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [viewMode, setViewMode] = useState("cards"); // cards, inline, list
  const [showStats, setShowStats] = useState(true);
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  const [copiedState, setCopiedState] = useState(null);

  const highlightTypes = [
    { id: "concepts", name: "Concepts", icon: "lightbulb", color: "#FF6B6B" },
    { id: "definitions", name: "Definitions", icon: "book", color: "#45B7D1" },
    { id: "examples", name: "Examples", icon: "puzzle", color: "#4ECDC4" },
    { id: "important", name: "Important", icon: "alert", color: "#E74C3C" },
    { id: "formulas", name: "Formulas", icon: "calculator", color: "#F7DC6F" },
    { id: "steps", name: "Steps", icon: "list", color: "#1ABC9C" },
    { id: "questions", name: "Questions", icon: "question", color: "#9B59B6" },
  ];

  const getIcon = (iconName) => {
    const icons = {
      lightbulb: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      book: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      puzzle: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
      alert: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      calculator: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      list: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      question: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    };
    return icons[iconName] || null;
  };

  const handleHighlight = async () => {
    if (!notes.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const categories = selectedCategories.length > 0 ? selectedCategories : undefined;
      const result = await ai.generateHighlightsAdvanced(notes, categories);
      setResults(result);
      onNewSummary(result.summary || "");
      onExpandChange(true);
    } catch (err) {
      console.error("Highlight error:", err);
      setResults({ error: "Failed to highlight notes — try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setResults(null);
    setNotes("");
    setSelectedCategories([]);
    onExpandChange(false);
  };

  const handleCopy = async (format = "text") => {
    if (!results?.highlights) return;
    
    let content = "";
    if (format === "markdown") {
      content = results.highlights.map(h => 
        `- **[${h.category.toUpperCase()}]** ${h.text} _(${Math.round(h.confidence * 100)}% confidence)_`
      ).join("\n");
    } else if (format === "json") {
      content = JSON.stringify(results.highlights, null, 2);
    } else {
      content = results.highlights.map(h => 
        `[${h.importance.toUpperCase()}] ${h.text}`
      ).join("\n\n");
    }
    
    await navigator.clipboard.writeText(content);
    setCopiedState(format);
    setTimeout(() => setCopiedState(null), 2000);
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredHighlights = useMemo(() => {
    if (!results?.highlights) return [];
    return results.highlights.filter(h => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(h.category)) {
        return false;
      }
      if (h.confidence < confidenceFilter) {
        return false;
      }
      return true;
    });
  }, [results, selectedCategories, confidenceFilter]);

  const ConfidenceBar = ({ confidence }) => (
    <div className="flex items-center gap-2">
      <div className={`h-1.5 w-16 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence * 100}%` }}
          className={`h-full rounded-full ${
            confidence >= 0.8 ? 'bg-green-500' : 
            confidence >= 0.6 ? 'bg-yellow-500' : 'bg-gray-400'
          }`}
        />
      </div>
      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {Math.round(confidence * 100)}%
      </span>
    </div>
  );

  const ImportanceTag = ({ importance }) => {
    const colors = {
      high: { bg: darkMode ? 'bg-red-500/20' : 'bg-red-100', text: 'text-red-500' },
      medium: { bg: darkMode ? 'bg-yellow-500/20' : 'bg-yellow-100', text: 'text-yellow-600' },
      low: { bg: darkMode ? 'bg-gray-500/20' : 'bg-gray-100', text: darkMode ? 'text-gray-400' : 'text-gray-500' }
    };
    const c = colors[importance] || colors.medium;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {importance}
      </span>
    );
  };

  const renderInlineHighlighted = useCallback(() => {
    if (!results?.highlights || !notes) return notes;
    
    // Sort highlights by position
    const sortedHighlights = [...results.highlights].sort((a, b) => a.start_pos - b.start_pos);
    
    let lastIndex = 0;
    const parts = [];
    
    sortedHighlights.forEach((highlight, idx) => {
      // Add text before this highlight
      if (highlight.start_pos > lastIndex) {
        parts.push(
          <span key={`text-${idx}`} className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
            {notes.slice(lastIndex, highlight.start_pos)}
          </span>
        );
      }
      
      // Add highlighted text
      const color = highlight.color || '#FF6B6B';
      parts.push(
        <motion.mark
          key={`highlight-${idx}`}
          initial={{ backgroundColor: 'transparent' }}
          animate={{ backgroundColor: `${color}30` }}
          className="px-1 rounded cursor-pointer transition-all hover:ring-2"
          style={{ 
            borderBottom: `2px solid ${color}`,
            '--tw-ring-color': color
          }}
          title={`${highlight.category} - ${Math.round(highlight.confidence * 100)}% confidence`}
        >
          {highlight.text}
        </motion.mark>
      );
      
      lastIndex = highlight.end_pos;
    });
    
    // Add remaining text
    if (lastIndex < notes.length) {
      parts.push(
        <span key="text-end" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
          {notes.slice(lastIndex)}
        </span>
      );
    }
    
    return parts;
  }, [results, notes, darkMode]);

  return (
    <motion.div
      className={`w-full h-full overflow-auto ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-blue-500 font-medium">AI-Powered Analysis</span>
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Smart Notes Highlighter
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Extract key concepts, definitions, and insights with AI-powered analysis
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            FILTER BY CATEGORY (optional)
          </div>
          <div className="flex flex-wrap gap-2">
            {highlightTypes.map((type) => {
              const isSelected = selectedCategories.includes(type.id);
              return (
                <motion.button
                  key={type.id}
                  onClick={() => toggleCategory(type.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm ${
                    isSelected
                      ? 'border-transparent text-white'
                      : `${darkMode ? 'border-[#2a2a2a] text-gray-400 hover:border-[#333]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`
                  }`}
                  style={isSelected ? { backgroundColor: type.color } : {}}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {getIcon(type.icon)}
                  <span className="font-medium">{type.name}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl border ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'} overflow-hidden`}
        >
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'} flex items-center justify-between`}>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Paste your notes
            </span>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {notes.length.toLocaleString()} characters
              </span>
              {notes.length > 0 && (
                <span className={`text-xs ${notes.length > 50000 ? 'text-red-500' : 'text-green-500'}`}>
                  {notes.length > 50000 ? 'Too long' : 'Ready'}
                </span>
              )}
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your notes, articles, lecture content, or any text you want to analyze for key insights..."
            className={`w-full min-h-[220px] p-4 resize-none focus:outline-none font-mono text-sm leading-relaxed ${
              darkMode ? 'bg-[#1f1f1f] text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
          <div className={`px-4 py-3 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  darkMode ? 'text-gray-400 hover:bg-[#2a2a2a]' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Clear
              </button>
              {selectedCategories.length > 0 && (
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Filtering: {selectedCategories.length} categories
                </span>
              )}
            </div>
            <motion.button
              onClick={handleHighlight}
              disabled={!notes.trim() || isLoading || notes.length > 50000}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-medium transition-all ${
                !notes.trim() || isLoading || notes.length > 50000
                  ? `${darkMode ? 'bg-[#2a2a2a] text-gray-500' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25'
              }`}
              whileHover={notes.trim() && !isLoading ? { scale: 1.02 } : {}}
              whileTap={notes.trim() && !isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Analyze & Highlight</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {results && !results.error && (
            <>
              {/* Statistics Panel */}
              {showStats && results.statistics && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`rounded-2xl border p-4 ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Analysis Overview
                    </h3>
                    <button
                      onClick={() => setShowStats(!showStats)}
                      className={`text-xs ${darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      Hide
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {results.total_highlights}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Highlights</div>
                    </div>
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {results.statistics?.coverage_percent || 0}%
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Coverage</div>
                    </div>
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}>
                      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {Math.round((results.statistics?.avg_confidence || 0) * 100)}%
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Avg Confidence</div>
                    </div>
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}>
                      <div className={`text-2xl font-bold capitalize ${
                        results.readability_level === 'easy' ? 'text-green-500' :
                        results.readability_level === 'medium' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {results.readability_level}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Readability</div>
                    </div>
                  </div>
                  
                  {/* Category Distribution */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(results.statistics?.category_distribution || {}).map(([cat, count]) => {
                      const catInfo = highlightTypes.find(t => t.id === cat);
                      return (
                        <div
                          key={cat}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                          style={{ backgroundColor: `${catInfo?.color}20`, color: catInfo?.color }}
                        >
                          {catInfo && getIcon(catInfo.icon)}
                          <span>{cat}: {count}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* View Mode Toggle & Filters */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex flex-wrap items-center justify-between gap-4 px-2`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>VIEW:</span>
                  {['cards', 'inline', 'list'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        viewMode === mode
                          ? `${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`
                          : `${darkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Min confidence:</span>
                    <input
                      type="range"
                      min="0"
                      max="0.9"
                      step="0.1"
                      value={confidenceFilter}
                      onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
                      className="w-20 h-1 rounded-lg appearance-none cursor-pointer bg-gray-300 dark:bg-gray-700"
                    />
                    <span className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {Math.round(confidenceFilter * 100)}%
                    </span>
                  </div>
                  
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Showing {filteredHighlights.length} of {results.total_highlights}
                  </span>
                </div>
              </motion.div>

              {/* Results Container */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
              >
                {/* Header */}
                <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Highlighted Results
                    </span>
                  </div>
                  
                  {/* Export Options */}
                  <div className="flex items-center gap-2">
                    {['text', 'markdown', 'json'].map((format) => (
                      <motion.button
                        key={format}
                        onClick={() => handleCopy(format)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          copiedState === format
                            ? 'bg-green-500/20 text-green-500'
                            : darkMode ? 'text-gray-400 hover:bg-[#2a2a2a]' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {copiedState === format ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                        {format.toUpperCase()}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Content based on view mode */}
                <div className={`p-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {viewMode === 'inline' ? (
                    <div className="leading-relaxed text-sm">
                      {renderInlineHighlighted()}
                    </div>
                  ) : viewMode === 'list' ? (
                    <div className="space-y-2">
                      {filteredHighlights.map((highlight, idx) => {
                        const catInfo = highlightTypes.find(t => t.id === highlight.category);
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className={`flex items-start gap-3 p-2 rounded-lg ${darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-50'}`}
                          >
                            <div
                              className="w-1 self-stretch rounded-full flex-shrink-0"
                              style={{ backgroundColor: catInfo?.color || '#888' }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm">{highlight.text}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs" style={{ color: catInfo?.color }}>
                                  {highlight.category}
                                </span>
                                <ConfidenceBar confidence={highlight.confidence} />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Cards View */
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredHighlights.map((highlight, idx) => {
                        const catInfo = highlightTypes.find(t => t.id === highlight.category);
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-4 rounded-xl border-l-4 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}
                            style={{ borderLeftColor: catInfo?.color || '#888' }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span style={{ color: catInfo?.color }}>
                                  {catInfo && getIcon(catInfo.icon)}
                                </span>
                                <span className="text-xs font-semibold uppercase" style={{ color: catInfo?.color }}>
                                  {highlight.category}
                                </span>
                              </div>
                              <ImportanceTag importance={highlight.importance} />
                            </div>
                            <p className={`text-sm leading-relaxed mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {highlight.text}
                            </p>
                            <ConfidenceBar confidence={highlight.confidence} />
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Key Concepts & Summary */}
                {(results.key_concepts?.length > 0 || results.summary) && (
                  <div className={`px-4 py-4 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                    {results.key_concepts?.length > 0 && (
                      <div className="mb-4">
                        <h4 className={`text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Key Concepts
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {results.key_concepts.map((concept, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                              }`}
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {results.summary && (
                      <div>
                        <h4 className={`text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Summary
                        </h4>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {results.summary}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}

          {/* Error State */}
          {results?.error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-6 text-center ${darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}
            >
              <svg className="w-12 h-12 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-500 font-medium">{results.error}</p>
              <button
                onClick={handleClear}
                className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips Section */}
        {!results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`rounded-2xl border p-6 ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
          >
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Tips for better results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: "document", text: "Include complete paragraphs for better context analysis" },
                { icon: "filter", text: "Filter categories to focus on specific content types" },
                { icon: "book", text: "Works best with educational content, articles, and lecture notes" },
                { icon: "lightning", text: "Longer texts (500+ words) provide more accurate insights" },
                { icon: "eye", text: "Use inline view to see highlights in context" },
                { icon: "download", text: "Export highlights in multiple formats for study materials" },
              ].map((tip, i) => (
                <div key={i} className={`flex items-center gap-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: darkMode ? '#2a2a2a' : '#f3f4f6' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {tip.icon === "document" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                      {tip.icon === "filter" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />}
                      {tip.icon === "book" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />}
                      {tip.icon === "lightning" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
                      {tip.icon === "eye" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}
                      {tip.icon === "eye" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
                      {tip.icon === "download" && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />}
                    </svg>
                  </span>
                  <span className="text-sm">{tip.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Keyboard Shortcuts Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`text-center text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}
        >
          Press <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>Ctrl</kbd> + <kbd className={`px-1.5 py-0.5 rounded ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>Enter</kbd> to analyze
        </motion.div>
      </div>
    </motion.div>
  );
}
