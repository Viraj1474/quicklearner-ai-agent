# Backend Stability Improvements - Verification Checklist

**Use this checklist to verify all improvements are working correctly.**

---

## ✅ Pre-Deployment Verification

### 1. Code Quality Check
- [ ] Run syntax check on gemini_wrapper.py
  ```bash
  python -m py_compile backend/gemini_wrapper.py
  # Expected: No errors
  ```

- [ ] Run syntax check on config.py
  ```bash
  python -m py_compile backend/config.py
  # Expected: No errors
  ```

- [ ] Run syntax check on main.py
  ```bash
  python -m py_compile backend/main.py
  # Expected: No errors
  ```

### 2. Import Verification
- [ ] Check imports in main.py work
  ```bash
  cd backend
  python -c "from main import app; print('✓ Imports OK')"
  # Expected: ✓ Imports OK
  ```

- [ ] Check gemini_wrapper imports
  ```bash
  python -c "from gemini_wrapper import gemini_wrapper; print('✓ Wrapper OK')"
  # Expected: ✓ Wrapper OK
  ```

### 3. Database Check
- [ ] Database file exists
  ```bash
  ls -la backend/ai_agent.db
  # Expected: File exists and readable
  ```

- [ ] Database is initialized
  ```bash
  python backend/database.py
  # Expected: No errors
  ```

---

## 🚀 Runtime Verification

### Start the Backend
```bash
cd backend
python server.py
# OR
uvicorn main:app --host 0.0.0.0 --port 8000 --reload=False
```

**Expected Output:**
```
======================================================================
✓ Server started successfully!
✓ Running on 0.0.0.0:8000
✓ Gemini timeout: 18s
✓ Application is ready to handle requests
======================================================================
```

### 1. Health Check Verification
- [ ] Health endpoint responds
  ```bash
  curl http://localhost:8000/health
  ```
  
  **Expected Response (200 OK):**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-01-07T14:23:45.123456",
    "api_version": "1.0.0",
    "database": "healthy",
    "service": "backend"
  }
  ```

- [ ] Health endpoint works WITHOUT Gemini API
  - Even if GOOGLE_API_KEY is wrong/missing
  - Should still return database status

### 2. Input Validation Verification

#### Chat Endpoint - Empty Message
- [ ] Test empty message
  ```bash
  curl -X POST http://localhost:8000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": ""}'
  ```
  
  **Expected (400 Bad Request):**
  ```json
  {"detail": "Message cannot be empty"}
  ```

#### Chat Endpoint - Too Long
- [ ] Test message > 5000 chars
  ```bash
  # Generate long message (6000 chars)
  LONG_MSG=$(python -c "print('x' * 6000)")
  curl -X POST http://localhost:8000/api/chat \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"$LONG_MSG\"}"
  ```
  
  **Expected (400 Bad Request):**
  ```json
  {"detail": "Message exceeds maximum length of 5000 characters"}
  ```

#### Summarize Endpoint - Empty Text
- [ ] Test empty text
  ```bash
  curl -X POST http://localhost:8000/api/summarize \
    -H "Content-Type: application/json" \
    -d '{"text": ""}'
  ```
  
  **Expected (400 Bad Request):**
  ```json
  {"detail": "Text cannot be empty"}
  ```

#### Quiz Endpoint - Invalid Questions Count
- [ ] Test invalid question count
  ```bash
  curl -X POST http://localhost:8000/api/quiz/generate \
    -H "Content-Type: application/json" \
    -d '{"topic": "Biology", "num_questions": 100}'
  ```
  
  **Expected (400 Bad Request):**
  ```json
  {"detail": "Number of questions must be between 1 and 50"}
  ```

#### Flashcards Endpoint - Invalid Card Count
- [ ] Test invalid card count
  ```bash
  curl -X POST http://localhost:8000/api/flashcards/generate \
    -H "Content-Type: application/json" \
    -d '{"text": "Study material here", "num_cards": 100}'
  ```
  
  **Expected (400 Bad Request):**
  ```json
  {"detail": "Number of cards must be between 1 and 50"}
  ```

### 3. Logging Verification

- [ ] Check console output for logging
  - Look for: `✓ AI Request: ...`
  - Look for: `✓ AI Response: ...`
  - Look for: `✗ Error: ...`

- [ ] Check backend.log file created
  ```bash
  ls -la backend/backend.log
  # Expected: File exists
  ```

- [ ] Check log format
  ```bash
  tail -10 backend/backend.log
  
  # Expected format:
  # 2026-01-07 14:23:45 - logger_name - LEVEL - message
  ```

- [ ] Check logs are being written
  ```bash
  # Make a request in another terminal
  curl http://localhost:8000/health
  
  # Check logs
  tail -5 backend/backend.log
  # Expected: New entries appear
  ```

### 4. Valid Request Verification

#### Chat with Valid Input
- [ ] Test valid chat
  ```bash
  curl -X POST http://localhost:8000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello, help me study!"}'
  ```
  
  **Expected (200 OK or 503 if API slow):**
  - If API responds: Response with AI message
  - If API timeout: 503 with "AI service took too long"
  - Check backend.log for request/response logging

#### Summarize with Valid Input
- [ ] Test valid summarization
  ```bash
  curl -X POST http://localhost:8000/api/summarize \
    -H "Content-Type: application/json" \
    -d '{"text": "This is a sample text about photosynthesis. Photosynthesis is the process by which plants convert light into chemical energy."}'
  ```
  
  **Expected (200 OK or 503 if API slow):**
  - Response with summary or timeout error
  - Check backend.log

### 5. Error Handling Verification

#### Test Timeout Handling
- [ ] Verify timeout catches errors gracefully
  - If Gemini API is slow (>18s): Should get 503
  - No hanging requests
  - Clear error message

#### Test Graceful Degradation
- [ ] Make several requests in succession
  - Backend should handle all without crashing
  - Each gets logged
  - Health endpoint still responds

---

## 📋 Configuration Verification

- [ ] Check config.py has all new settings
  ```bash
  grep -n "GEMINI_TIMEOUT_SECONDS\|MAX_CHAT_MESSAGE_LENGTH\|LOG_LEVEL" backend/config.py
  
  # Expected: All found
  ```

- [ ] Check environment variables (if .env exists)
  ```bash
  grep "GEMINI_TIMEOUT_SECONDS" backend/.env
  # If not set, should use defaults
  ```

---

## 🔍 File Structure Verification

- [ ] New files exist and readable
  ```bash
  ls -la backend/gemini_wrapper.py
  ls -la backend/STABILITY_IMPROVEMENTS.md
  ls -la backend/IMPROVEMENTS_QUICK_REFERENCE.md
  ls -la backend/IMPLEMENTATION_SUMMARY.md
  
  # Expected: All files exist
  ```

- [ ] Check file sizes are reasonable
  ```bash
  wc -l backend/gemini_wrapper.py backend/main.py
  
  # Expected:
  # gemini_wrapper.py: ~227 lines
  # main.py: ~730 lines
  ```

---

## 🚨 Error Scenario Testing

### Test API Key Missing
- [ ] Remove GOOGLE_API_KEY from .env
- [ ] Try making chat request
  ```bash
  curl -X POST http://localhost:8000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello"}'
  ```
  
  **Expected:**
  - HTTP 500 with friendly error message
  - Log entry showing "API key not configured"
  - Health endpoint still works

### Test Invalid API Key
- [ ] Set GOOGLE_API_KEY to "invalid"
- [ ] Try making chat request
  
  **Expected:**
  - HTTP 500 with friendly error message
  - No stack trace exposed
  - Clear guidance in error

### Test Network Disconnected
- [ ] Disconnect internet (or mock)
- [ ] Try making chat request
  
  **Expected:**
  - HTTP 503 with network error message
  - Not HTTP 500
  - Clear to user about network

---

## 📊 Performance Verification

- [ ] Response times are reasonable
  ```bash
  # Time a valid chat request
  time curl -X POST http://localhost:8000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello"}'
  
  # Should complete in <20 seconds (18s timeout + overhead)
  ```

- [ ] Validation is fast (<100ms)
  ```bash
  # Time an invalid request (should fail fast)
  time curl -X POST http://localhost:8000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": ""}'
  
  # Should complete in <100ms (no API call made)
  ```

---

## 🔒 Security Verification

- [ ] Input validation prevents abuse
  ```bash
  # Try to send huge message (should fail immediately)
  curl -X POST http://localhost:8000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "'$(python -c "print('a' * 100000)")'}'
  
  # Should get 400 immediately, not hang
  ```

- [ ] No stack traces exposed
  - Make various error requests
  - Check responses never show Python exceptions
  - Always show user-friendly messages

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] All syntax checks pass
- [ ] All endpoints respond correctly
- [ ] Logging is working
- [ ] Health endpoint works
- [ ] Input validation catches oversized inputs
- [ ] Error messages are user-friendly
- [ ] Timeout protection works
- [ ] No new dependencies needed
- [ ] SQLite compatibility verified
- [ ] Frontend still works with backend

---

## 📝 Sign-Off

- [ ] All checklist items verified
- [ ] No blockers found
- [ ] Ready for production deployment

**Date Verified:** _______________  
**Verified By:** _______________  
**Notes:** _______________

---

## 🆘 If Something Fails

### Check These First:

1. **Backend won't start?**
   ```bash
   python -m py_compile backend/main.py
   python -c "from main import app"
   # Check for import errors
   ```

2. **Health endpoint fails?**
   ```bash
   # Check database
   ls -la backend/ai_agent.db
   python backend/database.py
   ```

3. **Logging missing?**
   ```bash
   # Check backend.log writable
   touch backend/backend.log
   # Check LOG_LEVEL setting
   grep LOG_LEVEL backend/config.py
   ```

4. **API returns 500 always?**
   ```bash
   # Check API key
   echo $GOOGLE_API_KEY
   # Check logs
   tail -20 backend/backend.log
   ```

5. **Validation not working?**
   ```bash
   # Check config constants
   grep MAX_ backend/config.py
   # Test with simple invalid request
   curl -X POST http://localhost:8000/api/chat -H "Content-Type: application/json" -d '{"message": ""}'
   ```

---

## 📞 Support

For detailed information, check:
1. `backend/STABILITY_IMPROVEMENTS.md` - Technical details
2. `backend/IMPROVEMENTS_QUICK_REFERENCE.md` - FAQ
3. `backend/IMPLEMENTATION_SUMMARY.md` - Overview
4. `backend/gemini_wrapper.py` - Source code
