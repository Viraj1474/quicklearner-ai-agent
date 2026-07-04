# ch06_implementation.py
import sys
sys.path.insert(0, r'C:\ai-agent')
from ql_helpers import *
from ql_helpers import _p, _r, _sup, img_placeholder

def write_ch6(doc):
    chapter_heading(doc, "6", "Project Implementation")

    body(doc,
        "This chapter describes the complete implementation of the QuickLearner AI "
        "system, covering the development environment setup, backend implementation, "
        "frontend implementation, and AI integration. Code structure, key design "
        "decisions, and feature-level implementation details are documented.")

    section(doc, "6.1", "Development Environment")
    body(doc,
        "The development environment for QuickLearner AI consists of the following "
        "tools, frameworks, and services:")
    bullet(doc, "Operating System: Windows 11 (development), compatible with Linux/macOS")
    bullet(doc, "Backend Language: Python 3.13 with virtual environment (.venv)")
    bullet(doc, "Backend Framework: FastAPI 0.104.1 with Uvicorn 0.24.0 ASGI server")
    bullet(doc, "Database: SQLite via SQLAlchemy 2.0.23 ORM")
    bullet(doc, "AI Service: Google Generative AI SDK 0.3.2 (Gemini API)")
    bullet(doc, "Frontend Framework: React.js 18 with Create React App")
    bullet(doc, "Styling: Tailwind CSS 3.x with dark mode support")
    bullet(doc, "Animations: Framer Motion 10.x")
    bullet(doc, "Package Manager: npm (frontend), pip (backend)")
    bullet(doc, "Version Control: Git")
    bullet(doc, "Code Editor: Visual Studio Code")
    bullet(doc, "API Testing: FastAPI Swagger UI (/docs), Invoke-RestMethod (PowerShell)")

    section(doc, "6.2", "Backend Implementation")
    subsection(doc, "6.2.1", "Project Structure")
    body(doc,
        "The backend is organised as a Python package under the backend/ directory. "
        "The main application file (main.py) initialises the FastAPI app, registers "
        "all routers, and configures CORS and the database. The gemini_client.py "
        "module encapsulates all Gemini API interactions. The database.py module "
        "defines all SQLAlchemy models. The schemas.py module defines all Pydantic "
        "request/response schemas.")

    ascii_diagram(doc, [
        "  backend/",
        "  ├── main.py              # FastAPI app, CORS, router registration",
        "  ├── gemini_client.py     # Gemini API client (all AI calls)",
        "  ├── database.py          # SQLAlchemy models + DB init",
        "  ├── schemas.py           # Pydantic request/response schemas",
        "  ├── config.py            # Environment variable management",
        "  ├── routers/",
        "  │   ├── chat.py          # /api/chat endpoints",
        "  │   ├── quiz.py          # /api/quiz endpoints",
        "  │   ├── flashcards.py    # /api/flashcards endpoints",
        "  │   ├── summarize.py     # /api/summarize endpoints",
        "  │   ├── notes.py         # /api/notes endpoints",
        "  │   ├── analytics.py     # /api/analytics endpoints",
        "  │   └── goals.py         # /api/goals + /api/streak",
        "  ├── requirements.txt",
        "  └── .env                 # API keys (not committed to VCS)",
    ], caption=None)

    subsection(doc, "6.2.2", "Database Schema")
    body(doc,
        "The SQLite database is initialised by SQLAlchemy on first run. The schema "
        "contains seven tables as defined in the ER diagram. The ChatSession table "
        "stores session metadata; the Message table stores individual messages with "
        "a role field (user/assistant). The Quiz table stores serialised questions "
        "and the student's score. The FlashcardSet and Flashcard tables store "
        "generated flashcard content. The Summary and Note tables store AI-generated "
        "summaries and highlighted notes respectively. The Analytics table logs "
        "feature usage events for dashboard visualisation.")

    subsection(doc, "6.2.3", "API Endpoints")
    body(doc,
        "The backend exposes fifteen RESTful API endpoints. The key endpoints are:")
    bullet(doc, "POST /api/chat — accepts message + session_id, calls Gemini chat, stores message pair, returns AI response")
    bullet(doc, "POST /api/quiz/generate — accepts text + num_questions, calls Gemini, stores quiz, returns MCQ JSON")
    bullet(doc, "POST /api/flashcards/generate — accepts text, calls Gemini, returns Q&A pairs")
    bullet(doc, "POST /api/summarize — accepts text, calls Gemini abstractive summarisation, stores and returns summary")
    bullet(doc, "POST /api/notes/highlight — accepts text, calls Gemini key-concept extraction, returns highlights")
    bullet(doc, "GET /api/analytics — returns usage statistics and study activity metrics from database")
    bullet(doc, "POST /api/goals — creates or updates daily study goal")
    bullet(doc, "GET /api/streak — returns current daily streak count")
    bullet(doc, "GET /health — returns backend health status and timestamp")

    subsection(doc, "6.2.4", "Gemini AI Integration")
    body(doc,
        "The gemini_client.py module initialises the Gemini API with the key from "
        "the environment and provides separate methods for each AI feature. Each "
        "method constructs a carefully engineered prompt specific to its task. "
        "For example, the quiz generation prompt instructs Gemini to return exactly "
        "N multiple-choice questions in a structured JSON format with question, "
        "options (A–D), and correct_answer fields. The response is parsed by the "
        "backend before being stored and returned to the frontend.")

    section(doc, "6.3", "Frontend Implementation")
    subsection(doc, "6.3.1", "Component Structure")
    body(doc,
        "The React.js frontend is organised as a Single Page Application with a "
        "top-level App.jsx routing to feature-specific components. Each feature "
        "has its own component file under src/components/. An aiService.js module "
        "in src/components/services/ centralises all API calls with error handling.")

    ascii_diagram(doc, [
        "  frontend/src/",
        "  ├── App.jsx              # Top-level router + layout",
        "  ├── components/",
        "  │   ├── Dashboard.jsx    # Unified overview dashboard",
        "  │   ├── ChatBot.jsx      # AI Chat Assistant UI",
        "  │   ├── QuizGenerator.jsx# AI Quiz Generator UI",
        "  │   ├── Flashcards.jsx   # Flashcard view + generation",
        "  │   ├── Summarizer.jsx   # Text summarisation UI",
        "  │   ├── NotesHighlighter.jsx # Notes highlighting UI",
        "  │   ├── Analytics.jsx    # Charts + study metrics",
        "  │   ├── Goals.jsx        # Daily goals manager",
        "  │   ├── Streak.jsx       # Daily streak display",
        "  │   ├── Progress.jsx     # Progress tracking view",
        "  │   └── services/",
        "  │       └── aiService.js # API client with error handling",
        "  └── index.js",
    ], caption=None)

    subsection(doc, "6.3.2", "Key UI Features")
    body(doc,
        "The Dashboard component provides a unified landing page showing the student's "
        "current streak, today's goal completion, recent quiz scores, and quick-access "
        "buttons to all features. The ChatBot component implements a scrollable message "
        "thread with user and assistant bubbles, a New Chat button, and a loading "
        "indicator during AI response generation. The QuizGenerator component renders "
        "AI-generated multiple-choice questions with radio button selectors and "
        "displays the score and correct answers after submission.")
    body(doc,
        "The Flashcards component presents generated Q&A cards with a flip animation "
        "powered by Framer Motion. The Summarizer and NotesHighlighter components "
        "provide text area inputs and display AI-generated results with formatted "
        "output. The Analytics component uses lightweight chart libraries to visualise "
        "study time, quiz score trends, and feature usage frequency.")

    section(doc, "6.4", "AI Integration Details")
    body(doc,
        "The integration between the FastAPI backend and the Google Gemini API is "
        "implemented using the official google-generativeai Python SDK. Each feature "
        "uses a distinct, carefully engineered system prompt to guide Gemini's output "
        "format and educational quality. The quiz generator prompt, for example, "
        "explicitly instructs Gemini to return valid JSON with a specific schema, "
        "preventing free-form text responses that would require complex parsing.")
    body(doc,
        "All Gemini API calls are made asynchronously using Python's asyncio, ensuring "
        "that the backend remains responsive while waiting for AI responses. Error "
        "handling wraps all Gemini calls with try-except blocks that return "
        "meaningful error messages to the frontend rather than crashing the server.")

    section(doc, "6.5", "Screenshots")
    body(doc,
        "The following figures illustrate the key screens of the implemented "
        "QuickLearner AI system.")

    screenshots = [
        ("6.1", "Dashboard – QuickLearner AI Home",
         "The Dashboard provides a unified overview including current streak, daily goal progress, recent quiz scores, study time, cards reviewed, and quick-access buttons to all AI study features."),
        ("6.2", "AI Quiz Generator",
         "The Quiz Generator allows topic-based quiz creation with configurable number of questions (5/10/15/20), difficulty level (Beginner to Expert), and question types (MCQ, True/False, Short Answer, Fill in Blank, Code)."),
        ("6.3", "AI Flashcard Module",
         "The Flashcard module (Active Learning) lets students paste study material and generate 3, 5, 10, 15, or 20 AI-generated question-answer flashcards from the Gemini API."),
        ("6.4", "AI Text Summarizer",
         "The Text Summarizer offers 8 summary styles: Extractive, Abstractive, Bullet Points, Outline, Cornell Notes, ELI5, Academic, and Key Takeaways, with configurable length from Brief to Detailed."),
        ("6.5", "AI Notes Highlighter",
         "The Smart Notes Highlighter extracts key concepts, definitions, examples, formulas, and important points from pasted notes using AI-powered category filtering."),
        ("6.6", "Study Analytics Dashboard",
         "Study Analytics shows 47 study sessions, 32.5 hours studied, 87% quiz accuracy, and 14-day streak. The AI Study Coach panel provides personalised insights and weak-area recommendations."),
        ("6.7", "Daily Streak Tracker",
         "The Daily Streak panel shows current streak count, weekly calendar with active days highlighted, and achievement stats: Best Streak, Total Days, and Badges earned."),
        ("6.8", "Daily Goals Manager",
         "The Daily Goals module allows students to set and track daily study objectives such as quizzes to complete, flashcards to review, and study time targets."),
    ]
    for fig_num, title, desc in screenshots:
        img_placeholder(doc, fig_num, title, desc)


