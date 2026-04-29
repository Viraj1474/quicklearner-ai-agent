# 🔌 API Integration Examples for Frontend

Complete code examples showing how to integrate each new endpoint into your React components.

---

## 1. Advanced Note Highlighter

### Backend Endpoint
```
POST /api/notes/highlight/advanced
```

### React Component Example

```jsx
// src/components/AdvancedNotesHighlighter.jsx
import { useState } from 'react';
import './AdvancedNotesHighlighter.css';

export function AdvancedNotesHighlighter() {
  const [text, setText] = useState('');
  const [highlights, setHighlights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(['concepts']);

  async function handleHighlight() {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/notes/highlight/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          categories: selectedCategories,
          with_summary: true
        })
      });

      if (!response.ok) throw new Error('Failed to highlight');
      const data = await response.json();
      setHighlights(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to highlight notes');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="advanced-highlighter">
      <h2>Smart Note Highlighter</h2>
      
      {/* Category Filters */}
      <div className="category-filters">
        <label>
          <input
            type="checkbox"
            checked={selectedCategories.includes('concepts')}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCategories([...selectedCategories, 'concepts']);
              } else {
                setSelectedCategories(selectedCategories.filter(c => c !== 'concepts'));
              }
            }}
          />
          Concepts
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedCategories.includes('examples')}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCategories([...selectedCategories, 'examples']);
              } else {
                setSelectedCategories(selectedCategories.filter(c => c !== 'examples'));
              }
            }}
          />
          Examples
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedCategories.includes('definitions')}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCategories([...selectedCategories, 'definitions']);
              } else {
                setSelectedCategories(selectedCategories.filter(c => c !== 'definitions'));
              }
            }}
          />
          Definitions
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedCategories.includes('formulas')}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedCategories([...selectedCategories, 'formulas']);
              } else {
                setSelectedCategories(selectedCategories.filter(c => c !== 'formulas'));
              }
            }}
          />
          Formulas
        </label>
      </div>

      {/* Text Input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your notes here..."
        rows={10}
      />

      <button onClick={handleHighlight} disabled={loading}>
        {loading ? 'Highlighting...' : 'Highlight Notes'}
      </button>

      {/* Results */}
      {highlights && (
        <div className="results">
          <div className="stats">
            <span>{highlights.total_highlights} highlights found</span>
            <span>Readability: {highlights.readability_level}</span>
          </div>

          <div className="highlights">
            {highlights.highlights.map((h, i) => (
              <div key={i} className={`highlight highlight-${h.importance}`}>
                <span className="category">{h.category}</span>
                <span className="text">{h.text}</span>
                <span className="confidence">{(h.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>

          {highlights.summary && (
            <div className="summary">
              <h3>Summary</h3>
              <p>{highlights.summary}</p>
            </div>
          )}

          <div className="key-concepts">
            <h3>Key Concepts</h3>
            <ul>
              {highlights.key_concepts.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 2. Advanced Summarizer

### Backend Endpoint
```
POST /api/summarize/advanced
```

### React Component Example

```jsx
// src/components/AdvancedSummarizer.jsx
import { useState } from 'react';

export function AdvancedSummarizer() {
  const [text, setText] = useState('');
  const [style, setStyle] = useState('abstractive');
  const [length, setLength] = useState('medium');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSummarize() {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/summarize/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          style: style,
          length: length,
          with_keywords: true,
          with_outline: style === 'outline'
        })
      });

      if (!response.ok) throw new Error('Failed to summarize');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to summarize text');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="advanced-summarizer">
      <h2>Smart Text Summarizer</h2>

      {/* Style Selection */}
      <div className="controls">
        <div className="control-group">
          <label>Style:</label>
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="extractive">Extractive (Key sentences)</option>
            <option value="abstractive">Abstractive (Paraphrased)</option>
            <option value="bullet_points">Bullet Points</option>
            <option value="outline">Outline (Hierarchical)</option>
          </select>
        </div>

        <div className="control-group">
          <label>Length:</label>
          <select value={length} onChange={(e) => setLength(e.target.value)}>
            <option value="short">Short (25% of original)</option>
            <option value="medium">Medium (50% of original)</option>
            <option value="long">Long (75% of original)</option>
          </select>
        </div>
      </div>

      {/* Text Input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text to summarize..."
        rows={12}
      />

      <button onClick={handleSummarize} disabled={loading || !text}>
        {loading ? 'Summarizing...' : 'Summarize'}
      </button>

      {/* Results */}
      {result && (
        <div className="results">
          <div className="stats">
            <span>Compression: {result.compression_ratio.toFixed(1)}x</span>
            <span>Original: {result.original_word_count} words</span>
            <span>Summary: {result.word_count} words</span>
            <span>Readability: {result.readability.level}</span>
          </div>

          <div className="summary-box">
            <h3>Summary</h3>
            <p>{result.summary}</p>
          </div>

          {result.keywords && result.keywords.length > 0 && (
            <div className="keywords">
              <h3>Key Terms</h3>
              <div className="keyword-tags">
                {result.keywords.map((k, i) => (
                  <span key={i} className="keyword-tag">{k}</span>
                ))}
              </div>
            </div>
          )}

          {result.outline && result.outline.length > 0 && (
            <div className="outline">
              <h3>Outline</h3>
              <ol>
                {result.outline.map((item, i) => (
                  <li key={i}>{item.point}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 3. Advanced Quiz Generator

### Backend Endpoint
```
POST /api/quiz/generate/advanced
```

### React Component Example

```jsx
// src/components/AdvancedQuizGenerator.jsx
import { useState } from 'react';

export function AdvancedQuizGenerator() {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionTypes, setQuestionTypes] = useState(['multiple_choice', 'true_false']);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  async function handleGenerateQuiz() {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/quiz/generate/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic,
          num_questions: numQuestions,
          difficulty: difficulty,
          question_types: questionTypes,
          with_hints: true,
          with_explanations: true
        })
      });

      if (!response.ok) throw new Error('Failed to generate quiz');
      const data = await response.json();
      setQuiz(data);
      setCurrentQuestion(0);
      setAnswers({});
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  }

  if (!quiz) {
    return (
      <div className="quiz-generator">
        <h2>Quiz Generator</h2>

        <div className="form">
          <div className="form-group">
            <label>Topic:</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Python Programming"
            />
          </div>

          <div className="form-group">
            <label>Number of Questions:</label>
            <input
              type="number"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              min="1"
              max="50"
            />
          </div>

          <div className="form-group">
            <label>Difficulty:</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="form-group">
            <label>Question Types:</label>
            <div className="checkboxes">
              {['multiple_choice', 'true_false', 'short_answer', 'fill_in_blank'].map(type => (
                <label key={type}>
                  <input
                    type="checkbox"
                    checked={questionTypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setQuestionTypes([...questionTypes, type]);
                      } else {
                        setQuestionTypes(questionTypes.filter(t => t !== type));
                      }
                    }}
                  />
                  {type.replace(/_/g, ' ').toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateQuiz}
            disabled={loading || !topic || questionTypes.length === 0}
          >
            {loading ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
      </div>
    );
  }

  // Display Quiz
  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.total_questions - 1;

  return (
    <div className="quiz-display">
      <div className="quiz-header">
        <h2>{quiz.topic}</h2>
        <div className="progress">
          Question {currentQuestion + 1} of {quiz.total_questions}
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestion + 1) / quiz.total_questions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="question-card">
        <div className="question-meta">
          <span className="type">{question.question_type.replace(/_/g, ' ')}</span>
          <span className="difficulty">{question.difficulty}</span>
          <span className="time">{question.time_estimate_seconds}s</span>
        </div>

        <div className="question-text">
          <h3>{question.question}</h3>
        </div>

        {question.question_type === 'multiple_choice' && question.options && (
          <div className="options">
            {question.options.map((option, i) => (
              <button
                key={i}
                className={`option ${answers[currentQuestion] === option ? 'selected' : ''}`}
                onClick={() => setAnswers({ ...answers, [currentQuestion]: option })}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {question.question_type === 'true_false' && (
          <div className="options">
            <button
              className={`option ${answers[currentQuestion] === 'true' ? 'selected' : ''}`}
              onClick={() => setAnswers({ ...answers, [currentQuestion]: 'true' })}
            >
              True
            </button>
            <button
              className={`option ${answers[currentQuestion] === 'false' ? 'selected' : ''}`}
              onClick={() => setAnswers({ ...answers, [currentQuestion]: 'false' })}
            >
              False
            </button>
          </div>
        )}

        {['short_answer', 'fill_in_blank'].includes(question.question_type) && (
          <input
            type="text"
            value={answers[currentQuestion] || ''}
            onChange={(e) => setAnswers({ ...answers, [currentQuestion]: e.target.value })}
            placeholder="Your answer..."
            className="text-input"
          />
        )}

        {question.hint && (
          <div className="hint">
            <strong>Hint:</strong> {question.hint}
          </div>
        )}
      </div>

      <div className="navigation">
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          ← Previous
        </button>

        {isLastQuestion ? (
          <button
            onClick={() => alert('Quiz submitted! (implementation pending)')}
            className="submit-btn"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
          >
            Next →
          </button>
        )}
      </div>

      {question.explanation && (
        <div className="explanation">
          <details>
            <summary>Show Explanation</summary>
            <p>{question.explanation}</p>
          </details>
        </div>
      )}
    </div>
  );
}
```

---

## 4. Advanced Analytics Dashboard

### Backend Endpoints
```
GET /api/analytics/dashboard
GET /api/analytics/performance
GET /api/analytics/trends
```

### React Component Example

```jsx
// src/components/AdvancedAnalytics.jsx
import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AdvancedAnalytics() {
  const [dashboard, setDashboard] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [dashboardRes, perfRes, trendsRes] = await Promise.all([
          fetch('http://localhost:8000/api/analytics/dashboard?user_id=1'),
          fetch('http://localhost:8000/api/analytics/performance?user_id=1'),
          fetch('http://localhost:8000/api/analytics/trends?user_id=1')
        ]);

        const dashboardData = await dashboardRes.json();
        const perfData = await perfRes.json();
        const trendsData = await trendsRes.json();

        setDashboard(dashboardData);
        setPerformance(perfData);
        setTrends(trendsData);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) return <div>Loading analytics...</div>;
  if (!dashboard) return <div>No data available</div>;

  return (
    <div className="advanced-analytics">
      <h1>Your Learning Dashboard</h1>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Study Streak</h3>
          <div className="big-number">
            {dashboard.streak.current}
            <span>days 🔥</span>
          </div>
          <p>Longest: {dashboard.streak.longest} days</p>
        </div>

        <div className="card">
          <h3>Sessions</h3>
          <div className="big-number">{dashboard.summary.total_sessions}</div>
          <p>Total study sessions</p>
        </div>

        <div className="card">
          <h3>Accuracy</h3>
          <div className="big-number">{performance.accuracy_percentage.toFixed(1)}%</div>
          <p>{performance.correct_answers}/{performance.total_attempts}</p>
        </div>

        <div className="card">
          <h3>Level</h3>
          <div className="big-number">{dashboard.progress.current_level}</div>
          <p>{dashboard.progress.completion_percentage.toFixed(1)}% Complete</p>
        </div>
      </div>

      {/* Learning Curve Chart */}
      <div className="chart-section">
        <h2>Learning Progress</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dashboard.learning_curve}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="score" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Topic Performance */}
      <div className="chart-section">
        <h2>Performance by Topic</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={Object.entries(performance.topic_performance).map(([topic, accuracy]) => ({
            topic,
            accuracy
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="topic" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="accuracy" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="strengths-weaknesses">
        <div className="section">
          <h3>✅ Strengths</h3>
          <ul>
            {dashboard.strengths_weaknesses.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="section">
          <h3>⚠️ Areas to Improve</h3>
          <ul>
            {dashboard.strengths_weaknesses.weaknesses.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations">
        <h3>💡 Personalized Recommendations</h3>
        <ul>
          {dashboard.recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>

      {/* Study Time Heatmap */}
      <div className="study-patterns">
        <h3>Your Study Patterns</h3>
        <div className="peak-hours">
          <p><strong>Most Active:</strong> {dashboard.time_analysis.peak_hour}</p>
          <p><strong>Peak Day:</strong> {dashboard.time_analysis.peak_day}</p>
          <p><strong>Average Session:</strong> {dashboard.time_analysis.avg_session_duration} minutes</p>
        </div>
      </div>
    </div>
  );
}
```

---

## CSS Styling Examples

### Highlighter Styling
```css
.highlight {
  display: block;
  padding: 10px;
  margin: 8px 0;
  border-left: 4px solid #007bff;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.highlight-high {
  border-left-color: #ff4444;
  background-color: #ffe0e0;
}

.highlight-medium {
  border-left-color: #ffa500;
  background-color: #fff4e0;
}

.highlight-low {
  border-left-color: #4444ff;
  background-color: #e0e4ff;
}

.highlight .category {
  display: inline-block;
  padding: 4px 8px;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  font-size: 0.8em;
  margin-right: 8px;
}

.highlight .confidence {
  float: right;
  font-weight: bold;
  color: #666;
}
```

### Quiz Styling
```css
.quiz-display .question-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 0.9em;
}

.quiz-display .options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

.quiz-display .option {
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s;
}

.quiz-display .option:hover {
  border-color: #007bff;
  background-color: #f0f8ff;
}

.quiz-display .option.selected {
  border-color: #28a745;
  background-color: #e8f5e9;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #28a745;
  transition: width 0.3s;
}
```

---

## Utility Functions

### API Service Helper
```javascript
// src/services/advancedAiService.js

const API_BASE = 'http://localhost:8000';

export const advancedAiService = {
  async highlightNotes(text, categories = ['concepts'], withSummary = true) {
    const response = await fetch(`${API_BASE}/api/notes/highlight/advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, categories, with_summary: withSummary })
    });
    if (!response.ok) throw new Error('Failed to highlight');
    return response.json();
  },

  async summarizeText(text, style = 'abstractive', length = 'medium', withKeywords = true) {
    const response = await fetch(`${API_BASE}/api/summarize/advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, style, length, with_keywords: withKeywords })
    });
    if (!response.ok) throw new Error('Failed to summarize');
    return response.json();
  },

  async generateQuiz(topic, numQuestions = 10, difficulty = 'medium', questionTypes = null) {
    const response = await fetch(`${API_BASE}/api/quiz/generate/advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        num_questions: numQuestions,
        difficulty,
        question_types: questionTypes,
        with_hints: true,
        with_explanations: true
      })
    });
    if (!response.ok) throw new Error('Failed to generate quiz');
    return response.json();
  },

  async getDashboardAnalytics(userId = 1) {
    const response = await fetch(`${API_BASE}/api/analytics/dashboard?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to load analytics');
    return response.json();
  },

  async getPerformanceAnalytics(userId = 1) {
    const response = await fetch(`${API_BASE}/api/analytics/performance?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to load performance');
    return response.json();
  },

  async getTrendAnalytics(userId = 1) {
    const response = await fetch(`${API_BASE}/api/analytics/trends?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to load trends');
    return response.json();
  }
};
```

---

## Error Handling Best Practices

```javascript
// src/utils/apiErrorHandler.js

export function handleApiError(error) {
  if (error instanceof TypeError) {
    return 'Network connection failed. Please check your connection.';
  }

  if (error.response) {
    const status = error.response.status;
    if (status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (status === 500) {
      return 'Server error. Please try again later.';
    }
    if (status === 422) {
      return 'Invalid request. Please check your input.';
    }
  }

  return error.message || 'An unexpected error occurred.';
}

export async function fetchWithErrorHandling(url, options) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.response = response;
      throw error;
    }
    return await response.json();
  } catch (error) {
    const message = handleApiError(error);
    throw new Error(message);
  }
}
```

---

## Next Steps

1. Copy these components into your `src/components/` directory
2. Install Recharts if using analytics: `npm install recharts`
3. Update your routing to include the new components
4. Test each endpoint using Swagger UI first (`/docs`)
5. Customize styling to match your app's theme
6. Add error boundaries for better error handling
7. Implement loading states and skeleton screens

---

**All endpoints are ready for frontend integration! Happy coding! 🚀**
