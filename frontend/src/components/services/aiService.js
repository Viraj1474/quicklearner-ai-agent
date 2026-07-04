import { authFetch } from './authService';

// AI Service - Connects frontend to FastAPI backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const isDevelopment = process.env.NODE_ENV === 'development';
const devLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

// Only use fallback for transport failures; backend provider errors should surface.
const USE_FALLBACK_ON_ERROR = true;

// Timeout for API requests (in milliseconds) - longer for complex AI queries
const API_TIMEOUT_MS = 90000; // 90 seconds

// Helper function for API calls with optional fallback
const apiCall = async (endpoint, method = 'GET', body = null, fallbackFn = null) => {
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    devLog(`[API REQUEST] ${method} ${fullUrl}`, body ? { hasBody: true, keys: Object.keys(body) } : {});
    const data = await authFetch(endpoint, options);
    clearTimeout(timeoutId);
    devLog(`[API RESPONSE] ${method} ${fullUrl}`, data && typeof data === 'object' ? { keys: Object.keys(data) } : { type: typeof data });
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle timeout/abort errors specifically
    if (error.name === 'AbortError') {
      console.error(`API Timeout [${fullUrl}]: Request took longer than ${API_TIMEOUT_MS/1000}s`);
      if (USE_FALLBACK_ON_ERROR && fallbackFn) {
        console.warn(`API timeout, using fallback for ${fullUrl}`);
        return fallbackFn(body);
      }
      throw new Error('The request took too long to complete. Please try again with a shorter query.');
    }
    
    console.error(`API Error [${method} ${fullUrl}]:`, {
      message: error.message,
      status: error.status,
      detail: error.detail,
      endpoint,
    });

    // Do not mask backend/provider failures with demo content.
    // Let the real error propagate so the backend fallback path can be diagnosed.
    throw error;
  }
};

const readSSEStream = async (response, onChunk) => {
  if (!response.body) {
    throw new Error('Streaming response body is unavailable');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalMessage = '';
  let sessionId = null;
  let timestamp = null;

  const processBlock = (block) => {
    const lines = block.split('\n');
    let eventName = 'chunk';
    let dataLine = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLine += line.slice(5).trim();
      }
    }

    if (!dataLine) {
      return;
    }

    const payload = JSON.parse(dataLine);
    if (eventName === 'meta') {
      sessionId = payload.session_id ?? sessionId;
      timestamp = payload.timestamp ?? timestamp;
      return;
    }

    if (eventName === 'chunk') {
      finalMessage += payload.content || '';
      onChunk?.(finalMessage, payload);
      return;
    }

    if (eventName === 'done') {
      finalMessage = payload.message || finalMessage;
      sessionId = payload.session_id ?? sessionId;
      timestamp = payload.timestamp ?? timestamp;
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    let boundaryIndex = buffer.indexOf('\n\n');
    while (boundaryIndex !== -1) {
      const block = buffer.slice(0, boundaryIndex).trim();
      buffer = buffer.slice(boundaryIndex + 2);
      if (block) {
        processBlock(block);
      }
      boundaryIndex = buffer.indexOf('\n\n');
    }
  }

  const tail = buffer.trim();
  if (tail) {
    processBlock(tail);
  }

  return {
    message: finalMessage,
    session_id: sessionId,
    timestamp: timestamp || new Date().toISOString(),
  };
};

// === Chat Functions ===
export const sendChatMessage = async (message, sessionId = null, onChunk = null, attachments = []) => {
  devLog('Sending chat message:', { length: message.length, sessionId });
  
  // Fallback for when API is unavailable - provides contextual demo responses
  const fallback = (body) => {
    const msg = body.message.toLowerCase();
    let demoResponse = '';
    
    // Provide contextual responses based on message type
    if (msg.includes('summarize') || msg.includes('summary')) {
      demoResponse = `📋 **Demo Summary**

Here's how I would summarize your content:

1. **Main Topic**: The key subject of your notes
2. **Key Points**: Important concepts and ideas
3. **Supporting Details**: Examples and evidence
4. **Conclusion**: Final takeaways

*Note: This is a demo response. The AI service is temporarily unavailable due to API limits.*`;
    } else if (msg.includes('quiz') || msg.includes('test')) {
      demoResponse = `📝 **Demo Quiz Preview**

I can generate quizzes with questions like:
- Multiple choice questions
- True/False questions  
- Short answer questions

*Note: This is a demo response. Use the Quiz Generator tab for full functionality.*`;
    } else if (msg.includes('flashcard')) {
      demoResponse = `🎴 **Demo Flashcards Preview**

I can create flashcards with:
- Front: Key terms and questions
- Back: Definitions and answers

*Note: This is a demo response. Use the Flashcards tab for full functionality.*`;
    } else if (msg.includes('hello') || msg.includes('hi')) {
      demoResponse = `👋 Hello! I'm the AI Study Assistant.

I can help you with:
• **Summarize** - Condense your notes
• **Quiz** - Generate practice questions
• **Flashcards** - Create study cards
• **Highlight** - Find key concepts

*Note: Running in demo mode due to API limits.*`;
    } else if (msg.includes('roadmap') || msg.includes('learning path') || msg.includes('how to learn')) {
      demoResponse = `🗺️ **AI/ML Learning Roadmap**

Here's a structured path to learn AI and Machine Learning:

### 📚 Phase 1: Foundations (2-3 months)
- **Mathematics**: Linear Algebra, Calculus, Statistics & Probability
- **Programming**: Python (NumPy, Pandas, Matplotlib)
- **Tools**: Jupyter Notebooks, Git, VS Code

### 🧠 Phase 2: Machine Learning Basics (2-3 months)
- **Core Concepts**: Supervised vs Unsupervised Learning
- **Algorithms**: Linear/Logistic Regression, Decision Trees, SVM, K-means
- **Libraries**: Scikit-learn
- **Practice**: Kaggle beginner competitions

### 🔥 Phase 3: Deep Learning (3-4 months)
- **Neural Networks**: Perceptrons, Backpropagation, Activation Functions
- **Frameworks**: TensorFlow or PyTorch
- **Architectures**: CNNs, RNNs, Transformers
- **Projects**: Image classification, NLP tasks

### 🚀 Phase 4: Specialization (3+ months)
Choose one or more:
- **Computer Vision**: Object detection, segmentation
- **NLP**: LLMs, RAG, chatbots
- **Reinforcement Learning**: Game AI, robotics
- **MLOps**: Model deployment, monitoring

### 📖 Recommended Resources
- Courses: Andrew Ng's ML/DL courses, Fast.ai
- Books: "Hands-On ML" by Géron, "Deep Learning" by Goodfellow
- Practice: Kaggle, LeetCode (ML problems)

*Note: This is a demo response. The full AI service will provide personalized guidance.*`;
    } else {
      demoResponse = `🤖 **Demo Mode Response**

I received your message: "${body.message}"

I'm currently running in demo mode because the AI service is temporarily unavailable (API quota exceeded).

**What I can normally do:**
- Answer questions about your study material
- Summarize notes and text
- Generate quizzes and flashcards
- Highlight important concepts

*Try again later or check the API quota status.*`;
    }
    
    return {
      message: demoResponse,
      session_id: body.session_id || 1,
      timestamp: new Date().toISOString()
    };
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const accessToken = localStorage.getItem('access_token');

    // If attachments are present, use multipart/form-data via FormData
    let response;
    if (attachments && attachments.length > 0) {
      const form = new FormData();
      form.append('message', message || '');
      if (sessionId) form.append('session_id', String(sessionId));
      attachments.forEach((file, idx) => {
        // name files 'files' to allow backend to receive a list
        form.append('files', file, file.name || `file_${idx}`);
      });

      const headers = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      devLog('[API REQUEST] POST /api/chat (multipart)', { files: attachments.length });

      response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: form,
        signal: controller.signal,
      });
    } else {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      devLog('[API REQUEST] POST /api/chat', { hasBody: true, keys: ['message', 'session_id'] });

      response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, session_id: sessionId }),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch (_) {
        errorData = null;
      }
      const error = new Error((errorData && errorData.detail) || `Request failed (${response.status})`);
      error.status = response.status;
      error.detail = errorData && errorData.detail ? errorData.detail : null;
      error.endpoint = '/api/chat';
      throw error;
    }

    const result = await readSSEStream(response, onChunk);
    devLog('[API RESPONSE] POST /api/chat', { keys: Object.keys(result) });
    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError' || error.name === 'TypeError') {
      if (USE_FALLBACK_ON_ERROR) {
        return fallback({ message, session_id: sessionId });
      }
      throw new Error('The request took too long to complete. Please try again with a shorter query.');
    }

    throw error;
  }
};

// === Flashcard Functions ===
export const generateAnswer = async (question) => {
  devLog('AI is generating an answer for:', { length: question.length });
  // Use chat endpoint for Q&A
  const response = await sendChatMessage(`Provide a detailed answer for this question: ${question}`);
  return response.message;
};

export const createFlashcard = async (front, back, deckName = 'Default') => {
  devLog('Creating flashcard:', { frontLength: front.length, deckName });
  const response = await apiCall('/api/flashcards', 'POST', {
    front,
    back,
    deck_name: deckName
  });
  return response;
};

export const generateFlashcards = async (text, numCards = 10, deckName = 'Generated') => {
  devLog('Generating flashcards from text...', { textLength: text.length, numCards, deckName });
  
  // Fallback: extract key terms from text
  const fallback = (body) => {
    const sentences = body.text.split(/[.!?]/).filter(s => s.trim().length > 10);
    const cards = sentences.slice(0, Math.min(body.num_cards, 5)).map((s, i) => ({
      id: i + 1,
      front: `Key Point ${i + 1}`,
      back: s.trim(),
      deck_name: body.deck_name
    }));
    console.warn('[DEMO MODE] Using fallback flashcards');
    return cards;
  };
  
  const response = await apiCall('/api/flashcards/generate', 'POST', {
    text,
    num_cards: numCards,
    deck_name: deckName
  }, fallback);
  return response;
};

export const getFlashcards = async (deckName = null) => {
  const endpoint = deckName 
    ? `/api/flashcards?deck_name=${encodeURIComponent(deckName)}`
    : '/api/flashcards';
  return await apiCall(endpoint);
};

// === Summary Functions ===
export const generateSummary = async (text, title = null) => {
  devLog('AI is generating a summary...', { textLength: text.length, title });
  
  // Fallback: create a simple extractive summary
  const fallback = (body) => {
    const sentences = body.text.split(/[.!?]/).filter(s => s.trim().length > 20);
    const summary = sentences.slice(0, 3).join('. ') + '.';
    console.warn('[DEMO MODE] Using fallback summary');
    return { summary: `[DEMO MODE - API quota exceeded]\n\n${summary}\n\n(This is an extractive preview. Full AI summaries require API quota.)` };
  };
  
  const response = await apiCall('/api/summarize', 'POST', {
    text,
    title
  }, fallback);
  return response.summary;
};

export const getSummaries = async (skip = 0, limit = 10) => {
  return await apiCall(`/api/summaries?skip=${skip}&limit=${limit}`);
};

// === Advanced Summary Functions ===
export const generateSummaryAdvanced = async (text, options = {}) => {
  const {
    style = 'extractive',
    length = 'medium',
    with_keywords = true,
    with_outline = false,
    with_takeaways = false,
    preserve_citations = false,
    target_audience = 'general'
  } = options;

  devLog('AI is generating advanced summary...', { style, length, textLength: text.length });
  
  // Advanced fallback with multiple summary styles
  const fallback = (body) => {
    const sentences = body.text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const words = body.text.split(/\s+/);
    const wordCount = words.length;
    
    // Calculate target sentences based on length
    const lengthTargets = {
      brief: 0.15,
      short: 0.25,
      medium: 0.40,
      long: 0.60,
      detailed: 0.75
    };
    const targetRatio = lengthTargets[body.length] || 0.40;
    const targetSentences = Math.max(2, Math.ceil(sentences.length * targetRatio));
    
    // Generate summary based on style
    let summary = '';
    const selectedSentences = sentences.slice(0, targetSentences);
    
    switch (body.style) {
      case 'bullet_points':
        summary = selectedSentences.map(s => `• ${s.trim()}`).join('\n');
        break;
      case 'outline':
        summary = `I. Main Points\n${selectedSentences.slice(0, 2).map((s, i) => `   ${String.fromCharCode(65 + i)}. ${s.trim()}`).join('\n')}\n\nII. Details\n${selectedSentences.slice(2).map((s, i) => `   ${String.fromCharCode(65 + i)}. ${s.trim()}`).join('\n')}`;
        break;
      case 'cornell':
        const cues = selectedSentences.slice(0, 2).map(s => s.trim().split(' ').slice(0, 3).join(' '));
        summary = `**Cues:**\n${cues.map(c => `• ${c}...`).join('\n')}\n\n**Notes:**\n${selectedSentences.map(s => `${s.trim()}.`).join(' ')}\n\n**Summary:**\n${selectedSentences[0]?.trim() || 'Key points extracted above.'}.`;
        break;
      case 'eli5':
        summary = `In simple terms: ${selectedSentences.slice(0, 2).map(s => s.trim()).join('. ')}.`;
        break;
      case 'academic':
        summary = `**Abstract:**\n${selectedSentences.slice(0, 2).map(s => s.trim()).join('. ')}.\n\n**Key Findings:**\n${selectedSentences.slice(2, 4).map(s => `• ${s.trim()}`).join('\n') || '• Analysis based on provided text.'}`;
        break;
      case 'key_takeaways':
        summary = `**Key Takeaways:**\n${selectedSentences.slice(0, 5).map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')}`;
        break;
      case 'abstractive':
        summary = `This text discusses: ${selectedSentences.slice(0, 3).map(s => s.trim()).join('. ')}.`;
        break;
      default: // extractive
        summary = selectedSentences.map(s => `${s.trim()}.`).join(' ');
    }
    
    // Extract keywords (simple word frequency)
    const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'any', 'this', 'that', 'these', 'those', 'it', 'its']);
    const wordFreq = {};
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      if (clean.length > 3 && !stopwords.has(clean)) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    });
    const sortedWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]);
    const keywords = sortedWords.slice(0, 10).map(([word, count]) => ({
      word,
      score: Math.min(1.0, count / 5),
      category: 'auto'
    }));
    
    // Extract topics
    const topics = sortedWords.slice(0, 5).map(([word]) => word);
    
    // Calculate basic readability (simplified Flesch-Kincaid)
    const syllableCount = words.reduce((acc, w) => acc + Math.max(1, (w.match(/[aeiouy]+/gi) || []).length), 0);
    const avgSyllables = syllableCount / Math.max(1, wordCount);
    const avgWordLength = words.join('').length / Math.max(1, wordCount);
    const fleschScore = Math.max(0, Math.min(100, 206.835 - (1.015 * (wordCount / sentences.length)) - (84.6 * avgSyllables)));
    
    // Count sentences
    const sentence_count = {
      original: sentences.length,
      summary: selectedSentences.length
    };
    
    console.warn('[DEMO MODE] Using fallback advanced summary');
    
    return {
      summary: `[DEMO MODE - API quota exceeded]\n\n${summary}`,
      style: body.style,
      length: body.length,
      original_word_count: wordCount,
      word_count: summary.split(/\s+/).length,
      reduction_percent: Math.round((1 - (summary.split(/\s+/).length / wordCount)) * 100),
      keywords: body.with_keywords ? keywords : [],
      topics: topics,
      takeaways: body.with_takeaways ? selectedSentences.slice(0, 3).map((s, i) => ({
        text: s.trim(),
        importance: i === 0 ? 'critical' : 'important'
      })) : [],
      outline: body.with_outline ? [{
        title: 'Main Section',
        points: selectedSentences.slice(0, 3).map(s => s.trim())
      }] : [],
      readability: {
        flesch_score: Math.round(fleschScore),
        grade_level: Math.round(0.39 * (wordCount / sentences.length) + 11.8 * avgSyllables - 15.59),
        reading_ease: fleschScore > 80 ? 'Very Easy' : fleschScore > 60 ? 'Easy' : fleschScore > 40 ? 'Moderate' : 'Difficult',
        avg_sentence_length: Math.round(wordCount / sentences.length),
        avg_word_length: avgWordLength.toFixed(1)
      },
      sentence_count,
      quality_score: 0.75,
      citations: [],
      original_readability: {
        flesch_score: Math.round(fleschScore),
        grade_level: Math.round(0.39 * (wordCount / sentences.length) + 11.8 * avgSyllables - 15.59),
        reading_ease: fleschScore > 80 ? 'Very Easy' : fleschScore > 60 ? 'Easy' : fleschScore > 40 ? 'Moderate' : 'Difficult',
        avg_sentence_length: Math.round(wordCount / sentences.length),
        avg_word_length: avgWordLength.toFixed(1)
      }
    };
  };
  
  return await apiCall('/api/summarize/advanced', 'POST', {
    text,
    style,
    length,
    with_keywords,
    with_outline,
    with_takeaways,
    preserve_citations,
    target_audience
  }, fallback);
};

// === Notes Highlighting Functions ===
export const generateHighlights = async (text) => {
  devLog('AI is highlighting text...', { textLength: text.length });
  
  // Fallback: extract sentences that look important
  const fallback = (body) => {
    const sentences = body.text.split(/[.!?]/).filter(s => s.trim().length > 15);
    const highlights = sentences.slice(0, 5).map((s, i) => ({
      text: s.trim(),
      importance: i === 0 ? 'high' : 'medium'
    }));
    const words = body.text.split(/\s+/).filter(w => w.length > 6);
    const concepts = [...new Set(words.slice(0, 5))];
    console.warn('[DEMO MODE] Using fallback highlights');
    return {
      highlights,
      key_concepts: concepts,
      summary: `[DEMO MODE] First ${highlights.length} key sentences extracted.`
    };
  };
  
  const response = await apiCall('/api/notes/highlight', 'POST', { text }, fallback);
  
  // Format highlights for display
  const highlightText = response.highlights
    .map(h => `[${h.importance.toUpperCase()}] ${h.text}`)
    .join('\n');
  
  return `**Key Highlights:**\n${highlightText}\n\n**Key Concepts:**\n${response.key_concepts.join(', ')}\n\n**Summary:**\n${response.summary}`;
};

// === Advanced Notes Highlighting ===
export const generateHighlightsAdvanced = async (text, categories = null) => {
  devLog('AI is performing advanced highlighting...', { textLength: text.length, categoryCount: categories?.length || 0 });
  
  // Fallback: extract sentences with category detection
  const fallback = (body) => {
    const sentences = body.text.split(/[.!?]/).filter(s => s.trim().length > 15);
    const categoryKeywords = {
      concepts: ['is', 'defines', 'refers to', 'called', 'represents'],
      definitions: ['means', 'defined as', 'definition', 'is the'],
      examples: ['for example', 'such as', 'e.g.', 'like', 'for instance'],
      important: ['important', 'crucial', 'essential', 'key', 'critical'],
      steps: ['first', 'second', 'then', 'next', 'finally', 'step'],
      formulas: ['=', 'formula', 'equation', 'calculate'],
      questions: ['?', 'why', 'how', 'what', 'when']
    };
    
    const categoryColors = {
      concepts: '#FF6B6B',
      definitions: '#45B7D1',
      examples: '#4ECDC4',
      important: '#E74C3C',
      steps: '#1ABC9C',
      formulas: '#F7DC6F',
      questions: '#9B59B6'
    };
    
    let position = 0;
    const highlights = sentences.slice(0, 15).map((s, i) => {
      const sentenceText = s.trim();
      const sentenceLower = sentenceText.toLowerCase();
      
      // Detect category
      let detectedCategory = 'concepts';
      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => sentenceLower.includes(kw))) {
          detectedCategory = cat;
          break;
        }
      }
      
      // Calculate start position
      const startPos = body.text.indexOf(sentenceText, position);
      const endPos = startPos + sentenceText.length;
      position = endPos;
      
      return {
        text: sentenceText,
        category: detectedCategory,
        importance: i < 3 ? 'high' : i < 8 ? 'medium' : 'low',
        confidence: Math.max(0.4, 0.95 - (i * 0.05)),
        start_pos: startPos >= 0 ? startPos : 0,
        end_pos: endPos >= 0 ? endPos : sentenceText.length,
        word_count: sentenceText.split(/\s+/).length,
        color: categoryColors[detectedCategory] || '#888888'
      };
    });
    
    // Extract concepts
    const words = body.text.split(/\s+/).filter(w => w.length > 4 && /^[A-Z]/.test(w));
    const concepts = [...new Set(words.slice(0, 10))].map(w => w.replace(/[.,;:!?]/g, ''));
    
    // Group by category
    const byCategory = {};
    highlights.forEach(h => {
      if (!byCategory[h.category]) {
        byCategory[h.category] = { items: [], count: 0, color: h.color, avg_confidence: 0 };
      }
      byCategory[h.category].items.push(h);
      byCategory[h.category].count++;
    });
    
    // Calculate avg confidence per category
    Object.values(byCategory).forEach(cat => {
      if (cat.items.length > 0) {
        cat.avg_confidence = cat.items.reduce((sum, h) => sum + h.confidence, 0) / cat.items.length;
      }
    });
    
    // Calculate statistics
    const totalWords = body.text.split(/\s+/).length;
    const highlightedWords = highlights.reduce((sum, h) => sum + h.word_count, 0);
    
    const categoryDist = {};
    const importanceDist = { high: 0, medium: 0, low: 0 };
    highlights.forEach(h => {
      categoryDist[h.category] = (categoryDist[h.category] || 0) + 1;
      importanceDist[h.importance]++;
    });
    
    console.warn('[DEMO MODE] Using fallback advanced highlights');
    return {
      highlights,
      key_concepts: concepts,
      related_concepts: concepts.slice(0, 3).map(c => ({ concept: c, related_to: [], similarity: 0.7 })),
      summary: `[DEMO MODE] Analyzed ${totalWords} words, found ${highlights.length} key highlights across ${Object.keys(byCategory).length} categories.`,
      readability_score: 65,
      readability_level: 'medium',
      avg_sentence_length: Math.round(totalWords / sentences.length),
      total_highlights: highlights.length,
      by_category: byCategory,
      statistics: {
        total_words: totalWords,
        highlighted_words: highlightedWords,
        coverage_percent: Math.round((highlightedWords / totalWords) * 100),
        avg_confidence: highlights.length > 0 ? highlights.reduce((sum, h) => sum + h.confidence, 0) / highlights.length : 0,
        category_distribution: categoryDist,
        importance_distribution: importanceDist
      },
      category_colors: categoryColors
    };
  };
  
  const requestBody = { text };
  if (categories && categories.length > 0) {
    requestBody.categories = categories;
  }
  requestBody.with_summary = true;
  
  const response = await apiCall('/api/notes/highlight/advanced', 'POST', requestBody, fallback);
  return response;
};

// === Quiz Functions ===
export const generateQuiz = async (topic, text = null, numQuestions = 5, difficulty = 'medium') => {
  devLog('AI is generating a quiz...', { topicLength: topic.length, numQuestions, difficulty });
  
  // Fallback: generate simple demo questions
  const fallback = (body) => {
    console.warn('[DEMO MODE] Using fallback quiz');
    return {
      questions: [
        {
          question: `What is ${body.topic}?`,
          options: [`Definition of ${body.topic}`, 'Incorrect A', 'Incorrect B', 'Incorrect C'],
          correct_answer: 0,
          explanation: '[DEMO MODE] This is a placeholder question.'
        },
        {
          question: `Why is ${body.topic} important?`,
          options: ['Incorrect A', `${body.topic} is fundamental to understanding`, 'Incorrect B', 'Incorrect C'],
          correct_answer: 1,
          explanation: '[DEMO MODE] API quota exceeded - demo questions only.'
        }
      ]
    };
  };
  
  const response = await apiCall('/api/quiz/generate', 'POST', {
    topic,
    text,
    num_questions: numQuestions,
    difficulty
  }, fallback);
  
  // Transform to match expected format
  return response.questions.map(q => ({
    question: q.question,
    options: q.options,
    answer: q.options[q.correct_answer],
    explanation: q.explanation
  }));
};

// === Advanced Quiz Generation ===
export const generateQuizAdvanced = async (options = {}) => {
  const {
    topic,
    numQuestions = 10,
    difficulty = 'medium',
    questionTypes = null,
    withHints = true,
    withExplanations = true,
    withTakeaways = false,
    adaptiveDifficulty = true,
    bloomLevel = null,
    timeLimitMinutes = null,
    shuffleQuestions = true,
    shuffleOptions = true
  } = options;
  
  devLog('AI is generating advanced quiz...', { topicLength: topic?.length || 0, numQuestions, difficulty });
  
  // Fallback: comprehensive demo quiz with multiple question types
  const fallback = (body) => {
    console.warn('[DEMO MODE] Using fallback advanced quiz');
    const demoQuestions = [
      {
        id: 1,
        question_id: 'q1_mcq',
        type: 'multiple_choice',
        question: `What is the primary purpose of ${body.topic}?`,
        difficulty: body.difficulty || 'medium',
        options: {
          A: `To define ${body.topic}`,
          B: `To implement ${body.topic}`,
          C: `To understand ${body.topic} concepts`,
          D: `All of the above`
        },
        correct_answer: 'D',
        hints: [
          'Think about what encompasses all aspects',
          'Consider if multiple answers could be correct',
          'The answer includes everything mentioned'
        ],
        explanation: `[DEMO] ${body.topic} involves definition, implementation, and conceptual understanding.`,
        time_estimate: 45,
        points: 10,
        concept: body.topic,
        concepts: [body.topic, 'fundamentals']
      },
      {
        id: 2,
        question_id: 'q2_tf',
        type: 'true_false',
        question: `${body.topic} is an important concept in its field.`,
        statement: `${body.topic} is an important concept in its field.`,
        difficulty: 'easy',
        options: { A: 'True', B: 'False' },
        correct_answer: 'A',
        hints: ['Consider the context of studying this topic'],
        explanation: `[DEMO] Yes, ${body.topic} is important, which is why you're studying it!`,
        time_estimate: 20,
        points: 5,
        misconception: 'Some may underestimate its importance'
      },
      {
        id: 3,
        question_id: 'q3_short',
        type: 'short_answer',
        question: `Describe the main components of ${body.topic} in your own words.`,
        difficulty: 'medium',
        correct_answer: `Key components include fundamental principles and practical applications.`,
        model_answer: `${body.topic} consists of core principles, practical applications, and theoretical foundations that work together.`,
        key_points: ['core principles', 'practical applications', 'theoretical foundations'],
        hints: ['Think about theory and practice', 'Consider both abstract and concrete aspects'],
        explanation: `[DEMO] A complete answer should mention both theoretical and practical aspects.`,
        time_estimate: 120,
        points: 20,
        requires_manual_grading: true,
        rubric: {
          excellent: 'Covers all key components with clear explanations',
          good: 'Mentions most components with reasonable depth',
          partial: 'Identifies some components but lacks depth',
          incorrect: 'Missing key components or misunderstanding'
        }
      },
      {
        id: 4,
        question_id: 'q4_fill',
        type: 'fill_in_blank',
        question: `The study of ${body.topic} helps us understand _____ better.`,
        difficulty: 'easy',
        options: {
          A: 'complex systems',
          B: 'simple processes',
          C: 'unrelated concepts',
          D: 'nothing new'
        },
        correct_answer: 'A',
        hints: ['Think about what studying brings'],
        explanation: `[DEMO] Studying ${body.topic} helps understand complex systems.`,
        time_estimate: 30,
        points: 8
      },
      {
        id: 5,
        question_id: 'q5_matching',
        type: 'matching',
        question: `Match the following concepts related to ${body.topic}:`,
        difficulty: 'medium',
        column_a: ['Theory', 'Practice', 'Application', 'Research'],
        column_b: ['Real-world use', 'Scientific method', 'Hands-on work', 'Conceptual framework'],
        correct_matches: { '0': 3, '1': 2, '2': 0, '3': 1 },
        hints: ['Think about definitions', 'Theory is abstract, practice is concrete'],
        explanation: '[DEMO] Theory=Conceptual framework, Practice=Hands-on work, Application=Real-world use, Research=Scientific method',
        time_estimate: 90,
        points: 15
      },
      {
        id: 6,
        question_id: 'q6_ordering',
        type: 'ordering',
        question: `Arrange the following steps in the correct order for learning ${body.topic}:`,
        difficulty: 'medium',
        items: ['Apply concepts', 'Learn basics', 'Master advanced topics', 'Practice regularly'],
        original_items: ['Apply concepts', 'Learn basics', 'Master advanced topics', 'Practice regularly'],
        correct_order: [1, 0, 3, 2],
        order_type: 'sequence',
        hints: ['Start with fundamentals', 'Application comes after learning'],
        explanation: '[DEMO] Learn basics → Apply concepts → Practice regularly → Master advanced topics',
        time_estimate: 60,
        points: 12
      }
    ];
    
    // Limit to requested number
    const questions = demoQuestions.slice(0, body.num_questions || 5);
    
    return {
      topic: body.topic,
      difficulty: body.difficulty || 'medium',
      total_questions: questions.length,
      questions,
      total_points: questions.reduce((sum, q) => sum + (q.points || 10), 0),
      passing_score: Math.round(questions.reduce((sum, q) => sum + (q.points || 10), 0) * 0.7),
      estimated_time_minutes: Math.ceil(questions.reduce((sum, q) => sum + (q.time_estimate || 60), 0) / 60),
      estimated_time_seconds: questions.reduce((sum, q) => sum + (q.time_estimate || 60), 0),
      time_limit_minutes: body.time_limit_minutes,
      question_type_distribution: {
        multiple_choice: 1,
        true_false: 1,
        short_answer: 1,
        fill_in_blank: 1,
        matching: 1,
        ordering: 1
      },
      difficulty_distribution: {
        easy: 2,
        medium: 4
      },
      difficulty_curve: questions.map((q, i) => ({
        question_number: i + 1,
        difficulty: q.difficulty,
        difficulty_value: { beginner: 1, easy: 2, medium: 3, hard: 4, expert: 5 }[q.difficulty] || 3,
        progress: ((i + 1) / questions.length) * 100,
        question_type: q.type,
        points: q.points
      })),
      concepts_covered: [body.topic, 'fundamentals', 'applications'],
      subject_category: 'general',
      bloom_level: body.bloom_level || 'understand',
      key_takeaways: [
        { id: 1, concept: `Understanding ${body.topic} basics`, importance: 'high', review_priority: 1 },
        { id: 2, concept: 'Practical applications', importance: 'medium', review_priority: 2 }
      ],
      with_hints: body.with_hints !== false,
      with_explanations: body.with_explanations !== false,
      review_recommendations: [
        { type: 'review', title: `Review ${body.topic} fundamentals`, priority: 'medium', estimated_time: '15 min' }
      ],
      metadata: {
        generated_at: new Date().toISOString(),
        version: '2.0',
        adaptive: body.adaptive_difficulty !== false
      }
    };
  };
  
  const requestBody = {
    topic,
    num_questions: numQuestions,
    difficulty,
    question_types: questionTypes,
    with_hints: withHints,
    with_explanations: withExplanations,
    with_takeaways: withTakeaways,
    adaptive_difficulty: adaptiveDifficulty,
    bloom_level: bloomLevel,
    time_limit_minutes: timeLimitMinutes,
    shuffle_questions: shuffleQuestions,
    shuffle_options: shuffleOptions
  };
  
  // Remove null values
  Object.keys(requestBody).forEach(key => {
    if (requestBody[key] === null || requestBody[key] === undefined) {
      delete requestBody[key];
    }
  });
  
  const response = await apiCall('/api/quiz/generate/advanced', 'POST', requestBody, fallback);
  return response;
};

// === Quiz Evaluation ===
export const evaluateQuizAnswer = async (questionId, userAnswer, timeTaken = null, hintsUsed = 0) => {
  devLog('Evaluating answer for question:', { questionId });
  
  const fallback = () => ({
    is_correct: false,
    partial_credit: 0,
    points_earned: 0,
    max_points: 10,
    time_bonus: 0,
    feedback: '[DEMO] Answer evaluation unavailable',
    explanation: 'Connect to backend for real evaluation',
    correct_answer: 'N/A',
    hints_available: 3,
    review_recommended: true
  });
  
  return await apiCall('/api/quiz/evaluate', 'POST', {
    question_id: questionId,
    user_answer: userAnswer,
    time_taken_seconds: timeTaken,
    hints_used: hintsUsed
  }, fallback);
};

// === Quiz Summary ===
export const getQuizSummary = async (quizId, answers) => {
  devLog('Getting summary for quiz:', { quizId, answersCount: answers.length });
  
  const fallback = () => ({
    total_questions: answers.length,
    correct_answers: 0,
    accuracy_percentage: 0,
    total_points: 0,
    max_points: answers.length * 10,
    score_percentage: 0,
    performance_by_type: {},
    weak_areas: [],
    grade: 'N/A',
    passed: false,
    recommendations: ['Connect to backend for real summary']
  });
  
  return await apiCall('/api/quiz/summary', 'POST', {
    quiz_id: quizId,
    answers
  }, fallback);
};

export const getQuizzes = async (skip = 0, limit = 10) => {
  return await apiCall(`/api/quizzes?skip=${skip}&limit=${limit}`);
};

// === Analytics Functions ===
export const getAnalytics = async () => {
  devLog('Fetching analytics...');
  return await apiCall('/api/analytics');
};

// === Health Check ===
export const checkHealth = async () => {
  return await apiCall('/health');
};

// === Fallback: Simulated responses (for offline development) ===
export const useFallbackMode = () => {
  console.warn('Using fallback mode - simulated AI responses');
  
  return {
    generateAnswer: async (question) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `This is a simulated answer for "${question}". Connect to backend for real AI responses.`;
    },
    
    generateSummary: async (topic) => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return `Simulated summary for "${topic}". Connect to backend for real AI summaries.`;
    },
    
    generateHighlights: async (text) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const sentences = text.split(/[.!?]/).filter(s => s.trim().split(' ').length > 6);
      return `**Key Highlights:** ${sentences.slice(0, 3).join('. ')}.`;
    },
    
    generateQuiz: async (topic) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return [
        {
          question: `What is ${topic}?`,
          options: ['Option A', 'Option B', 'Option C', 'Correct D'],
          answer: 'Correct D'
        },
        {
          question: `How does ${topic} work?`,
          options: ['Correct A', 'Option B', 'Option C', 'Option D'],
          answer: 'Correct A'
        }
      ];
    }
  };
};
