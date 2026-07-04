# AI Study Assistant

A full-stack intelligent study assistant combining a **React** frontend, **FastAPI** backend, and **Google Gemini AI** for smart studying, note management, and learning analytics.

---

## 🚀 Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, Tailwind CSS, Framer Motion           |
| Backend   | FastAPI, SQLAlchemy ORM, SQLite                 |
| AI        | Google Gemini API (with HuggingFace fallback)   |
| Auth      | JWT (python-jose), bcrypt, OAuth2               |
| Payments  | Stripe + Razorpay integration                   |

---

## ✨ Features

- 💬 **AI Chat** — Conversational study assistant powered by Gemini
- ❓ **Q&A** — Ask questions, get instant answers
- 📝 **Notes Highlighter** — Highlight and extract key points
- 🃏 **Flashcard Generator** — Auto-generate flashcards from notes
- 🧠 **Quiz Generator** — Create quizzes with scoring
- 📄 **Summarizer** — Summarize long texts
- 📊 **Analytics** — Track study sessions, streaks, and progress
- 🔐 **Authentication** — Register, login, JWT sessions, password reset
- 💳 **Premium Billing** — Stripe/Razorpay subscription plans
- 🎯 **Study Goals & Streaks** — Goal tracking and spaced repetition

---

## 📁 Project Structure

```
C:\ai-agent\
│
├── frontend/                        # React app (port 3000)
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx                  # Root component + routing
│   │   ├── index.js
│   │   ├── components/
│   │   │   ├── ChatBot.jsx          # Main AI chat interface
│   │   │   ├── QandA.jsx            # Q&A feature
│   │   │   ├── NotesHighlighter.jsx # Notes highlighting
│   │   │   ├── FlashcardsContainer.jsx
│   │   │   ├── QuizGenerator.jsx
│   │   │   ├── Summary.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── UserProfile.jsx
│   │   │   ├── StudyGoals.jsx
│   │   │   ├── StreakTracker.jsx
│   │   │   ├── SpacedRepetition.jsx
│   │   │   ├── PomodoroTimer.jsx
│   │   │   ├── AuthModal.jsx        # Login / Register modal
│   │   │   ├── AuthContext.jsx      # Auth state (React context)
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── hooks/
│   │   │   │   └── useQuota.js
│   │   │   ├── services/
│   │   │   │   └── aiService.js     # Axios API client
│   │   │   └── premium/
│   │   │       └── UpgradeModal.jsx
│   │   └── __tests__/
│   │       ├── aiService.test.js
│   │       └── authService.test.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env
│
├── backend/                         # FastAPI app (port 8000)
│   ├── main.py                      # App entry point + all routes (~15 endpoints)
│   ├── database.py                  # SQLAlchemy models (7 tables)
│   ├── schemas.py                   # Pydantic request/response schemas
│   ├── config.py                    # Environment config
│   ├── auth.py                      # JWT auth logic
│   ├── auth_routes.py               # /auth/* endpoints
│   ├── billing.py                   # Subscription billing logic
│   ├── billing_routes.py            # /billing/* endpoints
│   ├── payments.py                  # Stripe/Razorpay integration
│   ├── gemini_client.py             # Google Gemini AI client
│   ├── gemini_wrapper.py            # Gemini wrapper with retry logic
│   ├── ai_wrapper.py                # AI abstraction layer
│   ├── ai_fallback_wrapper.py       # Fallback to HuggingFace
│   ├── huggingface_client.py        # HuggingFace inference client
│   ├── advanced_summarizer.py       # NLP summarization engine
│   ├── advanced_quiz_generator.py   # Quiz generation engine
│   ├── advanced_highlighter.py      # Smart highlighting engine
│   ├── study_analytics_engine.py    # Analytics computation
│   ├── agent_planner.py             # AI agent planning logic
│   ├── agent_state.py               # Agent state management
│   ├── middleware.py                # Rate limiting, logging
│   ├── https_middleware.py          # HTTPS redirect middleware
│   ├── job_queue.py                 # Background job queue
│   ├── backup_db.py                 # Database backup utility
│   ├── run_backend.py               # Windows startup launcher
│   ├── migrations/
│   │   └── 001_premium_billing.sql
│   ├── requirements.txt
│   ├── .env                         # API keys & config (not committed)
│   ├── .env.example                 # Example env template
│   └── ai_agent.db                  # SQLite database (auto-created)
│
├── .venv/                           # Python virtual environment (canonical)
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI
│
├── start.ps1                        # Start backend + frontend together
├── start-backend.ps1                # Start backend only
├── start-frontend.ps1               # Start frontend only
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- Google Gemini API key

### 1. Start Everything (Recommended)

```powershell
cd C:\ai-agent
.\start.ps1
```

This starts both servers in separate terminals.

### 2. Start Separately

**Backend:**
```powershell
.\start-backend.ps1
# or manually:
C:\ai-agent\.venv\Scripts\python.exe backend\run_backend.py
```

**Frontend:**
```powershell
.\start-frontend.ps1
# or manually:
cd frontend && npm start
```

---

## 🌐 URLs

| Service       | URL                          |
|---------------|------------------------------|
| Frontend      | http://localhost:3000        |
| Backend API   | http://localhost:8000        |
| Swagger Docs  | http://localhost:8000/docs   |
| Health Check  | http://localhost:8000/health |

---

## ⚙️ Configuration

Edit `backend/.env`:

```env
GOOGLE_API_KEY=your_gemini_key_here
DATABASE_URL=sqlite:///./ai_agent.db
HOST=0.0.0.0
PORT=8000
DEBUG=True
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=your_jwt_secret
```

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:8000
```

---

## 📡 Key API Endpoints

| Method | Endpoint                  | Description                  |
|--------|---------------------------|------------------------------|
| GET    | `/health`                 | Health check                 |
| POST   | `/api/chat`               | AI chat message              |
| POST   | `/api/summarize`          | Summarize text               |
| POST   | `/api/flashcards/generate`| Generate flashcards          |
| POST   | `/api/quiz/generate`      | Generate quiz                |
| POST   | `/api/notes/highlight`    | Highlight key points         |
| GET    | `/api/analytics`          | User analytics               |
| POST   | `/auth/register`          | Register user                |
| POST   | `/auth/login`             | Login + get JWT token        |
| GET    | `/auth/me`                | Get current user             |

---

## 🗄️ Database Schema

7 SQLAlchemy models:
- `User` — accounts, auth, subscription tier
- `ChatSession` / `ChatMessage` — conversation history
- `Flashcard` — generated flashcards
- `Quiz` / `QuizAttempt` — quizzes and scores
- `Summary` — saved summaries
- `StudySession` — analytics data

---

## 🔐 Virtual Environment

Two venvs exist — always use the root one:

```powershell
# Install dependencies
C:\ai-agent\.venv\Scripts\pip.exe install -r backend\requirements.txt
```

---

## 📦 Dependencies

**Backend** (`backend/requirements.txt`):
- FastAPI 0.104.1, Uvicorn 0.24.0
- SQLAlchemy 2.0.23, Alembic
- Google Generative AI 0.3.2
- python-jose, bcrypt, passlib
- Stripe, Razorpay, SlowAPI

**Frontend** (`frontend/package.json`):
- React 18, React Router
- Tailwind CSS, Framer Motion
- Axios

---

## 🚢 Production Notes

- Replace SQLite with PostgreSQL
- Set `DEBUG=False` in `.env`
- Run backend with Gunicorn: `gunicorn -w 4 main:app`
- Build frontend: `npm run build`
- Use HTTPS and restrict CORS origins

---

*AI Study Assistant — Built with FastAPI + React + Google Gemini*
