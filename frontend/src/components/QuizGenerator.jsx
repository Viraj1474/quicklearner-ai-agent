import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";
import * as aiService from "./services/aiService";

// Question type icons and colors
const QUESTION_TYPE_CONFIG = {
  multiple_choice: { icon: '🔘', label: 'Multiple Choice', color: 'purple' },
  true_false: { icon: '✓✗', label: 'True/False', color: 'blue' },
  short_answer: { icon: '✍️', label: 'Short Answer', color: 'green' },
  fill_in_blank: { icon: '___', label: 'Fill in Blank', color: 'orange' },
  matching: { icon: '🔗', label: 'Matching', color: 'pink' },
  ordering: { icon: '📋', label: 'Ordering', color: 'cyan' },
  code_completion: { icon: '💻', label: 'Code', color: 'indigo' }
};

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Beginner', color: 'emerald', value: 1 },
  easy: { label: 'Easy', color: 'green', value: 2 },
  medium: { label: 'Medium', color: 'yellow', value: 3 },
  hard: { label: 'Hard', color: 'orange', value: 4 },
  expert: { label: 'Expert', color: 'red', value: 5 }
};

const BLOOM_LEVELS = [
  { id: 'remember', label: 'Remember', description: 'Recall facts' },
  { id: 'understand', label: 'Understand', description: 'Explain concepts' },
  { id: 'apply', label: 'Apply', description: 'Use in new situations' },
  { id: 'analyze', label: 'Analyze', description: 'Break down ideas' },
  { id: 'evaluate', label: 'Evaluate', description: 'Make judgments' },
  { id: 'create', label: 'Create', description: 'Produce new work' }
];

export default function QuizGenerator({ onQuizGenerated = () => {} }) {
  const { darkMode } = useTheme();
  
  // Form state
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [bloomLevel, setBloomLevel] = useState(null);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(true);
  const [withHints, setWithHints] = useState(true);
  const [withExplanations, setWithExplanations] = useState(true);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Quiz state
  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [hintsUsed, setHintsUsed] = useState({});
  const [revealedHints, setRevealedHints] = useState({});
  const [showExplanation, setShowExplanation] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizSummary, setQuizSummary] = useState(null);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [questionTimes, setQuestionTimes] = useState({});
  
  // Matching state
  const [matchingSelections, setMatchingSelections] = useState({});
  
  // Ordering state (drag state)
  const [orderingItems, setOrderingItems] = useState({});

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || showResults) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, showResults]);

  // Start question timer when changing questions
  useEffect(() => {
    if (quizData && !showResults) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, quizData, showResults]);

  const currentQuestion = useMemo(() => {
    return quizData?.questions?.[currentQuestionIndex] || null;
  }, [quizData, currentQuestionIndex]);

  const generate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setAnswers({});
    setHintsUsed({});
    setRevealedHints({});
    setShowExplanation({});
    setShowResults(false);
    setQuizSummary(null);
    setCurrentQuestionIndex(0);
    setMatchingSelections({});
    setOrderingItems({});
    setQuestionTimes({});
    
    try {
      const data = await aiService.generateQuizAdvanced({
        topic,
        numQuestions: questionCount,
        difficulty,
        questionTypes: selectedTypes.length > 0 ? selectedTypes : null,
        withHints,
        withExplanations,
        adaptiveDifficulty,
        bloomLevel,
        timeLimitMinutes,
        shuffleQuestions: true,
        shuffleOptions: true
      });
      
      setQuizData(data);
      onQuizGenerated(data);
      
      // Initialize ordering items
      const initialOrdering = {};
      data.questions?.forEach((q, i) => {
        if (q.type === 'ordering' && q.items) {
          initialOrdering[i] = [...q.items];
        }
      });
      setOrderingItems(initialOrdering);
      
      // Set timer
      if (data.time_limit_minutes) {
        setTimeRemaining(data.time_limit_minutes * 60);
      } else {
        setTimeRemaining(null);
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = useCallback((questionIndex, answer) => {
    if (showResults) return;
    
    // Record time spent on question
    if (questionStartTime) {
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
      setQuestionTimes(prev => ({ ...prev, [questionIndex]: timeSpent }));
    }
    
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  }, [showResults, questionStartTime]);

  const handleMatchingSelect = (questionIndex, itemA, itemB) => {
    if (showResults) return;
    setMatchingSelections(prev => {
      const current = prev[questionIndex] || {};
      return {
        ...prev,
        [questionIndex]: { ...current, [itemA]: itemB }
      };
    });
    
    // Check if all matched
    const question = quizData.questions[questionIndex];
    const newMatches = { ...(matchingSelections[questionIndex] || {}), [itemA]: itemB };
    if (Object.keys(newMatches).length === question.column_a?.length) {
      handleAnswer(questionIndex, JSON.stringify(newMatches));
    }
  };

  const handleOrderingMove = (questionIndex, fromIdx, toIdx) => {
    if (showResults) return;
    setOrderingItems(prev => {
      const items = [...(prev[questionIndex] || [])];
      const [moved] = items.splice(fromIdx, 1);
      items.splice(toIdx, 0, moved);
      handleAnswer(questionIndex, JSON.stringify(items.map((_, i) => i)));
      return { ...prev, [questionIndex]: items };
    });
  };

  const revealHint = (questionIndex) => {
    const currentHints = revealedHints[questionIndex] || 0;
    const question = currentQuestion;
    
    if (question?.hints && currentHints < question.hints.length) {
      setRevealedHints(prev => ({ ...prev, [questionIndex]: currentHints + 1 }));
      setHintsUsed(prev => ({ ...prev, [questionIndex]: (prev[questionIndex] || 0) + 1 }));
    }
  };

  const handleSubmit = async () => {
    setShowResults(true);
    
    // Calculate summary locally
    let correct = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const performanceByType = {};
    
    quizData.questions.forEach((q, i) => {
      const userAnswer = answers[i];
      const isCorrect = checkAnswer(q, userAnswer);
      const points = q.points || 10;
      totalPoints += points;
      
      if (!performanceByType[q.type]) {
        performanceByType[q.type] = { correct: 0, total: 0 };
      }
      performanceByType[q.type].total++;
      
      if (isCorrect) {
        correct++;
        earnedPoints += points;
        performanceByType[q.type].correct++;
      }
    });
    
    const summary = {
      total_questions: quizData.questions.length,
      correct_answers: correct,
      accuracy_percentage: Math.round((correct / quizData.questions.length) * 100),
      total_points: earnedPoints,
      max_points: totalPoints,
      score_percentage: Math.round((earnedPoints / totalPoints) * 100),
      performance_by_type: performanceByType,
      grade: getGrade(earnedPoints / totalPoints * 100),
      passed: (earnedPoints / totalPoints) >= 0.7
    };
    
    setQuizSummary(summary);
  };

  const checkAnswer = (question, userAnswer) => {
    if (!userAnswer) return false;
    
    switch (question.type) {
      case 'multiple_choice':
      case 'true_false':
      case 'fill_in_blank':
        return userAnswer === question.correct_answer;
      case 'short_answer':
        // Simple check - real evaluation would be more sophisticated
        const keywords = question.key_points || [];
        const answerLower = userAnswer.toLowerCase();
        return keywords.some(kw => answerLower.includes(kw.toLowerCase()));
      case 'matching':
        try {
          const matches = JSON.parse(userAnswer);
          return JSON.stringify(matches) === JSON.stringify(question.correct_matches);
        } catch {
          return false;
        }
      case 'ordering':
        try {
          const order = JSON.parse(userAnswer);
          return JSON.stringify(order) === JSON.stringify(question.correct_order);
        } catch {
          return false;
        }
      default:
        return userAnswer === question.correct_answer;
    }
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const handleReset = () => {
    setQuizData(null);
    setAnswers({});
    setHintsUsed({});
    setRevealedHints({});
    setShowExplanation({});
    setShowResults(false);
    setQuizSummary(null);
    setTopic("");
    setCurrentQuestionIndex(0);
    setTimeRemaining(null);
    setMatchingSelections({});
    setOrderingItems({});
  };

  const toggleQuestionType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render different question types
  const renderQuestion = (question, index) => {
    const answered = answers[index] !== undefined;
    const isCorrect = showResults && checkAnswer(question, answers[index]);
    const questionHints = revealedHints[index] || 0;
    
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
      >
        {/* Question Header */}
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-sm ${
                showResults
                  ? isCorrect
                    ? 'bg-green-500/20 text-green-500'
                    : answered
                    ? 'bg-red-500/20 text-red-500'
                    : darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-600'
                  : darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    {QUESTION_TYPE_CONFIG[question.type]?.icon} {QUESTION_TYPE_CONFIG[question.type]?.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    DIFFICULTY_CONFIG[question.difficulty]?.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-500' :
                    DIFFICULTY_CONFIG[question.difficulty]?.color === 'green' ? 'bg-green-500/20 text-green-500' :
                    DIFFICULTY_CONFIG[question.difficulty]?.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-500' :
                    DIFFICULTY_CONFIG[question.difficulty]?.color === 'orange' ? 'bg-orange-500/20 text-orange-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {DIFFICULTY_CONFIG[question.difficulty]?.label}
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {question.points} pts
                  </span>
                </div>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {question.question}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-4 space-y-3">
          {renderQuestionContent(question, index)}
        </div>

        {/* Hints Section */}
        {withHints && question.hints && question.hints.length > 0 && !showResults && (
          <div className={`px-4 pb-4 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'} pt-3`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Hints ({questionHints}/{question.hints.length})
              </span>
              {questionHints < question.hints.length && (
                <motion.button
                  onClick={() => revealHint(index)}
                  className={`text-sm px-3 py-1 rounded-lg ${darkMode ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  💡 Reveal Hint
                </motion.button>
              )}
            </div>
            {questionHints > 0 && (
              <div className="space-y-2">
                {question.hints.slice(0, questionHints).map((hint, hi) => (
                  <div key={hi} className={`text-sm p-2 rounded-lg ${darkMode ? 'bg-yellow-500/10 text-yellow-300' : 'bg-yellow-50 text-yellow-700'}`}>
                    💡 {hint}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Explanation (after submit) */}
        {showResults && withExplanations && question.explanation && (
          <div className={`px-4 pb-4 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'} pt-3`}>
            <div className={`text-sm p-3 rounded-lg ${darkMode ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
              <strong>Explanation:</strong> {question.explanation}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderQuestionContent = (question, index) => {
    switch (question.type) {
      case 'multiple_choice':
      case 'fill_in_blank':
        return renderMCQ(question, index);
      case 'true_false':
        return renderTrueFalse(question, index);
      case 'short_answer':
        return renderShortAnswer(question, index);
      case 'matching':
        return renderMatching(question, index);
      case 'ordering':
        return renderOrdering(question, index);
      case 'code_completion':
        return renderCodeCompletion(question, index);
      default:
        return renderMCQ(question, index);
    }
  };

  const renderMCQ = (question, index) => {
    const options = question.options || {};
    
    return (
      <div className="space-y-2">
        {Object.entries(options).map(([key, value]) => {
          const isSelected = answers[index] === key;
          const isCorrect = question.correct_answer === key;
          const showCorrect = showResults && isCorrect;
          const showWrong = showResults && isSelected && !isCorrect;
          
          return (
            <motion.button
              key={key}
              onClick={() => handleAnswer(index, key)}
              disabled={showResults}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                showCorrect
                  ? 'bg-green-500/10 border-green-500/30'
                  : showWrong
                  ? 'bg-red-500/10 border-red-500/30'
                  : isSelected
                  ? darkMode ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'
                  : darkMode ? 'border-[#2a2a2a] hover:border-[#333]' : 'border-gray-200 hover:border-gray-300'
              }`}
              whileHover={!showResults ? { scale: 1.01 } : {}}
              whileTap={!showResults ? { scale: 0.99 } : {}}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-medium text-xs ${
                showCorrect
                  ? 'border-green-500 bg-green-500 text-white'
                  : showWrong
                  ? 'border-red-500 bg-red-500 text-white'
                  : isSelected
                  ? 'border-purple-500 bg-purple-500 text-white'
                  : darkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
              }`}>
                {key}
              </div>
              <span className={`${
                showCorrect ? 'text-green-500 font-medium' : showWrong ? 'text-red-500' : darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {value}
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  };

  const renderTrueFalse = (question, index) => {
    return renderMCQ({ ...question, options: { A: 'True', B: 'False' } }, index);
  };

  const renderShortAnswer = (question, index) => {
    const isCorrect = showResults && checkAnswer(question, answers[index]);
    
    return (
      <div className="space-y-3">
        <textarea
          value={answers[index] || ''}
          onChange={(e) => handleAnswer(index, e.target.value)}
          disabled={showResults}
          placeholder="Type your answer here..."
          rows={4}
          className={`w-full p-3 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
            showResults
              ? isCorrect
                ? 'border-green-500/30 bg-green-500/10'
                : 'border-red-500/30 bg-red-500/10'
              : darkMode
              ? 'bg-[#2a2a2a] border-[#333] text-white placeholder-gray-500'
              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
          }`}
        />
        {showResults && question.model_answer && (
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}>
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Model Answer:</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{question.model_answer}</p>
          </div>
        )}
      </div>
    );
  };

  const renderMatching = (question, index) => {
    const selections = matchingSelections[index] || {};
    const columnA = question.column_a || [];
    const columnB = question.column_b || [];
    
    return (
      <div className="space-y-4">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Match items from column A to column B
        </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Column A</p>
            {columnA.map((item, i) => (
              <div key={i} className={`p-3 rounded-lg ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}>
                <span className={`font-medium mr-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{i + 1}.</span>
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{item}</span>
                {selections[i] !== undefined && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                    → {String.fromCharCode(65 + selections[i])}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Column B</p>
            {columnB.map((item, i) => {
              const isMatched = Object.values(selections).includes(i);
              return (
                <motion.button
                  key={i}
                  onClick={() => {
                    const unmatchedA = columnA.findIndex((_, idx) => selections[idx] === undefined);
                    if (unmatchedA !== -1 && !showResults) {
                      handleMatchingSelect(index, unmatchedA, i);
                    }
                  }}
                  disabled={showResults || isMatched}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    isMatched
                      ? darkMode ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'
                      : darkMode ? 'bg-[#2a2a2a] hover:bg-[#333]' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  whileHover={!showResults && !isMatched ? { scale: 1.02 } : {}}
                >
                  <span className={`font-medium mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{String.fromCharCode(65 + i)}.</span>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{item}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
        {showResults && (
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Correct Matches:</p>
            <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {columnA.map((item, i) => `${i + 1} → ${String.fromCharCode(65 + (question.correct_matches?.[i] || 0))}`).join(', ')}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderOrdering = (question, index) => {
    const items = orderingItems[index] || question.items || [];
    
    return (
      <div className="space-y-3">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Drag items to arrange in the correct order ({question.order_type || 'sequence'})
        </p>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {!showResults && i > 0 && (
                <motion.button
                  onClick={() => handleOrderingMove(index, i, i - 1)}
                  className={`p-1 rounded ${darkMode ? 'hover:bg-[#333]' : 'hover:bg-gray-100'}`}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </motion.button>
              )}
              {!showResults && i < items.length - 1 && (
                <motion.button
                  onClick={() => handleOrderingMove(index, i, i + 1)}
                  className={`p-1 rounded ${darkMode ? 'hover:bg-[#333]' : 'hover:bg-gray-100'}`}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>
              )}
              <div className={`flex-1 p-3 rounded-lg flex items-center gap-3 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${darkMode ? 'bg-[#333] text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                  {i + 1}
                </span>
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{item}</span>
              </div>
            </div>
          ))}
        </div>
        {showResults && question.correct_order && (
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Correct Order:</p>
            <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {question.correct_order.map((idx, i) => `${i + 1}. ${question.original_items?.[idx] || question.items?.[idx]}`).join(' → ')}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderCodeCompletion = (question, index) => {
    const isCorrect = showResults && checkAnswer(question, answers[index]);
    
    return (
      <div className="space-y-3">
        {question.code_before && (
          <pre className={`p-3 rounded-lg overflow-x-auto text-sm font-mono ${darkMode ? 'bg-[#0d1117] text-gray-300' : 'bg-gray-900 text-gray-100'}`}>
            {question.code_before}
          </pre>
        )}
        <div className="relative">
          <input
            type="text"
            value={answers[index] || ''}
            onChange={(e) => handleAnswer(index, e.target.value)}
            disabled={showResults}
            placeholder={question.blank_description || "Enter the missing code..."}
            className={`w-full p-3 rounded-lg font-mono border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
              showResults
                ? isCorrect
                  ? 'border-green-500/30 bg-green-500/10'
                  : 'border-red-500/30 bg-red-500/10'
                : darkMode
                ? 'bg-[#0d1117] border-[#333] text-green-400 placeholder-gray-500'
                : 'bg-gray-900 border-gray-700 text-green-400 placeholder-gray-500'
            }`}
          />
          {question.language && (
            <span className="absolute right-2 top-2 text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
              {question.language}
            </span>
          )}
        </div>
        {question.code_after && (
          <pre className={`p-3 rounded-lg overflow-x-auto text-sm font-mono ${darkMode ? 'bg-[#0d1117] text-gray-300' : 'bg-gray-900 text-gray-100'}`}>
            {question.code_after}
          </pre>
        )}
        {showResults && (
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
            <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>Correct Answer:</p>
            <code className={`text-sm font-mono ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{question.correct_answer}</code>
          </div>
        )}
      </div>
    );
  };

  // Render results summary
  const renderSummary = () => {
    if (!quizSummary) return null;
    
    const gradeColors = {
      'A': 'text-green-500',
      'B': 'text-blue-500',
      'C': 'text-yellow-500',
      'D': 'text-orange-500',
      'F': 'text-red-500'
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl border p-6 mb-6 ${
          quizSummary.passed
            ? darkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
            : darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold mb-2 ${gradeColors[quizSummary.grade] || 'text-gray-500'}`}>
            {quizSummary.grade}
          </div>
          <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {quizSummary.score_percentage}%
          </div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            {quizSummary.correct_answers} of {quizSummary.total_questions} correct • {quizSummary.total_points}/{quizSummary.max_points} points
          </p>
        </div>
        
        {/* Performance by type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {Object.entries(quizSummary.performance_by_type).map(([type, data]) => (
            <div key={type} className={`p-3 rounded-lg ${darkMode ? 'bg-[#1f1f1f]' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span>{QUESTION_TYPE_CONFIG[type]?.icon}</span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {QUESTION_TYPE_CONFIG[type]?.label}
                </span>
              </div>
              <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {data.correct}/{data.total}
              </div>
            </div>
          ))}
        </div>
        
        {/* Key takeaways */}
        {quizData?.key_takeaways && quizData.key_takeaways.length > 0 && (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#1f1f1f]' : 'bg-white'}`}>
            <h4 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Key Takeaways</h4>
            <ul className="space-y-1">
              {quizData.key_takeaways.map((takeaway, i) => (
                <li key={i} className={`text-sm flex items-start gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className="text-purple-500">•</span>
                  {takeaway.concept}
                </li>
              ))}
            </ul>
          </div>
        )}
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
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${darkMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-purple-500 font-medium">Advanced Quiz Generator</span>
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Test Your Knowledge
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Generate AI-powered quizzes with multiple question types
          </p>
        </motion.div>

        {/* Timer */}
        {timeRemaining !== null && !showResults && quizData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`fixed top-4 right-4 px-4 py-2 rounded-full font-mono font-bold ${
              timeRemaining < 60
                ? 'bg-red-500 text-white animate-pulse'
                : timeRemaining < 300
                ? darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                : darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
            }`}
          >
            ⏱️ {formatTime(timeRemaining)}
          </motion.div>
        )}

        {/* Quiz Generator Form */}
        {!quizData && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl border p-6 ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
          >
            {/* Topic Input */}
            <div className="mb-6">
              <label className={`text-sm font-medium mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                What topic do you want to be quizzed on?
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., World History, Python Programming, Biology..."
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                  darkMode 
                    ? 'bg-[#2a2a2a] border-[#333] text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                onKeyDown={(e) => e.key === 'Enter' && generate()}
              />
            </div>

            {/* Basic Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Question Count */}
              <div>
                <label className={`text-sm font-medium mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Number of Questions
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((num) => (
                    <motion.button
                      key={num}
                      onClick={() => setQuestionCount(num)}
                      className={`flex-1 py-2 rounded-xl border font-medium transition-all ${
                        questionCount === num
                          ? `${darkMode ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'}`
                          : `${darkMode ? 'border-[#2a2a2a] text-gray-400 hover:border-[#333]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {num}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className={`text-sm font-medium mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Difficulty
                </label>
                <div className="flex gap-1">
                  {Object.entries(DIFFICULTY_CONFIG).map(([id, config]) => (
                    <motion.button
                      key={id}
                      onClick={() => setDifficulty(id)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                        difficulty === id
                          ? config.color === 'emerald' ? `${darkMode ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`
                          : config.color === 'green' ? `${darkMode ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-green-50 border-green-200 text-green-600'}`
                          : config.color === 'yellow' ? `${darkMode ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-600'}`
                          : config.color === 'orange' ? `${darkMode ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'}`
                          : `${darkMode ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`
                          : `${darkMode ? 'border-[#2a2a2a] text-gray-400 hover:border-[#333]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {config.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Question Types */}
            <div className="mb-6">
              <label className={`text-sm font-medium mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Question Types (leave empty for all)
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(QUESTION_TYPE_CONFIG).map(([type, config]) => (
                  <motion.button
                    key={type}
                    onClick={() => toggleQuestionType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      selectedTypes.includes(type)
                        ? `${darkMode ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400' : 'bg-purple-50 border border-purple-200 text-purple-600'}`
                        : `${darkMode ? 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>{config.icon}</span>
                    <span>{config.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <motion.button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className={`w-full mb-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <svg className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Advanced Options
            </motion.button>

            {/* Advanced Options */}
            <AnimatePresence>
              {showAdvancedOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 mb-6 overflow-hidden"
                >
                  {/* Bloom's Taxonomy */}
                  <div>
                    <label className={`text-sm font-medium mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Bloom's Taxonomy Level
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {BLOOM_LEVELS.map((level) => (
                        <motion.button
                          key={level.id}
                          onClick={() => setBloomLevel(bloomLevel === level.id ? null : level.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            bloomLevel === level.id
                              ? `${darkMode ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' : 'bg-blue-50 border border-blue-200 text-blue-600'}`
                              : `${darkMode ? 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          title={level.description}
                        >
                          {level.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Options Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <label className={`flex items-center gap-2 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <input
                        type="checkbox"
                        checked={adaptiveDifficulty}
                        onChange={(e) => setAdaptiveDifficulty(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm">Adaptive</span>
                    </label>
                    <label className={`flex items-center gap-2 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <input
                        type="checkbox"
                        checked={withHints}
                        onChange={(e) => setWithHints(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm">Hints</span>
                    </label>
                    <label className={`flex items-center gap-2 cursor-pointer ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <input
                        type="checkbox"
                        checked={withExplanations}
                        onChange={(e) => setWithExplanations(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-sm">Explanations</span>
                    </label>
                    <div>
                      <input
                        type="number"
                        placeholder="Time limit (min)"
                        value={timeLimitMinutes || ''}
                        onChange={(e) => setTimeLimitMinutes(e.target.value ? parseInt(e.target.value) : null)}
                        min="1"
                        max="180"
                        className={`w-full px-3 py-1.5 rounded-lg text-sm border ${
                          darkMode
                            ? 'bg-[#2a2a2a] border-[#333] text-white placeholder-gray-500'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generate Button */}
            <motion.button
              onClick={generate}
              disabled={!topic.trim()}
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                !topic.trim()
                  ? `${darkMode ? 'bg-[#2a2a2a] text-gray-500' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                  : 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-600 hover:to-fuchsia-600'
              }`}
              whileHover={topic.trim() ? { scale: 1.02 } : {}}
              whileTap={topic.trim() ? { scale: 0.98 } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Advanced Quiz
            </motion.button>
          </motion.div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`rounded-2xl border p-12 text-center ${darkMode ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-purple-500/30 border-t-purple-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Creating your advanced quiz...
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Generating {questionCount} {selectedTypes.length > 0 ? selectedTypes.join(', ') : 'mixed'} questions about {topic}
            </p>
          </motion.div>
        )}

        {/* Quiz Questions */}
        <AnimatePresence>
          {quizData && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Quiz Info Bar */}
              <div className={`rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${darkMode ? 'bg-[#1f1f1f] border border-[#2a2a2a]' : 'bg-white border border-gray-200'}`}>
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Topic</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{quizData.topic}</p>
                  </div>
                  <div className={`h-8 w-px ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Questions</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{quizData.total_questions}</p>
                  </div>
                  <div className={`h-8 w-px ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`} />
                  <div>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Points</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{quizData.total_points}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(quizData.question_type_distribution || {}).map(([type, count]) => (
                    <span key={type} className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-[#2a2a2a] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                      {QUESTION_TYPE_CONFIG[type]?.icon} {count}
                    </span>
                  ))}
                </div>
              </div>

              {/* Results Summary */}
              {showResults && renderSummary()}

              {/* Questions */}
              {quizData.questions.map((q, i) => renderQuestion(q, i))}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  onClick={handleReset}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    darkMode ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  New Quiz
                </motion.button>
                {!showResults && (
                  <motion.button
                    onClick={handleSubmit}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Submit Quiz ({Object.keys(answers).length}/{quizData.questions.length})
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
