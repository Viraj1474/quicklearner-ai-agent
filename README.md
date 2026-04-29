# AI Study Assistant - Full Stack Project

A modern full-stack application combining **React** frontend, **FastAPI** backend, and **Google Gemini AI** integration for intelligent studying and note management.

## 🎯 Project Overview

**Frontend:** React app with Tailwind CSS and Framer Motion animations  
**Backend:** FastAPI with SQLAlchemy ORM and SQLite database  
**AI:** Google Gemini API for intelligent responses  
**Features:** Chat, Q&A, Notes Highlighting, Flashcard Generation, Quiz Generator, Summaries, Analytics

---

## ⚠️ Virtual Environment Note

There are two venvs in this project:
- `C:\ai-agent\.venv` — root-level venv (used by startup scripts as primary)
- `C:\ai-agent\backend\venv` — backend-specific venv (fallback)

**Use `C:\ai-agent\.venv` as the canonical environment.** The startup scripts already prefer it.
To reinstall dependencies into the correct venv:
```powershell
C:\ai-agent\.venv\Scripts\pip.exe install -r backend\requirements.txt
```

---



```
C:\ai-agent\
├── frontend/                 # React frontend (port 3000)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBot.jsx         # Main chat UI (async, real API)
│   │   │   ├── services/
│   │   │   │   └── aiService.js    # API client with error handling
│   │   │   └── ...
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
│
├── backend/                  # FastAPI backend (port 8000)
│   ├── main.py              # FastAPI app with ~15 endpoints
│   ├── gemini_client.py     # Gemini AI integration
│   ├── database.py          # SQLAlchemy ORM models
│   ├── config.py            # Configuration management
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── run_backend.py       # Robust Windows launcher (NEW)
│   ├── server.py            # Alternative launcher
│   ├── requirements.txt     # Python dependencies
│   ├── venv/                # Python virtual environment
│   ├── .env                 # Environment variables (API keys, etc.)
│   └── ai_agent.db          # SQLite database
│
├── start-backend.ps1        # PowerShell: Start backend (NEW)
├── start-frontend.ps1       # PowerShell: Start frontend (NEW)
├── start.ps1                # PowerShell: Start both servers (NEW)
└── README.md                # This file
```

---

## 🚀 Quick Start (Windows PowerShell)

### Option 1: Start Everything at Once (Recommended)

Open PowerShell and run:

```powershell
cd C:\ai-agent
.\start.ps1
```

This will:
- Kill any existing processes on ports 8000 (backend) and 3000 (frontend)
- Start the backend server in a new terminal
- Start the frontend server in a new terminal
- Display URLs for access

### Option 2: Start Backend and Frontend Separately

**Terminal 1 - Backend:**
```powershell
cd C:\ai-agent
.\start-backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
cd C:\ai-agent
.\start-frontend.ps1
```

### Option 3: Manual Command-Line Start

**Backend:**
```powershell
cd C:\ai-agent\backend
.\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload=False --log-level info
```

**Frontend:**
```powershell
cd C:\ai-agent\frontend
npm start
```

---

## 🌐 Access the Application

After starting both servers:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | React UI (Chat, Q&A, Flashcards, etc.) |
| **Backend** | http://localhost:8000 | FastAPI server |
| **API Docs** | http://localhost:8000/docs | Interactive Swagger UI |
| **Health Check** | http://localhost:8000/health | Backend status |

---

## 🔧 Testing the API

### Health Check
```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:8000/health"
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T12:34:56.789000",
  "api_version": "1.0.0"
}
```

### Send a Chat Message
```powershell
$body = @{
    message = "What is artificial intelligence?"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8000/api/chat" `
  -Body $body `
  -ContentType "application/json"
```

Expected response:
```json
{
  "message": "Artificial intelligence (AI) is...",
  "session_id": "xyz...",
  "timestamp": "2025-11-13T12:34:56..."
}
```

---

## ⚙️ Configuration

### Backend Configuration

Edit `backend/.env` to customize settings:

```env
# Google Gemini API
GOOGLE_API_KEY=your_key_here

# Database
DATABASE_URL=sqlite:///./ai_agent.db

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True

# CORS
CORS_ORIGINS=http://localhost:3000
```

### Frontend Configuration

The frontend automatically connects to `http://localhost:8000` (or `REACT_APP_API_URL` env var).

---

## 🛠️ What We've Done

### ✅ Frontend (Completed)
- [x] React UI with chat, Q&A, flashcards, quizzes, notes highlighter, summaries, analytics
- [x] Replaced mock AI responses with real backend API calls
- [x] Added "New Chat" button to start fresh conversations
- [x] Proper async/await handling and error messages
- [x] Tailwind CSS styling with dark mode support
- [x] Framer Motion animations

### ✅ Backend (Completed)
- [x] FastAPI with ~15 endpoints
- [x] SQLAlchemy ORM with 7 database tables
- [x] Google Gemini AI integration (using correct model: `models/gemini-pro-latest`)
- [x] CORS configured for frontend
- [x] Pydantic request/response validation
- [x] Error handling and logging

### ✅ Stability & Startup (NEW - This Session)
- [x] Created robust `run_backend.py` launcher for Windows
- [x] Created PowerShell startup scripts (`start-backend.ps1`, `start-frontend.ps1`, `start.ps1`)
- [x] Fixed backend startup issues
- [x] Added comprehensive error handling and logging
- [x] Added health check endpoint

---

## 🐛 Troubleshooting

### Backend won't start

1. **Check if port 8000 is in use:**
   ```powershell
   Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
   ```

2. **Kill existing Python processes:**
   ```powershell
   Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

3. **Check virtual environment:**
   ```powershell
   cd C:\ai-agent\backend
   .\venv\Scripts\python.exe --version
   ```

4. **Reinstall dependencies:**
   ```powershell
   cd C:\ai-agent\backend
   .\venv\Scripts\pip.exe install -r requirements.txt
   ```

### Frontend won't connect to backend

1. **Verify backend is running:**
   ```powershell
   Invoke-RestMethod -Method Get -Uri "http://localhost:8000/health"
   ```

2. **Check browser console** (F12) for API errors

3. **Verify CORS settings** in `backend/.env`:
   ```
   CORS_ORIGINS=http://localhost:3000
   ```

4. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete` in browser
   - Check "Cookies and other site data"
   - Click "Clear data"

### Gemini API errors

1. **Verify API key** in `backend/.env` is correct

2. **Check available models:**
   ```powershell
   cd C:\ai-agent\backend
   .\venv\Scripts\python.exe -c "import google.generativeai as genai; genai.configure(api_key='YOUR_KEY'); print([m.name for m in genai.list_models()])"
   ```

3. **Current working model:** `models/gemini-pro-latest`

---

## 📊 API Endpoints

### Chat
- **POST** `/api/chat` - Send a message and get AI response
  ```json
  {
    "message": "What is machine learning?",
    "session_id": "optional-session-id"
  }
  ```

### Summarization
- **POST** `/api/summarize` - Generate summary of text
- **GET** `/api/summaries` - Retrieve saved summaries

### Flashcards
- **POST** `/api/flashcards/generate` - Generate flashcards from text
- **GET** `/api/flashcards` - Get all flashcards
- **POST** `/api/flashcards` - Create flashcard

### Quiz
- **POST** `/api/quiz/generate` - Generate quiz from text
- **GET** `/api/quizzes` - Get all quizzes

### Notes
- **POST** `/api/notes/highlight` - Highlight important parts of notes

### Analytics
- **GET** `/api/analytics` - Get user analytics

### Health
- **GET** `/health` - Server health check

---

## 📝 Development Tips

### Viewing Backend Logs

The backend launcher (`run_backend.py`) logs all activity. Check the terminal where the backend is running.

### Hot Reload (Frontend)

The React frontend automatically reloads when you edit files. Just save and refresh the browser.

### Backend Manual Restart

If you need to restart the backend manually:
```powershell
Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
# Then start it again
```

### Database Reset

To reset the SQLite database:
```powershell
cd C:\ai-agent\backend
Remove-Item ai_agent.db -ErrorAction SilentlyContinue
# Database will be recreated on next backend start
```

---

## 📦 Dependencies

### Frontend
- React 18+
- Tailwind CSS
- Framer Motion
- Axios / Fetch API

### Backend
- FastAPI 0.104.1
- Uvicorn 0.24.0
- SQLAlchemy 2.0.23
- Google Generative AI 0.3.2
- Python 3.13+

See `frontend/package.json` and `backend/requirements.txt` for full lists.

---

## 🔐 Security Notes

- **API Keys:** Never commit `.env` to version control
- **CORS:** Currently allows `http://localhost:3000` only (development)
- **Database:** SQLite is for development; use PostgreSQL for production
- **Authentication:** Optional (add JWT/sessions as needed)

---

## 🚢 Production Deployment

For production deployment:

1. **Backend:**
   - Use PostgreSQL instead of SQLite
   - Run with Gunicorn: `gunicorn -w 4 main:app`
   - Set `DEBUG=False` in `.env`
   - Use HTTPS and proper CORS settings

2. **Frontend:**
   - Build: `npm run build`
   - Serve static files from backend or Nginx
   - Set `REACT_APP_API_URL` to production backend URL

3. **Database:**
   - Migrate to PostgreSQL or cloud database
   - Set up automated backups
   - Configure connection pooling

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review backend logs (terminal output)
3. Check browser console (F12)
4. Verify all environment variables in `.env`
5. Ensure ports 3000 and 8000 are available

---

## 📄 License

[Your License Here]

---

## 👨‍💻 Authors

AI Study Assistant Development Team

---

**Last Updated:** November 13, 2025  
**Status:** ✅ Full Stack Ready for Testing
