import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useTheme } from "./theme";
import { useAuth } from "./AuthContext";
import Avatar from "./Avatar";
import * as aiService from './services/aiService';
import { WelcomeState } from "./WelcomeState";
import { useNickname } from "./NicknameModal";
import { useQuota } from "./hooks/useQuota";

function QuicklearnerAvatar({ className = '' }) {
  return (
    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-white text-black font-bold shadow-sm border border-black/10 ${className}`} aria-label="Quicklearner">
      <span className="text-sm leading-none">Q</span>
    </div>
  );
}

// Claude-like Chat Interface
const ClaudeChat = forwardRef(function ClaudeChat({ onToolOpen, onSignInRequired, sidebarOpen, setSidebarOpen }, ref) {
  const { darkMode } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const { nickname, isFirstTimeUser } = useNickname();
  const { getRemaining, getLimit, fetchQuota } = useQuota();
  
  const createInitialConversation = () => [{
    id: Date.now(),
    title: "New conversation",
    date: new Date(),
    messages: [],
    active: true
  }];

  // Start fresh on every app open instead of restoring old chats from localStorage.
  const [conversations, setConversations] = useState(() => {
    return createInitialConversation();
  });
  
  const [activeConversation, setActiveConversation] = useState(() => {
    const active = conversations.find(c => c.active);
    return active?.id || conversations[0]?.id;
  });
  
  // Temporary chat mode - messages won't be saved
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [temporaryMessages, setTemporaryMessages] = useState([]);
  
  // Get current messages based on mode
  const messages = isTemporaryChat 
    ? temporaryMessages 
    : (conversations.find(c => c.id === activeConversation)?.messages || []);
  
  // Set messages helper
  const setMessages = useCallback((updater) => {
    if (isTemporaryChat) {
      setTemporaryMessages(updater);
    } else {
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation 
          ? { ...conv, messages: typeof updater === 'function' ? updater(conv.messages) : updater }
          : conv
      ));
    }
  }, [activeConversation, isTemporaryChat]);
  
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.removeItem('claudeConversations');
    } catch (e) {
      console.error('Failed to clear saved conversations:', e);
    }
  }, []);

  // Save conversations to localStorage (skip for temporary chats)
  useEffect(() => {
    if (!isTemporaryChat) {
      try {
        localStorage.setItem('claudeConversations', JSON.stringify(conversations));
      } catch (e) {
        console.error('Failed to save conversations:', e);
      }
    }
  }, [conversations, isTemporaryChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process files
  const processFiles = (files) => {
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        console.warn(`File ${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    const newAttachments = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  // Remove attachment
  const removeAttachment = (id) => {
    setAttachments(prev => {
      const att = prev.find(a => a.id === id);
      if (att?.preview) {
        URL.revokeObjectURL(att.preview);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Get file icon based on type
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (type === 'application/pdf') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    if (type.includes('word') || type.includes('document')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    );
  };

  // Send message
  const handleSend = async () => {
    const text = inputValue.trim();
    if ((!text && attachments.length === 0) || isLoading) return;

    const userMessage = {
      id: Date.now(),
      content: text,
      role: 'user',
      timestamp: new Date(),
      attachments: attachments.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        size: a.size,
        preview: a.preview,
      }))
    };
    const assistantMessageId = Date.now() + 1;

    // Update conversation title with first message (if not temporary)
    if (!isTemporaryChat && messages.length === 0) {
      const title = text.length > 30 ? text.substring(0, 30) + '...' : text;
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation ? { ...conv, title } : conv
      ));
    }

    setMessages(prev => [...prev, userMessage, {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true,
    }]);
    setInputValue("");
    setAttachments([]);
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await aiService.sendChatMessage(text, null, (content) => {
        setMessages(prev => prev.map(message => (
          message.id === assistantMessageId
            ? { ...message, content, isStreaming: true }
            : message
        )));
      }, attachments.map(a => a.file));

      setMessages(prev => prev.map(message => (
        message.id === assistantMessageId
          ? {
              ...message,
              content: response.message || message.content || 'I apologize, but I could not generate a response.',
              isStreaming: false,
              session_id: response.session_id,
            }
          : message
      )));
} catch (error) {
      console.error('Chat error:', error);
      let userMessage = error.message || 'Something went wrong. Please try again.';
      if (error.status === 403) {
        userMessage = '?? This feature requires a premium subscription. Upgrade to continue.';
      } else if (error.status === 429) {
        userMessage = '? Daily chat limit reached. Your quota resets at midnight UTC. Upgrade to premium for unlimited access.';
      }
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: userMessage, isStreaming: false, isError: true }
          : msg
      ));
    } finally {
      setIsLoading(false);
      fetchQuota();
    }
  };

  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // New conversation
  const startNewConversation = useCallback(() => {
    // Exit temporary mode if active
    setIsTemporaryChat(false);
    setTemporaryMessages([]);
    
    const newConv = {
      id: Date.now(),
      title: "New conversation",
      date: new Date(),
      messages: [],
      active: true
    };
    setConversations(prev => [newConv, ...prev.map(c => ({ ...c, active: false }))]);
    setActiveConversation(newConv.id);
  }, []);

  // Switch to a conversation
  const switchConversation = useCallback((convId) => {
    setIsTemporaryChat(false);
    setTemporaryMessages([]);
    setConversations(prev => prev.map(c => ({ ...c, active: c.id === convId })));
    setActiveConversation(convId);
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback((convId, e) => {
    if (e) {
      e.stopPropagation();
    }
    setShowDeleteConfirm(null);
    
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== convId);
      // If deleting active conversation, switch to first available or create new
      if (convId === activeConversation) {
        if (filtered.length > 0) {
          filtered[0].active = true;
          setActiveConversation(filtered[0].id);
        } else {
          const newConv = {
            id: Date.now(),
            title: "New conversation",
            date: new Date(),
            messages: [],
            active: true
          };
          setActiveConversation(newConv.id);
          return [newConv];
        }
      }
      return filtered;
    });
  }, [activeConversation]);

  // Start temporary chat
  const startTemporaryChat = useCallback(() => {
    setIsTemporaryChat(true);
    setTemporaryMessages([]);
    setConversations(prev => prev.map(c => ({ ...c, active: false })));
  }, []);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    startNewConversation
  }), [startNewConversation]);

  // Suggested prompts for empty state
  const promptIcons = {
    summarize: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    flashcards: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    quiz: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    explain: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  };

  const suggestedPrompts = [
    { iconKey: "summarize", text: "Summarize my study notes", description: "Get concise summaries of your materials" },
    { iconKey: "flashcards", text: "Create flashcards for biology", description: "Generate study flashcards automatically" },
    { iconKey: "quiz", text: "Generate a quiz on physics", description: "Test your knowledge with AI-generated questions" },
    { iconKey: "explain", text: "Explain quantum mechanics simply", description: "Get easy-to-understand explanations" }
  ];

  return (
    <div className={`flex h-full w-full overflow-hidden ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
      {/* Sidebar spacer - reserves space when sidebar is open on desktop */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-[280px]' : 'w-0'}`} />
      
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Sidebar panel - always fixed, top offset for header */}
            <motion.div
              className={`fixed top-14 left-0 z-50 w-[min(86vw,280px)] sm:w-[280px] h-[calc(100vh-3.5rem)] flex flex-col ${
                darkMode 
                  ? 'bg-[#171717] border-r border-[#2a2a2a]' 
                  : 'bg-[#f9f9f9] border-r border-gray-200'
              }`}
              initial={{ x: -280, opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 1 }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
            >
              {/* Sidebar header */}
              <div className="p-3 space-y-1">
                <button
                  onClick={startNewConversation}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    darkMode 
                      ? 'hover:bg-[#2a2a2a] text-gray-200' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New chat
                </button>
                
                {/* Temporary chat button */}
                <button
                  onClick={startTemporaryChat}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isTemporaryChat
                      ? darkMode
                        ? 'bg-amber-900/30 text-amber-300 border border-amber-700/50'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                      : darkMode 
                        ? 'hover:bg-[#2a2a2a] text-gray-400' 
                        : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Temporary chat
                  {isTemporaryChat && (
                    <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-amber-800/50' : 'bg-amber-100'}`}>
                      Active
                    </span>
                  )}
                </button>
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto px-3">
                <div className={`text-xs font-medium px-3 py-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Recent conversations
                </div>
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group relative flex items-center mb-1 rounded-lg transition-colors ${
                      !isTemporaryChat && conv.id === activeConversation
                        ? darkMode 
                          ? 'bg-[#2a2a2a]' 
                          : 'bg-gray-100'
                        : darkMode
                          ? 'hover:bg-[#2a2a2a]'
                          : 'hover:bg-gray-100'
                    }`}
                  >
                    <button
                      onClick={() => switchConversation(conv.id)}
                      className={`flex-1 text-left px-3 py-2 text-sm truncate ${
                        !isTemporaryChat && conv.id === activeConversation
                          ? darkMode 
                            ? 'text-white' 
                            : 'text-gray-900'
                          : darkMode
                            ? 'text-gray-400 group-hover:text-gray-200'
                            : 'text-gray-600 group-hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="truncate">{conv.title}</span>
                      </div>
                    </button>
                    
                    {/* Delete button - shows on hover */}
                    <button
                      onClick={(e) => setShowDeleteConfirm(conv.id)}
                      className={`absolute right-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                        darkMode
                          ? 'hover:bg-red-900/50 text-gray-400 hover:text-red-400'
                          : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                      }`}
                      title="Delete conversation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    {/* Delete confirmation popup */}
                    {showDeleteConfirm === conv.id && (
                      <div className={`absolute right-0 top-full mt-1 z-10 p-3 rounded-lg shadow-lg ${
                        darkMode ? 'bg-[#2a2a2a] border border-[#3a3a3a]' : 'bg-white border border-gray-200'
                      }`}>
                        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          Delete this chat?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => deleteConversation(conv.id, e)}
                            className="px-3 py-1.5 text-xs font-medium rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(null); }}
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                              darkMode 
                                ? 'bg-[#3a3a3a] hover:bg-[#4a4a4a] text-gray-200' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sidebar footer */}
              <div className={`p-3 border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                  darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                }`}>
                  <Avatar
                    src={user?.profile_picture}
                    name={user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}` 
                      : user?.username}
                    email={user?.email}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {user?.username || 'Guest'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main chat area - No duplicate header, uses unified header from App.jsx */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Temporary chat banner */}
        {isTemporaryChat && (
          <div className={`px-4 py-2 text-center text-sm border-b ${
            darkMode 
              ? 'bg-amber-900/20 text-amber-300 border-amber-800/30' 
              : 'bg-amber-50 text-amber-700 border-amber-100'
          }`}>
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Temporary chat — messages won't be saved to history</span>
              <button
                onClick={() => {
                  setIsTemporaryChat(false);
                  setTemporaryMessages([]);
                  const firstConv = conversations[0];
                  if (firstConv) {
                    setActiveConversation(firstConv.id);
                    setConversations(prev => prev.map((c, i) => ({ ...c, active: i === 0 })));
                  }
                }}
                className={`ml-2 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  darkMode 
                    ? 'bg-amber-800/50 hover:bg-amber-800 text-amber-200' 
                    : 'bg-amber-200 hover:bg-amber-300 text-amber-800'
                }`}
              >
                Exit
              </button>
            </div>
          </div>
        )}
        
        {/* Messages area - optimized for smooth scrolling */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ 
            willChange: 'scroll-position',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6">
            {messages.length === 0 ? (
              /* Welcome/Empty state */
              isTemporaryChat ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                    darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-8 h-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h1 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Temporary Chat
                  </h1>
                  <p className={`text-center mb-8 max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    This conversation is private and won't be saved. Perfect for quick questions!
                  </p>
                </div>
              ) : (
                <WelcomeState
                  userName={nickname}
                  onPromptSelect={(text) => setInputValue(text)}
                  onToolOpen={onToolOpen}
                  isAuthenticated={isAuthenticated}
                  isFirstTimeUser={isFirstTimeUser}
                />
              )
            ) : (
              /* Message list */
              <div className="space-y-6">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && <QuicklearnerAvatar />}
                    
                    <div className={`max-w-[92%] sm:max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                      {/* Attachments display */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {message.attachments.map(att => (
                            <div
                              key={att.id}
                              className={`rounded-lg overflow-hidden border ${
                                darkMode ? 'border-[#3a3a3a] bg-[#2a2a2a]' : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              {att.preview ? (
                                <img 
                                  src={att.preview} 
                                  alt={att.name}
                                  className="max-w-[200px] max-h-[150px] object-cover"
                                />
                              ) : (
                                <div className={`flex items-center gap-2 px-3 py-2 ${
                                  darkMode ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                  {getFileIcon(att.type)}
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate max-w-[150px]">{att.name}</p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                      {formatFileSize(att.size)}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? darkMode 
                            ? 'bg-[#2f2f2f] text-white' 
                            : 'bg-gray-100 text-gray-900'
                          : message.isError
                            ? darkMode
                              ? 'bg-red-900/20 text-red-300'
                              : 'bg-red-50 text-red-700'
                            : darkMode 
                              ? 'text-white' 
                              : 'text-gray-900'
                      }`}>
                        {message.role === 'assistant' ? (
                          <div className={`prose prose-sm max-w-none prose-claude ${
                            darkMode 
                              ? 'prose-invert prose-p:text-gray-100 prose-headings:text-white prose-strong:text-white prose-code:text-gray-100 prose-code:bg-[#2a2a2a] prose-li:text-gray-100 prose-a:text-blue-400' 
                              : 'prose-p:text-gray-800 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-li:text-gray-800 prose-a:text-blue-600'
                          }`}>
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <Avatar
                        src={user?.profile_picture}
                        name={user?.first_name && user?.last_name 
                          ? `${user.first_name} ${user.last_name}` 
                          : user?.username}
                        email={user?.email}
                        size="sm"
                      />
                    )}
                  </motion.div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4"
                  >
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                    }`}>
                      <svg className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </div>
                    <div className="flex items-center gap-1 py-3">
                      <motion.div
                        className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className={`border-t ${darkMode ? 'border-[#2a2a2a]' : 'border-gray-100'}`}>
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            {/* Attachment preview */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3"
                >
                  <div className="flex flex-wrap gap-2">
                    {attachments.map(att => (
                      <motion.div
                        key={att.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`relative group rounded-lg overflow-hidden border ${
                          darkMode ? 'border-[#3a3a3a] bg-[#2a2a2a]' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        {att.preview ? (
                          <div className="relative">
                            <img 
                              src={att.preview} 
                              alt={att.name}
                              className="w-20 h-20 object-cover"
                            />
                            <button
                              onClick={() => removeAttachment(att.id)}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-3 py-2 pr-8">
                            <div className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {getFileIcon(att.type)}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-medium truncate max-w-[100px] ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>{att.name}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {formatFileSize(att.size)}
                              </p>
                            </div>
                            <button
                              onClick={() => removeAttachment(att.id)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quota display bar */}
            {isAuthenticated && (() => {
              const remaining = getRemaining('chat');
              const limit = getLimit('chat');
              if (remaining === null || limit === null) return null;
              const pct = Math.round((remaining / limit) * 100);
              const color = pct > 40 ? '#22c55e' : pct > 15 ? '#f59e0b' : '#ef4444';
              return (
                <div className={`flex items-center gap-2 px-1 pb-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <div className={`flex-1 h-1 rounded-full overflow-hidden ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200'}`}>
                    <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all duration-500" />
                  </div>
                  <span style={{ color }}>{remaining}/{limit} chats left today</span>
                </div>
              );
            })()}

            {/* Input container with drag & drop */}
            <div 
              className={`relative flex flex-col sm:flex-row items-stretch sm:items-end rounded-2xl border transition-all ${
                isDragging
                  ? darkMode
                    ? 'bg-purple-500/10 border-purple-500'
                    : 'bg-purple-50 border-purple-400'
                  : darkMode 
                    ? 'bg-[#1f1f1f] border-[#2a2a2a] focus-within:border-[#3a3a3a]' 
                    : 'bg-white border-gray-200 focus-within:border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Drag overlay */}
              {isDragging && (
                <div className={`absolute inset-0 flex items-center justify-center rounded-2xl z-10 ${
                  darkMode ? 'bg-purple-500/10' : 'bg-purple-50'
                }`}>
                  <div className={`flex items-center gap-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium">Drop files here</span>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.ppt,.pptx"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-lg transition-colors flex-shrink-0 self-start sm:self-auto ${
                  darkMode 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-[#2a2a2a]' 
                    : 'text-gray-500 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title="Attach files"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Quicklearner..."
                rows={1}
                className={`flex-1 min-h-[44px] resize-none py-3 px-1 sm:px-0 bg-transparent outline-none text-sm ${
                  darkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                }`}
                style={{ maxHeight: '200px' }}
              />
              
              <div className="flex items-center justify-end gap-1 px-2 pb-2 sm:pr-2 sm:pb-2">
                <button
                  onClick={handleSend}
                  disabled={(!inputValue.trim() && attachments.length === 0) || isLoading}
                  className={`p-2 rounded-lg transition-all ${
                    (inputValue.trim() || attachments.length > 0) && !isLoading
                      ? darkMode 
                        ? 'bg-white text-black hover:bg-gray-200' 
                        : 'bg-black text-white hover:bg-gray-800'
                      : darkMode
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className={`flex items-center justify-center mt-2 text-xs ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`}>
              <span>Quicklearner can make mistakes. Consider checking important information.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ClaudeChat;
