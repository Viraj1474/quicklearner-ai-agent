# AI Study Assistant - Quick Reference

## 🚀 Start Application (Windows)

```powershell
cd C:\ai-agent
.\start.ps1
```

**That's it!** Both backend and frontend will start in separate terminals.

---

## 🌐 Access Points

| What | URL | Status |
|------|-----|--------|
| Frontend | http://localhost:3000 | ✅ Ready |
| Backend | http://localhost:8000 | ✅ Ready |
| API Docs | http://localhost:8000/docs | ✅ Ready |
| Health | http://localhost:8000/health | ✅ Ready |

---

## 🔍 Common Commands

### Start Backend Only
```powershell
.\start-backend.ps1
```

### Start Frontend Only
```powershell
.\start-frontend.ps1
```

### Validate System
```powershell
.\test-setup.ps1
```

### Check Backend Health
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health"
```

### Test Chat API
```powershell
$body = @{ message = "Hello!" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/api/chat" `
  -Body $body -ContentType "application/json"
```

### Kill All Processes
```powershell
Get-Process -Name python, node -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 8000 in use | `Get-Process -Name python \| Stop-Process -Force` |
| Port 3000 in use | `Get-Process -Name node \| Stop-Process -Force` |
| Backend won't start | Check `.env` file exists in `backend/` folder |
| Frontend can't connect | Verify backend is running: `.\test-setup.ps1` |
| Chat returns error | Check Google API key in `backend/.env` |

---

## 📁 Key Files

```
C:\ai-agent\
├── start.ps1                    # Start everything
├── start-backend.ps1            # Backend only
├── start-frontend.ps1           # Frontend only
├── test-setup.ps1              # Validate system
├── README.md                    # Full documentation
├── COMPLETION_SUMMARY.md        # This session's work
│
├── backend/
│   ├── main.py                  # API server
│   ├── gemini_client.py         # AI integration
│   ├── database.py              # Database models
│   ├── run_backend.py           # Launcher
│   ├── .env                     # Configuration
│   └── venv/                    # Virtual environment
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ChatBot.jsx      # Chat UI
    │   │   └── services/
    │   │       └── aiService.js # API client
    │   └── App.jsx
    └── package.json
```

---

## 📊 Tech Stack

- **Frontend:** React + Tailwind + Framer Motion
- **Backend:** FastAPI + SQLAlchemy + SQLite
- **AI:** Google Gemini API
- **Platform:** Windows PowerShell + Python 3.13

---

## ✅ What's Working

- ✅ Chat with real AI responses
- ✅ Q&A functionality
- ✅ Flashcard generation
- ✅ Quiz creation
- ✅ Note highlighting
- ✅ Summary generation
- ✅ Analytics tracking
- ✅ New Chat button
- ✅ Dark mode
- ✅ Error handling
- ✅ API documentation

---

## 🎯 Next Session

To continue development:

1. Run `.\start.ps1` to verify everything still works
2. Make changes to `frontend/` or `backend/`
3. Frontend auto-reloads; backend needs restart
4. Check `README.md` for full development guide

---

**Status:** ✅ Production Ready  
**Last Updated:** November 13, 2025
