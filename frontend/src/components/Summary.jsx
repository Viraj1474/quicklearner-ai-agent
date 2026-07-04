import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";
import * as aiService from "./services/aiService";

export default function Summary({ summaries = [], onNewSummary = () => {} }) {
  const { darkMode } = useTheme();
  const [textToSummarize, setTextToSummarize] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summaryLength, setSummaryLength] = useState("medium");
  const [summaryStyle, setSummaryStyle] = useState("extractive");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedOptions, setAdvancedOptions] = useState({
    with_keywords: true,
    with_outline: false,
    with_takeaways: true,
    preserve_citations: false,
    target_audience: "general"
  });
  const [activeTab, setActiveTab] = useState("summary");
  const [copiedId, setCopiedId] = useState(null);

  // Style options with icons and descriptions
  const styleOptions = [
    { id: "extractive", name: "Extractive", desc: "Key sentences from text", icon: "extract", color: "blue" },
    { id: "abstractive", name: "Abstractive", desc: "AI-rewritten summary", icon: "ai", color: "purple" },
    { id: "bullet_points", name: "Bullet Points", desc: "Organized list format", icon: "list", color: "green" },
    { id: "outline", name: "Outline", desc: "Hierarchical structure", icon: "outline", color: "orange" },
    { id: "cornell", name: "Cornell Notes", desc: "Study-optimized format", icon: "notes", color: "red" },
    { id: "eli5", name: "ELI5", desc: "Simple explanation", icon: "child", color: "yellow" },
    { id: "academic", name: "Academic", desc: "Formal abstract style", icon: "academic", color: "indigo" },
    { id: "key_takeaways", name: "Key Takeaways", desc: "Main points numbered", icon: "key", color: "teal" }
  ];

  const lengthOptions = [
    { id: "brief", name: "Brief", desc: "~15% of original", icon: "bolt", percent: 15 },
    { id: "short", name: "Short", desc: "~25% of original", icon: "short", percent: 25 },
    { id: "medium", name: "Medium", desc: "~40% of original", icon: "doc", percent: 40 },
    { id: "long", name: "Long", desc: "~60% of original", icon: "long", percent: 60 },
    { id: "detailed", name: "Detailed", desc: "~75% of original", icon: "docs", percent: 75 }
  ];

  const audienceOptions = [
    { id: "general", name: "General" },
    { id: "academic", name: "Academic" },
    { id: "professional", name: "Professional" },
    { id: "beginner", name: "Beginner" },
    { id: "expert", name: "Expert" }
  ];

  const getStyleIcon = (iconName) => {
    const icons = {
      extract: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      ai: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      list: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      outline: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
      ),
      notes: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      child: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      academic: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 7l-6.5-3.5L4 18l8 4 8-4-1.5-.5L12 21z" />
        </svg>
      ),
      key: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      bolt: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      short: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10" />
        </svg>
      ),
      doc: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      long: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16" />
        </svg>
      ),
      docs: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      )
    };
    return icons[iconName] || null;
  };

  const getColorClasses = (color, isActive) => {
    const colors = {
      blue: isActive ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : '',
      purple: isActive ? 'bg-purple-500/10 border-purple-500/30 text-purple-500' : '',
      green: isActive ? 'bg-green-500/10 border-green-500/30 text-green-500' : '',
      orange: isActive ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : '',
      red: isActive ? 'bg-red-500/10 border-red-500/30 text-red-500' : '',
      yellow: isActive ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600' : '',
      indigo: isActive ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' : '',
      teal: isActive ? 'bg-teal-500/10 border-teal-500/30 text-teal-500' : ''
    };
    return colors[color] || '';
  };

  const handleGenerateSummary = async () => {
    if (!textToSummarize.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await aiService.generateSummaryAdvanced(textToSummarize, {
        style: summaryStyle,
        length: summaryLength,
        ...advancedOptions
      });
      onNewSummary(result);
      setTextToSummarize("");
      setExpandedIndex(0);
    } catch (error) {
      console.error("Error generating summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = useCallback((text, id = null) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const formatSummaryForCopy = (result, format = 'plain') => {
    if (typeof result === 'string') return result;
    
    const { summary, keywords, takeaways, topics } = result;
    
    switch (format) {
      case 'markdown':
        let md = `# Summary\n\n${summary}\n\n`;
        if (keywords?.length) {
          md += `## Keywords\n${keywords.map(k => `- **${k.word}** (${(k.score * 100).toFixed(0)}%)`).join('\n')}\n\n`;
        }
        if (takeaways?.length) {
          md += `## Key Takeaways\n${takeaways.map((t, i) => `${i + 1}. ${t.text}`).join('\n')}\n\n`;
        }
        if (topics?.length) {
          md += `## Topics\n${topics.join(', ')}\n`;
        }
        return md;
      case 'json':
        return JSON.stringify(result, null, 2);
      default:
        return summary;
    }
  };

  const getReadabilityColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getQualityColor = (score) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    if (score >= 0.4) return 'text-orange-500';
    return 'text-red-500';
  };

  const renderResultCard = (result, index) => {
    const isExpanded = expandedIndex === index;
    const isObject = typeof result === 'object' && result !== null;
    const summary = isObject ? result.summary : result;
    const keywords = isObject ? result.keywords : [];
    const takeaways = isObject ? result.takeaways : [];
    const readability = isObject ? result.readability : null;
    const topics = isObject ? result.topics : [];
    const qualityScore = isObject ? result.quality_score : null;
    const reductionPercent = isObject ? result.reduction_percent : null;
    const sentenceCount = isObject ? result.sentence_count : null;
    const style = isObject ? result.style : 'extractive';

    const styleInfo = styleOptions.find(s => s.id === style) || styleOptions[0];

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * 0.05 }}
        className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
      >
        {/* Header */}
        <div
          className={`px-4 py-3 flex items-center justify-between cursor-pointer ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50'}`}
          onClick={() => setExpandedIndex(isExpanded ? null : index)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorClasses(styleInfo.color, true)}`}>
              {getStyleIcon(styleInfo.icon)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {styleInfo.name} Summary
                </span>
                {reductionPercent && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                    -{reductionPercent}%
                  </span>
                )}
              </div>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {summary.split(/\s+/).filter(Boolean).length} words
                {sentenceCount && ` • ${sentenceCount.summary} sentences`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={(e) => { e.stopPropagation(); handleCopy(summary, `copy-${index}`); }}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-[#2a2a2a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {copiedId === `copy-${index}` ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </motion.button>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'}`}
            >
              {/* Tabs for different views */}
              {isObject && (
                <div className={`flex gap-1 p-2 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                  {['summary', 'keywords', 'takeaways', 'metrics'].map(tab => (
                    <button
                      key={tab}
                      onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                        activeTab === tab
                          ? `${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`
                          : `${darkMode ? 'text-gray-400 hover:bg-[#2a2a2a]' : 'text-gray-500 hover:bg-gray-100'}`
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-4">
                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {summary}
                    </p>
                    
                    {/* Topics */}
                    {topics?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {topics.map((topic, i) => (
                          <span
                            key={i}
                            className={`px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Keywords Tab */}
                {activeTab === 'keywords' && keywords?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Extracted Keywords
                    </h4>
                    <div className="grid gap-2">
                      {keywords.map((kw, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}
                        >
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {kw.word}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className={`w-20 h-2 rounded-full overflow-hidden ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-200'}`}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${kw.score * 100}%` }}
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                              />
                            </div>
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {(kw.score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Takeaways Tab */}
                {activeTab === 'takeaways' && takeaways?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Key Takeaways
                    </h4>
                    <div className="space-y-2">
                      {takeaways.map((tw, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 p-3 rounded-lg ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}
                        >
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            tw.importance === 'critical'
                              ? 'bg-red-500/20 text-red-500'
                              : tw.importance === 'important'
                              ? 'bg-yellow-500/20 text-yellow-500'
                              : 'bg-blue-500/20 text-blue-500'
                          }`}>
                            {i + 1}
                          </span>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {tw.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metrics Tab */}
                {activeTab === 'metrics' && readability && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Readability Score */}
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                        <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Readability</p>
                        <p className={`text-2xl font-bold ${getReadabilityColor(readability.flesch_score)}`}>
                          {readability.flesch_score}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {readability.reading_ease}
                        </p>
                      </div>

                      {/* Grade Level */}
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                        <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Grade Level</p>
                        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {readability.grade_level}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Flesch-Kincaid
                        </p>
                      </div>

                      {/* Quality Score */}
                      {qualityScore && (
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                          <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Quality Score</p>
                          <p className={`text-2xl font-bold ${getQualityColor(qualityScore)}`}>
                            {(qualityScore * 100).toFixed(0)}%
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Summary quality
                          </p>
                        </div>
                      )}

                      {/* Compression */}
                      {reductionPercent && (
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                          <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Compression</p>
                          <p className={`text-2xl font-bold text-green-500`}>
                            {reductionPercent}%
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Text reduced
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Additional stats */}
                    <div className={`p-3 rounded-xl ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Avg. sentence: </span>
                          <span className={darkMode ? 'text-white' : 'text-gray-900'}>{readability.avg_sentence_length} words</span>
                        </div>
                        <div>
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Avg. word: </span>
                          <span className={darkMode ? 'text-white' : 'text-gray-900'}>{readability.avg_word_length} chars</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Options */}
                {isObject && (
                  <div className={`mt-4 pt-4 border-t flex gap-2 ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(formatSummaryForCopy(result, 'plain'), `plain-${index}`); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        copiedId === `plain-${index}`
                          ? 'bg-green-500/20 text-green-500'
                          : `${darkMode ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                      }`}
                    >
                      {copiedId === `plain-${index}` ? '✓ Copied' : 'Copy Text'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(formatSummaryForCopy(result, 'markdown'), `md-${index}`); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        copiedId === `md-${index}`
                          ? 'bg-green-500/20 text-green-500'
                          : `${darkMode ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                      }`}
                    >
                      {copiedId === `md-${index}` ? '✓ Copied' : 'Copy Markdown'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(formatSummaryForCopy(result, 'json'), `json-${index}`); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        copiedId === `json-${index}`
                          ? 'bg-green-500/20 text-green-500'
                          : `${darkMode ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                      }`}
                    >
                      {copiedId === `json-${index}` ? '✓ Copied' : 'Copy JSON'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div
      className={`w-full h-full overflow-auto ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${darkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-green-500 font-medium">Advanced Summarization</span>
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            AI Text Summarizer
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Multiple styles, keyword extraction, readability analysis & more
          </p>
        </motion.div>

        {/* Style Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
        >
          <label className={`text-sm font-medium mb-3 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Summary Style
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {styleOptions.map((option) => (
              <motion.button
                key={option.id}
                onClick={() => setSummaryStyle(option.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  summaryStyle === option.id
                    ? getColorClasses(option.color, true)
                    : `${darkMode ? 'border-[#2a2a2a] hover:border-[#333]' : 'border-gray-200 hover:border-gray-300'}`
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={summaryStyle === option.id ? '' : darkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {getStyleIcon(option.icon)}
                  </span>
                  <span className={`font-medium text-sm ${
                    summaryStyle === option.id 
                      ? '' 
                      : darkMode ? 'text-white' : 'text-gray-900'
                  }`}>{option.name}</span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{option.desc}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Length Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`p-4 rounded-2xl border ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
        >
          <label className={`text-sm font-medium mb-3 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Summary Length
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {lengthOptions.map((option) => (
              <motion.button
                key={option.id}
                onClick={() => setSummaryLength(option.id)}
                className={`p-2 rounded-xl border text-center transition-all ${
                  summaryLength === option.id
                    ? `${darkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'}`
                    : `${darkMode ? 'border-[#2a2a2a] hover:border-[#333]' : 'border-gray-200 hover:border-gray-300'}`
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className={`font-medium text-sm block ${
                  summaryLength === option.id 
                    ? 'text-green-500' 
                    : darkMode ? 'text-white' : 'text-gray-900'
                }`}>{option.name}</span>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>~{option.percent}%</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Advanced Options Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
              darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a] hover:border-[#333]' : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Advanced Options
            </span>
            <motion.div animate={{ rotate: showAdvanced ? 180 : 0 }}>
              <svg className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`mt-2 rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
              >
                <div className="p-4 space-y-4">
                  {/* Checkboxes */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'with_keywords', label: 'Extract Keywords', desc: 'TF-IDF keyword scoring' },
                      { key: 'with_takeaways', label: 'Key Takeaways', desc: 'Numbered takeaways' },
                      { key: 'with_outline', label: 'Generate Outline', desc: 'Hierarchical structure' },
                      { key: 'preserve_citations', label: 'Preserve Citations', desc: 'Keep references' }
                    ].map(opt => (
                      <label
                        key={opt.key}
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                          advancedOptions[opt.key]
                            ? `${darkMode ? 'bg-green-500/10' : 'bg-green-50'}`
                            : `${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={advancedOptions[opt.key]}
                          onChange={(e) => setAdvancedOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                          className="mt-1 rounded border-gray-300 text-green-500 focus:ring-green-500"
                        />
                        <div>
                          <span className={`text-sm font-medium block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {opt.label}
                          </span>
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {opt.desc}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className={`text-sm font-medium mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Target Audience
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {audienceOptions.map(aud => (
                        <button
                          key={aud.id}
                          onClick={() => setAdvancedOptions(prev => ({ ...prev, target_audience: aud.id }))}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            advancedOptions.target_audience === aud.id
                              ? `${darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`
                              : `${darkMode ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 text-gray-600'}`
                          }`}
                        >
                          {aud.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`rounded-2xl border ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'} overflow-hidden`}
        >
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'} flex items-center justify-between`}>
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Original Text
            </span>
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {textToSummarize.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <textarea
            value={textToSummarize}
            onChange={(e) => setTextToSummarize(e.target.value)}
            placeholder="Paste the text you want to summarize here..."
            className={`w-full min-h-[180px] p-4 resize-none focus:outline-none ${
              darkMode ? 'bg-[#1f1f1f] text-white placeholder-gray-500' : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
          />
          <div className={`px-4 py-3 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Style: <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{styleOptions.find(s => s.id === summaryStyle)?.name}</span>
              </span>
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Length: <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{lengthOptions.find(l => l.id === summaryLength)?.name}</span>
              </span>
            </div>
            <motion.button
              onClick={handleGenerateSummary}
              disabled={!textToSummarize.trim() || isLoading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                !textToSummarize.trim() || isLoading
                  ? `${darkMode ? 'bg-[#2a2a2a] text-gray-500' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
              }`}
              whileHover={textToSummarize.trim() && !isLoading ? { scale: 1.02 } : {}}
              whileTap={textToSummarize.trim() && !isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  <span>Generate Summary</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Summaries List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Your Summaries
            </h2>
            {summaries.length > 0 && (
              <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {summaries.length} {summaries.length === 1 ? 'summary' : 'summaries'}
              </span>
            )}
          </div>

          <AnimatePresence>
            {summaries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-2xl border p-8 text-center ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                  <svg className={`w-8 h-8 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className={`font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  No summaries yet
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Paste some text above to generate your first summary
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {summaries.map((result, index) => renderResultCard(result, index))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
