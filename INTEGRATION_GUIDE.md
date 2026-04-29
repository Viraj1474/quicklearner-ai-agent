# 🚀 Quick Integration Guide - Enhanced Tools

This guide will help you integrate the new advanced modules into your existing FastAPI backend.

---

## Step 1: Add New Request/Response Schemas

Add to `backend/schemas.py`:

```python
# Advanced Highlighting
class AdvancedHighlightRequest(BaseModel):
    text: str
    categories: Optional[List[str]] = None
    with_summary: bool = True

class AdvancedHighlightResponse(BaseModel):
    highlights: List[Dict]
    key_concepts: List[str]
    related_concepts: List[Dict]
    summary: Optional[str]
    readability_score: int
    readability_level: str
    total_highlights: int
    by_category: Dict

# Advanced Summarizer
class AdvancedSummaryRequest(BaseModel):
    text: str
    style: str = "abstractive"  # extractive, abstractive, bullet_points, outline
    length: str = "medium"  # short, medium, long
    with_keywords: bool = True
    with_outline: bool = False

class AdvancedSummaryResponse(BaseModel):
    summary: str
    style: str
    length: str
    word_count: int
    original_word_count: int
    compression_ratio: float
    keywords: List[str]
    outline: Optional[List[Dict]]
    readability: Dict

# Advanced Quiz
class AdvancedQuizRequest(BaseModel):
    topic: str
    num_questions: int = 10
    difficulty: str = "medium"
    question_types: Optional[List[str]] = None
    with_hints: bool = True
    with_explanations: bool = True

class AdvancedQuizResponse(BaseModel):
    topic: str
    difficulty: str
    total_questions: int
    questions: List[Dict]
    estimated_time_minutes: int
    estimated_time_seconds: int
    question_type_distribution: Dict
    difficulty_curve: List[Dict]

# Analytics
class AnalyticsDashboardResponse(BaseModel):
    summary: Dict
    progress: Dict
    learning_curve: List[Dict]
    strengths_weaknesses: Dict
    recommendations: List[str]
    streak: Dict
    time_analysis: Dict
```

---

## Step 2: Add API Endpoints to `main.py`

Add these endpoints after existing endpoints:

```python
# ===== ADVANCED HIGHLIGHTING =====
@app.post("/api/notes/highlight/advanced", response_model=AdvancedHighlightResponse, tags=["Advanced Tools"])
async def highlight_notes_advanced(request: AdvancedHighlightRequest):
    """Advanced note highlighting with categories and analysis"""
    try:
        from advanced_highlighter import advanced_highlighter
        result = await advanced_highlighter.highlight_advanced(
            text=request.text,
            categories=request.categories,
            with_summary=request.with_summary
        )
        return result
    except Exception as e:
        logger.error(f"Error in advanced highlighting: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== ADVANCED SUMMARIZATION =====
@app.post("/api/summarize/advanced", response_model=AdvancedSummaryResponse, tags=["Advanced Tools"])
async def summarize_advanced(request: AdvancedSummaryRequest):
    """Advanced summarization with multiple styles"""
    try:
        from advanced_summarizer import advanced_summarizer
        result = await advanced_summarizer.summarize_advanced(
            text=request.text,
            style=request.style,
            length=request.length,
            with_keywords=request.with_keywords,
            with_outline=request.with_outline
        )
        return result
    except Exception as e:
        logger.error(f"Error in advanced summarization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== ADVANCED QUIZ GENERATION =====
@app.post("/api/quiz/generate/advanced", response_model=AdvancedQuizResponse, tags=["Advanced Tools"])
@limiter.limit(AI_RATE_LIMIT)
async def generate_advanced_quiz(request: Request, quiz_request: AdvancedQuizRequest):
    """Advanced quiz with multiple question types"""
    try:
        from advanced_quiz_generator import advanced_quiz_generator
        result = await advanced_quiz_generator.generate_advanced_quiz(
            topic=quiz_request.topic,
            num_questions=quiz_request.num_questions,
            difficulty=quiz_request.difficulty,
            question_types=quiz_request.question_types,
            with_hints=quiz_request.with_hints,
            with_explanations=quiz_request.with_explanations
        )
        return result
    except Exception as e:
        logger.error(f"Error generating advanced quiz: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== ANALYTICS ENDPOINTS =====
@app.get("/api/analytics/dashboard", response_model=AnalyticsDashboardResponse, tags=["Analytics"])
async def get_dashboard_analytics(user_id: int = 1, db: Session = Depends(get_db)):
    """Get comprehensive dashboard analytics"""
    try:
        from study_analytics_engine import study_analytics_engine
        result = await study_analytics_engine.get_dashboard_analytics(user_id, db)
        return result
    except Exception as e:
        logger.error(f"Error getting dashboard analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/performance", tags=["Analytics"])
async def get_performance_analytics(user_id: int = 1, db: Session = Depends(get_db)):
    """Get detailed performance analytics"""
    try:
        from study_analytics_engine import study_analytics_engine
        result = await study_analytics_engine.get_performance_analytics(user_id, db)
        return result
    except Exception as e:
        logger.error(f"Error getting performance analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/trends", tags=["Analytics"])
async def get_analytics_trends(user_id: int = 1, db: Session = Depends(get_db)):
    """Get learning trends"""
    try:
        from study_analytics_engine import study_analytics_engine
        result = await study_analytics_engine.get_trends(user_id, db)
        return result
    except Exception as e:
        logger.error(f"Error getting trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Step 3: Test the New Endpoints

Use the interactive Swagger UI at `http://localhost:8000/docs` to test:

### 1. Advanced Highlighter
```bash
curl -X POST "http://localhost:8000/api/notes/highlight/advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Machine Learning is a subset of AI that enables systems to learn from data. For example, neural networks can recognize patterns automatically.",
    "categories": ["concepts", "examples"],
    "with_summary": true
  }'
```

### 2. Advanced Summarizer
```bash
curl -X POST "http://localhost:8000/api/summarize/advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your long text here...",
    "style": "bullet_points",
    "length": "medium",
    "with_keywords": true,
    "with_outline": false
  }'
```

### 3. Advanced Quiz
```bash
curl -X POST "http://localhost:8000/api/quiz/generate/advanced" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Python Programming",
    "num_questions": 5,
    "difficulty": "medium",
    "question_types": ["multiple_choice", "true_false", "short_answer"],
    "with_hints": true,
    "with_explanations": true
  }'
```

### 4. Analytics
```bash
curl -X GET "http://localhost:8000/api/analytics/dashboard?user_id=1"
```

---

## Step 4: Frontend Integration (Optional)

Add to your React components:

### Advanced Quiz Component
```jsx
// src/components/AdvancedQuizGenerator.jsx
import { generateAdvancedQuiz } from './services/aiService';

async function handleGenerateAdvancedQuiz(topic, options) {
  try {
    const quiz = await generateAdvancedQuiz(topic, options);
    setQuiz(quiz);
  } catch (error) {
    console.error('Error generating quiz:', error);
  }
}
```

### Advanced Analytics Component
```jsx
// src/components/AdvancedAnalytics.jsx
import { Recharts } from 'recharts';

async function loadAnalytics() {
  const analytics = await fetch('/api/analytics/dashboard?user_id=1')
    .then(r => r.json());
  
  // Render learning curves, streaks, etc.
}
```

---

## Step 5: Restart Backend and Test

```powershell
# Kill existing process
Stop-Process -Name python -Force

# Restart backend
cd c:\ai-agent\backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 🎯 Verification Checklist

- [ ] All 4 new modules imported successfully
- [ ] No import errors in main.py
- [ ] All endpoints appear in Swagger UI (`/docs`)
- [ ] Test each endpoint returns expected response
- [ ] Check logs for any warnings
- [ ] Frontend can call new endpoints
- [ ] Analytics data is being collected

---

## 📊 Expected API Structure

After integration, your backend will have:

```
/api/
├── /notes/
│   └── /highlight/advanced  (POST) ✨ NEW
├── /summarize/
│   └── /advanced            (POST) ✨ NEW
├── /quiz/
│   └── /generate/advanced   (POST) ✨ NEW
├── /analytics/
│   ├── /dashboard           (GET)  ✨ NEW
│   ├── /performance         (GET)  ✨ NEW
│   └── /trends              (GET)  ✨ NEW
└── ... (existing endpoints)
```

---

## 🐛 Troubleshooting

### Import Errors
Make sure all files are in `backend/` directory:
```
backend/
├── advanced_highlighter.py
├── advanced_summarizer.py
├── advanced_quiz_generator.py
├── study_analytics_engine.py
├── main.py
└── ... other files
```

### AttributeError
Ensure database models have required fields for analytics to work.

### Type Errors
Double-check that request bodies match the schema definitions.

---

## ✅ You're Done!

Your AI Study Assistant now has:
- ✅ 4 advanced tools (1500+ lines of code)
- ✅ 7+ new API endpoints
- ✅ Enhanced analytics dashboard
- ✅ Better user experience

**Next Step:** Update frontend components to use the new advanced features!

---

## 📚 Documentation Links

- Detailed Implementation: `ENHANCEMENTS_IMPLEMENTED.md`
- Enhancement Guide: `ENHANCEMENT_GUIDE.md`
- API Docs: `http://localhost:8000/docs`
- Backend README: `backend/README.md`
