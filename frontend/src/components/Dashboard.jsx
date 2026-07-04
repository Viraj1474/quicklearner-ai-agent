import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useTheme } from "./theme";
import { useAuth } from "./AuthContext";
import { hasPremiumAccess, isDeveloperOrAdmin } from "./premium/accessUtils";
import { useQuota, LOCKED_FOR_FREE } from "./hooks/useQuota";
import ChatBot from "./ChatBot";
import AskForm from "./AskForm";
import NotesHighlighter from "./NotesHighlighter";
import QuizGenerator from "./QuizGenerator";
import Summary from "./Summary";
import Analytics from "./Analytics";
import FlashcardsContainer from "./FlashcardsContainer";
import * as aiService from "./services/aiService";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {


      
      when: "beforeChildren",
      staggerChildren: 0.07,
      delayChildren: 0.1,
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const sidebarVariants = {
  closed: { x: "-100%", boxShadow: "0px 0px 0px rgba(0, 0, 0, 0)" },
  open: { 
    x: "0%", 
    boxShadow: "5px 0px 20px rgba(0, 0, 0, 0.1)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
};

// Removed popup variants (we no longer use a tools popup)

// Tool definitions
const tools = [
  {
    id: 'notes',
    name: 'Notes Highlighter',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    description: 'Analyze and highlight key points in your notes'
  },
  {
    id: 'summary',
    name: 'Text Summarizer',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    description: 'Generate concise summaries of long texts'
  },
  {
    id: 'quiz',
    name: 'Quiz Generator',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    description: 'Create interactive quizzes from your content'
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    description: 'Create and study with AI-generated flashcards'
  },
  {
    id: 'analytics',
    name: 'Study Analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    description: 'Track and visualize your learning progress'
  }
];

export default function Dashboard({ onSignInRequired }) {
  const { styles, darkMode } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const { isFeatureLocked } = useQuota();
  
  // State
  const [summaries, setSummaries] = useState([]);
  const [quiz, setQuiz] = useState([]);
  const [cards, setCards] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recentTools, setRecentTools] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const subscriptionLabel = isDeveloperOrAdmin(user)
    ? 'Developer access'
    : hasPremiumAccess(user)
      ? `Premium ${user?.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : ''}`.trim()
      : 'Free Plan';
  const [chatHistory, setChatHistory] = useState(() => {
    // Load chat history from localStorage on initial render
    try {
      const saved = localStorage.getItem('chatHistory');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) }));
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
    return [{ id: 1, text: "Welcome to AI Study Assistant! How can I help you today?", sender: "ai", timestamp: new Date() }];
  });
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef(null);
  
  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  }, [chatHistory]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);
  
  // Refs
  // Removed tools popup refs
  
  // Functions
  const addNewSummary = (s) => setSummaries((prev) => [s, ...prev]);
  const setNewQuiz = (q) => setQuiz(q);
  const addNewCard = (q, a) => setCards((prev) => [{ front: q, back: a }, ...prev]);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // File upload handlers
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Check file type
      const allowedTypes = ['text/plain', 'application/pdf', 'text/markdown', 'application/json', 
                           'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const allowedExtensions = ['.txt', '.pdf', '.md', '.json', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
        alert('Unsupported file type. Please upload text, PDF, markdown, JSON, or image files.');
        return;
      }
      
      setUploadedFile(file);
      
      // Handle PDF files - extract text content
      if (file.type === 'application/pdf' || ext === '.pdf') {
        try {
          setInputValue(prev => prev + (prev ? ' ' : '') + `[Processing PDF: ${file.name}...]`);
          
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          let fullText = '';
          const maxPages = Math.min(pdf.numPages, 20); // Limit to 20 pages
          
          for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
          }
          
          // Clean up the extracted text
          fullText = fullText.trim();
          
          if (fullText.length > 0) {
            // Limit content to avoid token limits (max 8000 chars)
            const maxChars = 8000;
            const truncatedText = fullText.length > maxChars 
              ? fullText.substring(0, maxChars) + '\n\n[Content truncated due to length...]'
              : fullText;
            
            setInputValue(`[PDF: ${file.name}]\n\n${truncatedText}`);
          } else {
            setInputValue(prev => prev.replace(`[Processing PDF: ${file.name}...]`, '') + 
              `[PDF: ${file.name}] (Unable to extract text - may be an image-based PDF)`);
          }
        } catch (error) {
          console.error('Error parsing PDF:', error);
          setInputValue(prev => prev.replace(`[Processing PDF: ${file.name}...]`, '') + 
            `[PDF: ${file.name}] (Error reading PDF: ${error.message})`);
        }
      }
      // If it's a text file, read its content
      else if (file.type.startsWith('text/') || ext === '.txt' || ext === '.md' || ext === '.json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          // Limit content length
          const maxChars = 8000;
          const truncatedContent = content.length > maxChars 
            ? content.substring(0, maxChars) + '\n\n[Content truncated due to length...]'
            : content;
          setInputValue(prev => prev + (prev ? '\n\n' : '') + `[File: ${file.name}]\n${truncatedContent}`);
        };
        reader.readAsText(file);
      } else {
        // For image files, just show the filename
        setInputValue(prev => prev + (prev ? ' ' : '') + `[Attached: ${file.name}] (Images cannot be processed yet)`);
      }
    }
  };
  
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const clearUploadedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const openTool = useCallback((toolId) => {
    // Check if user is authenticated - tools require sign-in
    if (!isAuthenticated) {
      onSignInRequired?.();
      return;
    }
    
    setActiveTool(toolId);
    
    // Add to recent tools if not already there
    setRecentTools(prev => {
      if (!prev.includes(toolId)) {
        const newRecent = [toolId, ...prev.slice(0, 2)];
        return [...new Set(newRecent)]; // Remove duplicates
      }
      return prev;
    });
  }, [isAuthenticated, onSignInRequired]);

  // Persist last active tool across refreshes (only for authenticated users)
  React.useEffect(() => {
    if (!isAuthenticated) {
      setActiveTool(null);
      return;
    }
    try {
      const last = localStorage.getItem('activeTool');
      if (last) setActiveTool(last);
    } catch {}
  }, [isAuthenticated]);

  React.useEffect(() => {
    try {
      if (activeTool) localStorage.setItem('activeTool', activeTool);
      else localStorage.removeItem('activeTool');
    } catch {}
  }, [activeTool]);

  // Keyboard shortcuts for quick tool access (disabled while typing in inputs)
  React.useEffect(() => {
    const handler = (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      const isTyping = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable);
      if (isTyping) return;
      const key = e.key.toLowerCase();
      if (key === 'escape') {
        setActiveTool(null);
        return;
      }
      const map = {
        n: 'notes',
        s: 'summary',
        q: 'quiz',
        f: 'flashcards',
        a: 'analytics',
      };
      if (map[key]) {
        openTool(map[key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openTool]);

  // Send message from bottom input - using real backend API
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    
    const userMessage = { id: Date.now(), text, sender: 'user', timestamp: new Date() };
    const assistantMessageId = Date.now() + 1;
    setChatHistory(prev => [...prev, userMessage]);
    setChatHistory(prev => [...prev, {
      id: assistantMessageId,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      isStreaming: true,
    }]);
    setInputValue("");
    clearUploadedFile(); // Clear file after sending
    setIsLoading(true);
    
    try {
      // Call real backend API
      const response = await aiService.sendChatMessage(text, null, (content) => {
        setChatHistory(prev => prev.map(message => (
          message.id === assistantMessageId
            ? { ...message, text: content, isStreaming: true }
            : message
        )));
      });
      setChatHistory(prev => prev.map(message => (
        message.id === assistantMessageId
          ? {
              ...message,
              text: response.message || message.text || 'Sorry, I could not generate a response.',
              isStreaming: false,
              session_id: response.session_id
            }
          : message
      )));
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { 
        id: assistantMessageId, 
        text: `Error: ${error.message}. Please check if the backend is running.`, 
        sender: 'ai', 
        timestamp: new Date() 
      };
      setChatHistory(prev => prev.map(message => message.id === assistantMessageId ? errorMessage : message));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear chat history
  const clearChat = () => {
    setChatHistory([{ id: 1, text: "Chat cleared. How can I help you?", sender: "ai", timestamp: new Date() }]);
    localStorage.removeItem('chatHistory');
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 h-full w-full flex flex-col overflow-hidden relative">
      {/* Main content area - no decorations to save space */}
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              className="w-72 h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col z-20"
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              {/* Sidebar Header */}
              <div className="p-5 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-white dark:text-gray-900 text-sm font-semibold">
                    AI
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      Study Hub
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">Beta</span>
                    </h2>
                  </div>
                </div>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex-1 overflow-auto px-3 py-4">
                {/* Learning stats section */}
                <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Your Learning Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center border border-gray-100 dark:border-gray-700">
                      <div className="font-bold text-lg text-gray-900 dark:text-gray-100">12</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Study Hours</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center border border-gray-100 dark:border-gray-700">
                      <div className="font-bold text-lg text-gray-900 dark:text-gray-100">8</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Topics Mastered</div>
                    </div>
                  </div>
                </div>
              
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 px-2 flex items-center justify-between">
                    <span>AI TOOLS</span>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{tools.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {tools.map(tool => (
                      <motion.button
                        key={tool.id}
                        onClick={() => openTool(tool.id)}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${
                          activeTool === tool.id
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <div className={`p-2 rounded-lg ${activeTool === tool.id ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                          {tool.icon}
                        </div>
                        <div className="flex-1 text-left flex items-center gap-2">
                          {tool.name}
                          {isAuthenticated && isFeatureLocked(tool.id) && (
                            <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">Premium</span>
                          )}
                          {!isAuthenticated && (
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {activeTool === tool.id && (
                            <motion.div 
                              className="h-0.5 w-12 bg-gray-400 dark:bg-gray-500 rounded-full mt-1"
                              initial={{ width: 0, opacity: 0 }}
                              animate={{ width: 48, opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                          )}
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 px-2">RECENT CONVERSATIONS</h3>
                  <div className="space-y-2">
                    {[
                      { title: 'Study strategies', date: 'Today', snippet: 'Effective ways to improve retention' },
                      { title: 'Math homework help', date: 'Yesterday', snippet: 'Linear equations and graphs' },
                      { title: 'Research paper ideas', date: 'Oct 10', snippet: 'Topics for psychology paper' }
                    ].map((chat, index) => (
                      <div
                        key={index}
                        className="flex flex-col w-full px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                            </div>
                            <span className="font-medium">{chat.title}</span>
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{chat.date}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-7">{chat.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Sidebar Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Student</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{subscriptionLabel}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tool content area (when a tool is active) */}
          {activeTool && (
            <div className="absolute inset-0 z-30 flex flex-col bg-white dark:bg-gray-900 pt-16">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTool(null)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
                    title="Close (Esc)"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h2 className="font-bold text-lg">
                    {tools.find(t => t.id === activeTool)?.name || 'Tool'}
                  </h2>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                {activeTool === 'notes' && (
                  <NotesHighlighter
                    onNewSummary={addNewSummary}
                    expanded={true}
                  />
                )}
                
                {activeTool === 'summary' && (
                  <Summary summaries={summaries} onNewSummary={addNewSummary} />
                )}
                
                {activeTool === 'quiz' && (
                  <QuizGenerator onQuizGenerated={setNewQuiz} />
                )}
                
                {activeTool === 'flashcards' && (
                  <FlashcardsContainer 
                    cards={cards} 
                    onNewCards={(newCards) => setCards(prev => [...newCards, ...prev])}
                  />
                )}
                
                {activeTool === 'analytics' && (
                  <Analytics
                    summaryCount={summaries.length}
                    quizQuestionCount={quiz.length}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Chat interface (main view) */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 h-full">
            {/* Chat messages area - compact layout to fit on screen */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
              {/* Compact welcome message - only show if no messages */}
              {chatHistory.length <= 1 && (
                <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="h-10 w-10 rounded-lg bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-white dark:text-gray-900 text-sm font-semibold flex-shrink-0">
                    AI
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Study Assistant</h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Ask questions, create summaries, quizzes, or use tools to enhance your learning
                    </p>
                  </div>
                </div>
              )}
              
              {chatHistory.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'ai' ? 'justify-start' : 'justify-end'} relative`}
                >
                  {message.sender === 'ai' && (
                    <div className="absolute -left-1 top-1 h-6 w-6 rounded-md bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-white dark:text-gray-900 text-xs font-semibold">
                      AI
                    </div>
                  )}
                  
                  <motion.div
                    className={`max-w-[85%] rounded-xl px-3 py-2.5 ${message.sender === 'ai' ? 'ml-7' : ''} ${
                      message.sender === 'ai'
                        ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    }`}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      damping: 25,
                      stiffness: 350,
                    }}
                    style={{
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* Render message with Markdown for AI responses */}
                    {message.sender === 'ai' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-claude prose-p:my-0.5 prose-headings:my-1 prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0 prose-code:bg-gray-100 prose-code:dark:bg-gray-700 prose-code:px-1 prose-code:rounded text-sm">
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-white dark:text-gray-900">{message.text}</p>
                    )}
                  </motion.div>
                </div>
              ))}
              
              {/* Loading skeleton while waiting for AI response */}
              {isLoading && (
                <div className="flex justify-start relative">
                  <div className="absolute -left-1 top-1 h-6 w-6 rounded-md bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-white dark:text-gray-900 text-xs font-semibold">
                    AI
                  </div>
                  <motion.div
                    className="ml-7 max-w-[85%] rounded-xl px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <motion.div 
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div 
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div 
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Thinking...</span>
                    </div>
                  </motion.div>
                </div>
              )}
              
              {/* Scroll anchor */}
              <div ref={chatEndRef} />
            </div>
            
            {/* Bottom tool selection and input area - compact design */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 px-3 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
              {/* Capability chips - compact single row */}
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto hide-scrollbar">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">Tools:</span>
                
                {tools.map(tool => (
                  <motion.button
                    key={tool.id}
                    onClick={() => openTool(tool.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium flex-shrink-0 
                      bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 
                      ${activeTool === tool.id ? 'ring-1 ring-gray-400 dark:ring-gray-500 bg-gray-100 dark:bg-gray-700' : ''}`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="w-4 h-4">{tool.icon}</span>
                    <span className="hidden sm:inline">{tool.name}</span>
                    {!isAuthenticated && (
                      <svg className="w-2.5 h-2.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </motion.button>
                ))}
              </div>
              
              {/* Input area - compact */}
              <div className="flex flex-col gap-1">
                {/* File preview if uploaded - inline */}
                {uploadedFile && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{uploadedFile.name}</span>
                    <button onClick={clearUploadedFile} className="text-gray-400 hover:text-gray-600" title="Remove">×</button>
                  </div>
                )}
                
                <div className="flex items-center gap-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.pdf,.md,.json,.jpg,.jpeg,.png,.gif,.webp,text/*,image/*,application/pdf,application/json"
                  />
                  
                  {/* Attachments button */}
                  <button 
                    onClick={handleFileButtonClick}
                    className={`p-1.5 rounded-md transition-colors ${uploadedFile ? 'text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/70'}`}
                    aria-label="Attach file" 
                    title="Attach file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                
                  <input
                    type="text"
                    placeholder="Ask anything..."
                    className="flex-1 bg-transparent outline-none text-sm py-1.5 px-1 text-gray-900 dark:text-gray-100"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                    aria-label="Chat input"
                  />
                
                {/* Send button */}
                <button 
                  className={`p-2 rounded-lg transition-colors ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200'} text-white dark:text-gray-900`} 
                  onClick={handleSend} 
                  disabled={isLoading}
                  aria-label="Send message" 
                  title={isLoading ? "Waiting for response..." : "Send message (Enter)"}
                >
                  {isLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
              </div>
              
              <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 px-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></div>
                    Online
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button 
                    onClick={clearChat}
                    className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    title="Clear chat history"
                  >
                    Clear
                  </button>
                </div>
                <span>{chatHistory.length - 1} messages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}