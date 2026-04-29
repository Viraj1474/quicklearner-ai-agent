# AI Study Assistant - Backend

A comprehensive FastAPI backend for the AI Study Assistant application, providing AI-powered study tools including chat, summarization, quiz generation, flashcards, and analytics.

## 🚀 Features

- **AI Chat Assistant**: Conversational AI for study help
- **Text Summarization**: Generate concise summaries of study material
- **Notes Highlighting**: Automatically identify and highlight key concepts
- **Quiz Generation**: Create custom quizzes from topics or study material
- **Flashcards**: Generate and manage flashcards with spaced repetition
- **Analytics**: Track study progress and productivity metrics
- **Database Persistence**: PostgreSQL/SQLite support for data storage

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL (optional, can use SQLite for development)
- Google Gemini API key

## 🔧 Installation

### 1. Clone the repository

```bash
cd c:\ai-agent\backend
```

### 2. Create a virtual environment

```bash
python -m venv venv

# Activate on Windows
.\venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Required: Get your API key from https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=your_actual_api_key_here

# Database (use SQLite for development)
DATABASE_URL=sqlite:///./ai_agent.db

# Or PostgreSQL for production
# DATABASE_URL=postgresql://user:password@localhost:5432/ai_agent_db

# CORS (adjust for your frontend URL)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

### 5. Initialize the database

```bash
python database.py
```

## 🏃‍♂️ Running the Server

### Development mode (with auto-reload)

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Chat
- `POST /api/chat` - Send a message and get AI response

#### Summarization
- `POST /api/summarize` - Generate text summary
- `GET /api/summaries` - Get user's summaries

#### Notes
- `POST /api/notes/highlight` - Highlight important concepts

#### Quiz
- `POST /api/quiz/generate` - Generate a quiz
- `GET /api/quizzes` - Get user's quizzes

#### Flashcards
- `POST /api/flashcards` - Create a flashcard
- `POST /api/flashcards/generate` - Auto-generate flashcards
- `GET /api/flashcards` - Get user's flashcards

#### Analytics
- `GET /api/analytics` - Get study statistics

## 🗄️ Database Schema

### Tables

1. **users** - User accounts
2. **chat_sessions** - Chat conversation sessions
3. **chat_messages** - Individual chat messages
4. **summaries** - Generated summaries
5. **quizzes** - Generated quizzes
6. **flashcards** - Flashcard deck storage
7. **analytics** - Study metrics and progress

## 🔒 Security Notes

⚠️ **Current Implementation**: This version uses a default user (user_id=1) for simplicity.

For production, implement:
- User authentication (JWT tokens)
- Password hashing (bcrypt)
- Rate limiting
- Input validation
- API key rotation
- HTTPS/TLS

## 🧪 Testing the API

### Using curl

```bash
# Health check
curl http://localhost:8000/health

# Chat
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Help me study quantum physics"}'

# Generate summary
curl -X POST http://localhost:8000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"text": "Your study material here..."}'

# Generate quiz
curl -X POST http://localhost:8000/api/quiz/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "Biology", "num_questions": 5, "difficulty": "medium"}'
```

### Using Python

```python
import requests

# Chat example
response = requests.post(
    "http://localhost:8000/api/chat",
    json={"message": "Explain photosynthesis"}
)
print(response.json())
```

## 📦 Project Structure

```
backend/
├── main.py              # FastAPI application and routes
├── gemini_client.py     # Google Gemini AI client
├── database.py          # SQLAlchemy models and DB setup
├── schemas.py           # Pydantic request/response models
├── config.py            # Configuration management
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
└── README.md           # This file
```

## 🐛 Troubleshooting

### Import errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Database errors
```bash
# Reset database
rm ai_agent.db  # If using SQLite
python database.py  # Reinitialize
```

### API key issues
- Ensure `GOOGLE_API_KEY` is set in `.env`
- Get a key from: https://makersuite.google.com/app/apikey
- Check API quota limits

### CORS errors
- Update `CORS_ORIGINS` in `.env` to match your frontend URL
- Verify frontend is running on the correct port

## 🚀 Deployment

### Using Docker (optional)

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t ai-study-backend .
docker run -p 8000:8000 --env-file .env ai-study-backend
```

### Cloud Platforms

- **Heroku**: Use Procfile with `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Railway**: Connect repo, add environment variables
- **Render**: Web Service with Python runtime
- **AWS/GCP/Azure**: Deploy with container services

## 🔄 Development Workflow

1. Make changes to code
2. Server auto-reloads (if running with `--reload`)
3. Test using `/docs` or curl
4. Check logs for errors
5. Commit changes

## 📝 License

MIT License - Feel free to use for your projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📧 Support

For issues or questions:
- Check the API docs at `/docs`
- Review error logs in terminal
- Verify environment variables

## 🎯 Future Enhancements

- [ ] User authentication & authorization
- [ ] Real-time websocket chat
- [ ] File upload support (PDFs, images)
- [ ] Advanced analytics dashboards
- [ ] Spaced repetition algorithm for flashcards
- [ ] Multi-language support
- [ ] Export/import functionality
- [ ] Collaborative study sessions

---

**Happy Studying! 📚✨**
