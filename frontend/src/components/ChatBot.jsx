import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RippleEffect from './RippleEffect';
import { useTheme } from "./theme";
import AnimatedInput from "./AnimatedInput";
import AnimatedButton from "./AnimatedButton";
import { toast as simpleToast, ToastContainer } from './SimpleToast'; // Import our SimpleToast and ToastContainer
import * as aiService from './services/aiService'; // Import AI service for real API calls

// Modern animation variants
const messageVariants = {
  initial: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95, 
    rotateX: '10deg',
    filter: 'blur(8px)' 
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    rotateX: '0deg',
    filter: 'blur(0px)',
    transition: { 
      type: "spring",
      damping: 15,
      stiffness: 300,
      mass: 0.8,
    }
  },
  exit: { 
    opacity: 0,
    y: -10,
    scale: 0.95,
    filter: 'blur(8px)',
    transition: { duration: 0.3 }
  },
  highlight: {
    boxShadow: [
      '0 0 0 rgba(124, 58, 237, 0)', 
      '0 0 25px rgba(124, 58, 237, 0.5)', 
      '0 0 0 rgba(124, 58, 237, 0)'
    ],
    scale: [1, 1.02, 1],
    transition: {
      duration: 1.8,
      repeat: 0,
      ease: "easeInOut"
    }
  }
};

const typingIndicatorVariants = {
  initial: { opacity: 0, y: 10, scale: 0.8, filter: 'blur(4px)' },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  },
  exit: { 
    opacity: 0, 
    y: 5, 
    scale: 0.9,
    transition: {
      duration: 0.2
    } 
  }
};

const suggestionVariants = {
  initial: { opacity: 0, scale: 0.9, y: 10 },
  animate: custom => ({ 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { 
      delay: custom * 0.1,
      type: "spring",
      damping: 12,
      stiffness: 100 
    }
  }),
  hover: { 
    scale: 1.03, 
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.97 }
};

// Sample avatar URLs - replace with your actual avatar images
const userAvatar = "https://ui-avatars.com/api/?name=User&background=random";
const aiAvatar = "https://ui-avatars.com/api/?name=AI&background=0062cc&color=fff";

// Message quick suggestions
const suggestedQuestions = [
  "Summarize my lecture notes",
  "Create flashcards about quantum physics",
  "Generate a quiz on biology",
  "Explain machine learning concepts",
  "Help me prepare for my exam"
];

// Main ChatBot component
export default function ChatBot({
  onNewCard = () => {},
  onNewSummary = () => {},
  toast = simpleToast, // Use SimpleToast as the default
  isFullScreen = true // Added this parameter to adjust styling
}) {
  const { styles, darkMode } = useTheme();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi there! I'm your AI assistant. How can I help you today?", sender: "ai", timestamp: new Date() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isMicActive, setIsMicActive] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false); // For the floating action button menu
  const [fabMenuOpen, setFabMenuOpen] = useState(false); // For the new floating action button menu
  const [aiStatus, setAiStatus] = useState("online"); // online, busy, away
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // history, settings, profile
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messageActionsRef = useRef(null);
  const actionMenuRef = useRef(null);

  // Handle scrolling and unread messages
  useEffect(() => {
    if (messages.length > 0) {
      const isScrolledToBottom = chatContainerRef.current && 
        chatContainerRef.current.scrollHeight - chatContainerRef.current.clientHeight <= 
        chatContainerRef.current.scrollTop + 100;
      
      if (isScrolledToBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setUnreadMessages(0);
      } else if (messages[messages.length - 1]?.sender === "ai") {
        // Increment unread count if we received an AI message and not at bottom
        setUnreadMessages(prev => prev + 1);
      }
    }
  }, [messages]);
  
  // Handle message notification sound
  useEffect(() => {
    // Play sound when receiving new AI message (except first message)
    if (messages.length > 1 && messages[messages.length - 1]?.sender === "ai") {
      // In a real app, you would play a notification sound here
      // const notificationSound = new Audio('/path/to/notification.mp3');
      // notificationSound.play().catch(e => console.log("Audio play error:", e));
    }
  }, [messages]);

  // Scroll to bottom when clicking the new message indicator
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadMessages(0);
  }, []);

  // Send a message - now using real backend API
  const send = async () => {
    if (!input.trim()) return;
    
    // Save the user input before clearing it
    const userInput = input;
    
    // Hide suggestions after first message
    setShowSuggestions(false);
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: userInput,
      sender: "user",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    
    try {
      // Call the real backend API
      const response = await aiService.sendChatMessage(userInput);
      
      const aiResponse = {
        id: messages.length + 2,
        text: response.message || "I apologize, I couldn't generate a response.",
        sender: "ai",
        timestamp: new Date(),
        session_id: response.session_id
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Send to parent components if needed
      onNewCard(userInput, aiResponse.text);
      onNewSummary(`Summary for: "${userInput}"`);
      
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Show error message in chat
      const errorMessage = {
        id: messages.length + 2,
        text: `Sorry, there was an error: ${error.message}. Please make sure the backend server is running.`,
        sender: "ai",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      // Show error toast
      simpleToast.error(`Error: ${error.message}`, 5000);
    } finally {
      setIsTyping(false);
      
      // Show suggestions again after a while
      setTimeout(() => {
        if (messages.length < 5) { // Only show suggestions early in the conversation
          setShowSuggestions(true);
        }
      }, 5000);
    }
  };
  
  // Use a suggestion
  const handleSuggestion = (text) => {
    setInput(text);
    setShowSuggestions(false);
    // Wait a moment before sending to make it feel more natural
    setTimeout(() => {
      send().catch(err => console.error("Error sending suggestion:", err));
    }, 300);
  };
  
  // Toggle microphone for voice input
  const toggleMicrophone = () => {
    // In a real app, this would access the Web Speech API
    setIsMicActive(prev => !prev);
    if (!isMicActive) {
      // Simulate voice recording and recognition
      setTimeout(() => {
        setIsMicActive(false);
        setInput("This is a simulated voice message");
      }, 2000);
    }
  };
  
  // Clear chat history
  const clearChat = () => {
    // Preserve only the initial greeting message
    const initialMessage = messages[0];
    setMessages([initialMessage]);
    setShowSuggestions(true);
  };
  
  // Share conversation
  const shareConversation = () => {
    // This would normally open a share dialog, for now we'll just copy to clipboard
    const conversationText = messages
      .map(m => `${m.sender === 'user' ? 'You' : 'AI'}: ${m.text}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(conversationText)
      .then(() => {
        // Show toast notification (simplified)
        alert('Conversation copied to clipboard');
      });
  };
  
  // Generate a realistic AI response based on user input
  const generateAIResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    // Use a more dynamic response system with formatting features
    const addFormatting = (text) => {
      // Simulate markdown support by adding formatting
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
        .replace(/`(.*?)`/g, '<code>$1</code>'); // Code
    };
    
    let response = "";
    
    if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
      response = "Hello there! 👋 How can I assist you with your studies today?";
    } else if (lowerInput.includes("help") || lowerInput.includes("can you")) {
      response = "I'd be happy to help you! I can:\n\n• Answer questions\n• Provide detailed explanations\n• Create flashcards\n• Generate quizzes\n• Summarize study materials\n\nWhat would you like me to help you with first?";
    } else if (lowerInput.includes("explain") || lowerInput.includes("what is")) {
      const topic = userInput.replace(/explain|what is|what are|tell me about/gi, "").trim();
      response = `${topic ? `**Regarding ${topic}:**\n\n` : ""}This is an interesting topic! It involves key concepts that connect to fundamental principles in this subject area.\n\nHere are some important points to understand:\n\n1. The fundamental structure and organization\n2. Core principles and methodologies\n3. Practical applications and examples\n\nWould you like me to break this down further or create study materials about it?`;
    } else if (lowerInput.includes("summarize") || lowerInput.includes("summary")) {
      response = "I've created a summary of this topic that highlights the key points. You can find it in the **Summaries** section of the dashboard.\n\nThe summary includes:\n• Main concepts\n• Key relationships\n• Important definitions\n• Critical examples";
    } else if (lowerInput.includes("quiz") || lowerInput.includes("test")) {
      response = "I've generated a quiz based on this topic. The quiz contains a mix of multiple-choice, true/false, and short-answer questions to test your understanding. You can access it from the **Quiz** section of the dashboard.";
    } else if (lowerInput.includes("flashcard") || lowerInput.includes("card")) {
      response = "I've created a set of flashcards for this topic. Each card contains a key concept on one side and the explanation on the other. These cards are now available in the **Flashcards** section of your dashboard.";
    } else {
      response = "That's a great question! I've analyzed it and prepared some information that should help with your understanding.\n\nThe key points to remember are:\n\n• Focus on understanding core concepts first\n• Look for connections between ideas\n• Apply knowledge through practice problems\n\nWould you like me to create flashcards or a quiz on this topic as well?";
    }
    
    // Simulate markdown rendering
    return addFormatting(response);
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('.sidebar-toggle')) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  const ConversationHistory = () => (
    <div className="p-4 space-y-3">
      <h3 className={`font-medium text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Conversation History
      </h3>
      <div className="space-y-2">
        <div className={`p-3 rounded-lg border ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
          No saved conversations yet.
        </div>
      </div>
      <button 
        className={`w-full mt-3 py-2 rounded-lg text-sm border ${
          darkMode 
            ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
            : 'border-gray-300 hover:bg-gray-100 text-gray-700'
        }`}
      >
        Show more
      </button>
    </div>
  );

  const Settings = () => (
    <div className="p-4 space-y-4">
      <h3 className={`font-medium text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        Chat Settings
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            AI Response Style
          </label>
          <select 
            className={`w-full px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <option>Balanced</option>
            <option>Creative</option>
            <option>Precise</option>
            <option>Professional</option>
          </select>
        </div>
        
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Message Display
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button className={`px-3 py-2 rounded-lg text-sm border ${
              darkMode 
                ? 'bg-gray-900 border-blue-700 text-blue-300' 
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              Modern
            </button>
            <button className={`px-3 py-2 rounded-lg text-sm border ${
              darkMode 
                ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}>
              Classic
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Sound Effects
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className={`w-11 h-6 rounded-full peer 
              ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}  
              peer-checked:after:translate-x-full peer-checked:after:border-white 
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
              after:bg-white after:border-gray-300 after:border after:rounded-full 
              after:h-5 after:w-5 after:transition-all peer-checked:${
                darkMode ? 'bg-blue-600' : 'bg-blue-500'
              }`}></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Auto Scroll
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className={`w-11 h-6 rounded-full peer 
              ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}  
              peer-checked:after:translate-x-full peer-checked:after:border-white 
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
              after:bg-white after:border-gray-300 after:border after:rounded-full 
              after:h-5 after:w-5 after:transition-all peer-checked:${
                darkMode ? 'bg-blue-600' : 'bg-blue-500'
              }`}></div>
          </label>
        </div>
      </div>
      
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <button 
          className={`w-full py-2 rounded-lg text-sm 
            ${darkMode 
              ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' 
              : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
        >
          Clear All Conversations
        </button>
      </div>
    </div>
  );

  const UserProfile = () => (
    <div className="p-4 space-y-4">
      <div className="flex flex-col items-center text-center">
        <div className={`w-20 h-20 rounded-full ${styles?.primary || 'bg-blue-500'} flex items-center justify-center text-white text-xl font-bold mb-3`}>
          U
        </div>
        <h3 className={`font-medium text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          User
        </h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          user@example.com
        </p>
      </div>
      
      <div className={`p-3 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
        <div className="flex justify-between items-center">
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Conversations
          </span>
          <span className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            24
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Flashcards Created
          </span>
          <span className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            12
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Days Active
          </span>
          <span className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            7
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <button className={`w-full py-2 rounded-lg text-sm flex items-center justify-center gap-2
          ${darkMode 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
          </svg>
          Account Settings
        </button>
        <button className={`w-full py-2 rounded-lg text-sm flex items-center justify-center gap-2
          ${darkMode 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <motion.div 
      className={`relative overflow-hidden ${styles?.panel || 'bg-white dark:bg-gray-800'} rounded-xl border ${styles?.border || 'border-gray-200 dark:border-gray-700'} shadow-lg flex h-full w-full`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)" }}
    >
      {/* Collapsible sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className={`sidebar w-72 border-r ${styles?.border || 'border-gray-200/40 dark:border-gray-700/40'} flex flex-col z-20 overflow-hidden
              backdrop-blur-xl backdrop-saturate-150 shadow-2xl
              ${darkMode 
                ? 'bg-gradient-to-b from-gray-800/80 via-gray-800/70 to-gray-900/80 text-white' 
                : 'bg-gradient-to-b from-white/80 via-gray-50/70 to-gray-100/60 text-gray-800'}`}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
            style={{
              boxShadow: darkMode 
                ? '0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
                : '0 10px 30px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
            }}
          >
            {/* Sidebar header */}
            <div className={`p-5 border-b ${styles?.border || 'border-gray-200/30 dark:border-gray-700/30'} flex items-center justify-between`}>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2.5 ${
                  darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-blue-500">
                    <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062Zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a24.767 24.767 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25.286 25.286 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135Z"/>
                    <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2V1.866ZM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5Z"/>
                  </svg>
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    AI Chat
                  </h3>
                  <p className={`text-xs ${darkMode ? 'text-blue-300/70' : 'text-blue-500/70'}`}>
                    Personal Assistant
                  </p>
                </div>
              </div>
              <button 
                className={`p-2 rounded-full ${darkMode 
                  ? 'hover:bg-gray-700/50 bg-gray-800/50' 
                  : 'hover:bg-gray-100/80 bg-white/50'} backdrop-blur-sm shadow-sm`}
                onClick={() => setSidebarOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                </svg>
              </button>
            </div>
            
            {/* New Chat Button */}
            <div className="px-4 pt-3 pb-2">
              <motion.button
                onClick={() => {
                  clearChat();
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  darkMode
                    ? 'bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300'
                    : 'bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 text-blue-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                New Chat
              </motion.button>
            </div>
            
            {/* Sidebar tabs */}
            <div className={`flex p-1.5 gap-1 border-b ${styles?.border || 'border-gray-200/30 dark:border-gray-700/30'} mx-4 mb-2`}>
              {[
                { id: 'history', label: 'History', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z"/>
                    <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z"/>
                    <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z"/>
                  </svg>
                )},
                { id: 'settings', label: 'Settings', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
                  </svg>
                )},
                { id: 'profile', label: 'Profile', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                    <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                  </svg>
                )}
              ].map(tab => (
                <motion.button 
                  key={tab.id}
                  className={`flex-1 flex flex-col items-center justify-center py-3.5 px-2 rounded-xl text-xs
                    ${activeTab === tab.id 
                      ? darkMode 
                        ? 'bg-blue-500/20 text-blue-300 shadow-inner backdrop-blur-sm' 
                        : 'bg-blue-50/70 text-blue-600 shadow-inner backdrop-blur-sm' 
                      : darkMode
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'
                    }`}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    boxShadow: activeTab === tab.id 
                      ? darkMode 
                        ? 'inset 0 2px 5px rgba(0, 0, 0, 0.2)' 
                        : 'inset 0 2px 5px rgba(0, 0, 0, 0.05)'
                      : 'none'
                  }}
                >
                  <div className={`mb-1.5 ${activeTab === tab.id ? 'text-blue-500' : ''}`}>{tab.icon}</div>
                  <span className="font-medium tracking-wide">{tab.label}</span>
                </motion.button>
              ))}
            </div>
            
            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'history' && <ConversationHistory />}
              {activeTab === 'settings' && <Settings />}
              {activeTab === 'profile' && <UserProfile />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main chat container */}
      <div className="flex-1 flex flex-col">
        {/* Subtle background animation */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-blue-50/5 to-purple-50/10 dark:from-blue-900/5 dark:to-purple-900/10"
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%']
          }}
          transition={{ 
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear"
          }}
        ></motion.div>
      
      {/* Chat header with enhanced transitions */}
      <motion.div 
        className={`relative z-10 py-3 px-4 border-b ${styles?.border || 'border-gray-200/70 dark:border-gray-700/70'} flex items-center justify-between backdrop-blur-sm`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            className={`sidebar-toggle p-1.5 rounded-full ${darkMode 
              ? 'hover:bg-gray-700/50 bg-gray-800/40' 
              : 'hover:bg-gray-100/70 bg-gray-50/60'} 
              ${sidebarOpen ? 'hidden' : 'flex'} items-center justify-center`}
            onClick={() => setSidebarOpen(true)}
            whileHover={{ scale: 1.1, rotate: -10 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              fill="currentColor" 
              viewBox="0 0 16 16"
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -3, 0, 3, 0] }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
                repeatDelay: 5
              }}
            >
              <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
            </motion.svg>
          </motion.button>
          
          <div className="relative">
            <motion.div 
              className={`flex items-center justify-center w-10 h-10 rounded-full shadow-lg ${styles?.primary || 'bg-gradient-to-br from-blue-500 to-blue-600'} text-white`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260, 
                damping: 20
              }}
              whileHover={{ 
                scale: 1.1,
                rotate: [0, -10, 10, -10, 0],
                transition: { duration: 0.5 }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062Zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a24.767 24.767 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25.286 25.286 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135Z"/>
                <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2V1.866ZM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5Z"/>
              </svg>
            </motion.div>
            
            {/* AI status indicator with different colors based on status */}
            <motion.div 
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 
                ${aiStatus === 'online' ? 
                  (styles?.primary || 'bg-green-500') : 
                  aiStatus === 'busy' ? 
                  'bg-yellow-500' : 'bg-gray-400'
                }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              <motion.div 
                className="w-full h-full rounded-full bg-inherit opacity-75"
                animate={{ 
                  scale: aiStatus === 'online' ? [1, 1.5, 1] : [1, 1, 1]
                }}
                transition={{ 
                  duration: aiStatus === 'online' ? 2 : 0,
                  repeat: aiStatus === 'online' ? Infinity : 0
                }}
              />
            </motion.div>
          </div>
          
          <div>
            <motion.h2 
              className={`text-lg font-bold ${styles?.text || 'text-gray-800 dark:text-white'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              AI Study Assistant
            </motion.h2>
            <motion.div 
              className={`text-xs ${styles?.textSecondary || 'text-gray-500 dark:text-gray-400'} flex items-center`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className={`inline-block w-2 h-2 rounded-full 
                ${aiStatus === 'online' ? 
                  (styles?.primary || 'bg-green-500') : 
                  aiStatus === 'busy' ? 
                  'bg-yellow-500' : 'bg-gray-400'
                } mr-1.5 ${aiStatus === 'online' ? 'animate-pulse' : ''}`}
              ></span>
              {aiStatus === 'online' ? 'Online' : aiStatus === 'busy' ? 'Busy' : 'Away'} • Powered by AI
            </motion.div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Enhanced Search button with mature design */}
          <motion.button 
            className={`h-8 px-2 rounded-md border ${styles?.panel || 'bg-gray-50 dark:bg-gray-700'} ${styles?.border || 'border-gray-200 dark:border-gray-600'} ${styles?.textSecondary || 'text-gray-500 dark:text-gray-300'} shadow-sm flex items-center justify-center`}
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
            }}
            whileTap={{ scale: 0.98 }}
            title="Search conversation"
          >
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
              <span className="text-xs font-medium hidden sm:inline">Search</span>
            </div>
          </motion.button>
          
          {/* Voice button - enhanced to match the mature design */}
          <motion.button 
            className={`h-8 min-w-[32px] px-2 rounded-md flex items-center justify-center shadow-sm border ${
              isMicActive 
                ? `${styles?.primary || 'bg-red-500 border-red-600'} text-white` 
                : `${styles?.panel || 'bg-gray-50 dark:bg-gray-700'} ${styles?.border || 'border-gray-200 dark:border-gray-600'} ${styles?.textSecondary || 'text-gray-500 dark:text-gray-300'}`
            } transition-all duration-200`}
            whileHover={{ 
              scale: 1.02, 
              boxShadow: isMicActive 
                ? "0 2px 5px rgba(239, 68, 68, 0.2)" 
                : "0 2px 5px rgba(0, 0, 0, 0.05)"
            }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleMicrophone}
            title={isMicActive ? "Stop recording" : "Voice input"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
              <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
            </svg>
          </motion.button>
          
          {/* Info panel toggle button - enhanced with more professional style */}
          <motion.div className="relative">
            <motion.button 
              className={`flex items-center justify-center min-w-[32px] h-8 px-2 border ${
                showInfoPanel 
                  ? `${styles?.primary || 'bg-blue-600 border-blue-700'} text-white` 
                  : `${styles?.panel || 'bg-gray-50 dark:bg-gray-700'} ${styles?.border || 'border-gray-200 dark:border-gray-600'} ${styles?.textSecondary || 'text-gray-500 dark:text-gray-300'}`
              } rounded-md transition-all duration-200 shadow-sm`}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInfoPanel(!showInfoPanel)}
              title={showInfoPanel ? "Close info panel" : "Open info panel"}
              layout
            >
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                </svg>
                
                <motion.span 
                  className="text-xs font-medium" 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ 
                    width: showInfoPanel ? "auto" : 0,
                    opacity: showInfoPanel ? 1 : 0
                  }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  {showInfoPanel ? "Close" : "Info"}
                </motion.span>
              </div>
            </motion.button>
            
            {/* Active indicator dot */}
            {!showInfoPanel && (
              <motion.div 
                className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${styles?.primary || 'bg-blue-500'}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring" }}
                layoutId="info-indicator"
              />
            )}
          </motion.div>
        </div>
      </motion.div>
      
      {/* Chat messages area */}
      <div 
        className="flex-1 overflow-y-auto p-4 relative z-10 space-y-4" 
        style={{ scrollBehavior: 'smooth' }}
        ref={chatContainerRef}
      >
        {/* Enhanced Floating Action Button with Menu */}
        <div className="fixed bottom-20 right-5 z-20">
          <AnimatePresence>
            {/* Action menu */}
            <motion.div
              className="absolute bottom-16 right-0 mb-2"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`flex flex-col items-end gap-2 ${!showActionMenu ? 'pointer-events-none opacity-0' : ''}`}>
                <motion.button
                  className={`${styles?.panel || 'bg-white dark:bg-gray-800'} border ${styles?.border || 'border-gray-200 dark:border-gray-700'} shadow-md rounded-lg px-3 py-2 flex items-center gap-2 text-sm ${styles?.text || 'text-gray-700 dark:text-gray-200'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                  onClick={clearChat}
                  whileHover={{ x: -5, transition: { type: "spring", stiffness: 300 } }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-red-500">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                  <span>Clear Chat</span>
                </motion.button>
                
                <motion.button
                  className={`${styles?.panel || 'bg-white dark:bg-gray-800'} border ${styles?.border || 'border-gray-200 dark:border-gray-700'} shadow-md rounded-lg px-3 py-2 flex items-center gap-2 text-sm ${styles?.text || 'text-gray-700 dark:text-gray-200'} hover:bg-gray-50 dark:hover:bg-gray-700`}
                  onClick={shareConversation}
                  whileHover={{ x: -5, transition: { type: "spring", stiffness: 300 } }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className={styles?.primary || 'text-blue-500'}>
                    <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                  </svg>
                  <span>Share Chat</span>
                </motion.button>
              </div>
            </motion.div>
          
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, type: "spring" }}
            >
              {/* Main action button with dropdown functionality */}
              <motion.button
                className={`${styles?.primary || 'bg-blue-600'} shadow-lg w-12 h-12 rounded-lg flex items-center justify-center text-white border border-blue-700`}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Toggle action menu visibility
                  setShowActionMenu(!showActionMenu);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
              </motion.button>
              
              {/* Subtle glow effect */}
              <motion.div
                className="absolute -inset-1 bg-blue-500/20 rounded-lg -z-10 blur-md"
                animate={{ 
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatType: "mirror" 
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      
        {/* Info Panel - slides in from the right */}
        <AnimatePresence>
          {showInfoPanel && (
            <motion.div
              className={`absolute top-16 right-0 bottom-0 w-64 z-20 ${styles?.panel || 'bg-white dark:bg-gray-800'} border-l ${styles?.border || 'border-gray-200 dark:border-gray-700'} overflow-y-auto`}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="p-4">
                <h3 className={`font-medium mb-3 ${styles?.text || 'text-gray-800 dark:text-white'}`}>Chat Information</h3>
                
                <div className={`text-xs ${styles?.textSecondary || 'text-gray-500 dark:text-gray-400'} space-y-3`}>
                  <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium mb-1">AI Status</div>
                    <div className="flex items-center gap-2">
                      <button 
                        className={`h-4 w-4 rounded-full ${aiStatus === 'online' ? 'ring-2 ring-offset-2' : ''} ${styles?.primary || 'bg-green-500'} ring-green-500 dark:ring-offset-gray-800`}
                        onClick={() => setAiStatus('online')}
                      />
                      <button 
                        className={`h-4 w-4 rounded-full ${aiStatus === 'busy' ? 'ring-2 ring-offset-2' : ''} bg-yellow-500 ring-yellow-500 dark:ring-offset-gray-800`}
                        onClick={() => setAiStatus('busy')}
                      />
                      <button 
                        className={`h-4 w-4 rounded-full ${aiStatus === 'away' ? 'ring-2 ring-offset-2' : ''} bg-gray-400 ring-gray-400 dark:ring-offset-gray-800`}
                        onClick={() => setAiStatus('away')}
                      />
                      <span className="ml-1">Change status</span>
                    </div>
                  </div>
                  
                  <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium mb-1">Conversation Stats</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Messages</span>
                        <span>{messages.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>User messages</span>
                        <span>{messages.filter(m => m.sender === 'user').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>AI messages</span>
                        <span>{messages.filter(m => m.sender === 'ai').length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium mb-1">Actions</div>
                    <div className="space-y-2 pt-1">
                      <button 
                        className="w-full text-left flex items-center gap-2 hover:text-blue-500"
                        onClick={clearChat}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Zm-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5Z"/>
                        </svg>
                        Clear chat history
                      </button>
                      <button 
                        className="w-full text-left flex items-center gap-2 hover:text-blue-500"
                        onClick={shareConversation}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                        </svg>
                        Share conversation
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium mb-1">About</div>
                    <p className="leading-relaxed">
                      AI Study Assistant helps you learn, create flashcards, generate quizzes, and summarize your study materials through natural conversation.
                    </p>
                    <div className="mt-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles?.primary || 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'}`}>
                        v1.2.0
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {messages.map((message, index) => {
            // Determine if this message should show a date separator
            const messageDate = new Date(message.timestamp);
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const previousMessageDate = previousMessage ? new Date(previousMessage.timestamp) : null;
            const showDateSeparator = !previousMessageDate || 
              messageDate.toDateString() !== previousMessageDate.toDateString();
            
            // Determine if this message should show the avatar (group messages from same sender)
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
            const isLastInGroup = !nextMessage || nextMessage.sender !== message.sender;
            const isFirstInGroup = !previousMessage || previousMessage.sender !== message.sender;
            
            // Format the timestamp
            const timeString = messageDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Determine date separator text
            let dateSeparatorText;
            if (showDateSeparator) {
              const today = new Date();
              const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
              
              if (messageDate.toDateString() === today.toDateString()) {
                dateSeparatorText = "Today";
              } else if (messageDate.toDateString() === yesterday.toDateString()) {
                dateSeparatorText = "Yesterday";
              } else {
                dateSeparatorText = messageDate.toLocaleDateString([], {
                  month: 'short', 
                  day: 'numeric',
                  year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                });
              }
            }
            
            return (
              <React.Fragment key={message.id}>
                {/* Date separator */}
                {showDateSeparator && (
                  <motion.div 
                    className="px-4 py-3 text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-100/70 dark:text-gray-400 dark:bg-gray-700/50 backdrop-blur-sm shadow-sm">
                      {dateSeparatorText}
                    </div>
                  </motion.div>
                )}
                
                {/* Message bubble */}
                <motion.div 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${!isFirstInGroup && !showDateSeparator ? 'mt-1' : 'mt-3'}`}
                  variants={messageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                >
                  <div className={`flex ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[80%]`}>
                    {/* Only show avatar for the last message in a group */}
                    {isLastInGroup ? (
                      <motion.div className="relative">
                        <motion.img 
                          src={message.sender === 'user' ? userAvatar : aiAvatar} 
                          alt={message.sender === 'user' ? "User" : "AI"} 
                          className="w-8 h-8 rounded-full object-cover shadow-sm"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                        />
                        
                        {/* Status indicator for the AI avatar */}
                        {message.sender === 'ai' && (
                          <motion.div
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${darkMode ? 'border-gray-800' : 'border-white'} ${styles?.primary || 'bg-green-500'}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                          />
                        )}
                      </motion.div>
                    ) : (
                      <div className="w-8" /> // Spacer to keep alignment
                    )}
                
                    <motion.div 
                      className={`
                        py-3.5 px-5 rounded-3xl break-words relative group backdrop-blur-md
                        ${message.sender === 'user' 
                          ? `rounded-tr-md ${isFirstInGroup ? '' : 'rounded-br-md'} text-white` 
                          : `backdrop-blur-md bg-opacity-70 rounded-tl-md ${isFirstInGroup ? '' : 'rounded-bl-md'} ${darkMode ? 'text-white' : 'text-gray-900'}`}
                      `}
                  style={{
                    boxShadow: message.sender === 'user' 
                      ? '0 10px 30px -5px rgba(124, 58, 237, 0.25)' 
                      : darkMode
                        ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                        : '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                    background: message.sender === 'user'
                      ? isFirstInGroup 
                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)' 
                        : 'linear-gradient(135deg, rgba(124, 58, 237, 0.85) 10%, rgba(139, 92, 246, 0.85) 90%)'
                      : darkMode 
                        ? isFirstInGroup
                          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)' 
                          : 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)' 
                        : isFirstInGroup
                          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)',
                    border: message.sender === 'user'
                      ? '1px solid rgba(139, 92, 246, 0.3)'
                      : darkMode
                        ? '1px solid rgba(51, 65, 85, 0.3)'
                        : '1px solid rgba(241, 245, 249, 0.8)',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                    transform: 'translateZ(0)'
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    rotateX: '-1deg',
                    rotateY: message.sender === 'user' ? '-1deg' : '1deg',
                    y: -5,
                    z: 10,
                    boxShadow: message.sender === 'user'
                      ? '0 20px 40px -10px rgba(124, 58, 237, 0.4), 0 10px 20px -10px rgba(124, 58, 237, 0.3)' 
                      : darkMode
                        ? '0 20px 40px -10px rgba(0, 0, 0, 0.3), 0 10px 20px -10px rgba(0, 0, 0, 0.2)'
                        : '0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 10px 20px -10px rgba(0, 0, 0, 0.1)'
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30,
                    mass: 1,
                    velocity: 2
                  }}
                  onDoubleClick={() => {
                    setSelectedMessage(message);
                    setShowMessageActions(true);
                  }}
                  onHoverStart={(e) => {
                    const rect = e.target.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left; 
                    const mouseY = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateY = ((mouseX - centerX) / centerX) * 5; // Max 5 degree rotation
                    const rotateX = ((centerY - mouseY) / centerY) * 5; // Max 5 degree rotation
                    e.target.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
                  }}
                  onHoverEnd={(e) => {
                    e.target.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)`;
                  }}
                >
                  {/* Modern animated background effect */}
                  <motion.div
                    className="absolute inset-0 rounded-3xl opacity-40 -z-10 overflow-hidden"
                    initial={{ backgroundPosition: '0% 0%' }}
                    animate={{ 
                      backgroundPosition: ['0% 0%', '100% 100%']
                    }}
                    transition={{ 
                      duration: 20, 
                      repeat: Infinity, 
                      repeatType: "mirror",
                      ease: "linear" 
                    }}
                    style={{
                      background: message.sender === 'user'
                        ? 'radial-gradient(circle at top right, rgba(216, 180, 254, 0.4), transparent 80%), radial-gradient(circle at bottom left, rgba(165, 180, 252, 0.4), transparent 80%)'
                        : darkMode
                          ? 'radial-gradient(circle at top right, rgba(255, 255, 255, 0.05), transparent 80%), radial-gradient(circle at bottom left, rgba(100, 116, 139, 0.05), transparent 80%)'
                          : 'radial-gradient(circle at top right, rgba(224, 242, 254, 0.7), transparent 80%), radial-gradient(circle at bottom left, rgba(219, 234, 254, 0.7), transparent 80%)'
                    }}
                  />
                  
                  {/* Subtle accent glow */}
                  <motion.div
                    className={`absolute inset-0 rounded-3xl opacity-30 -z-20 blur-md overflow-hidden`}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: [0.9, 1.01, 0.9] }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity, 
                      repeatType: "mirror",
                      ease: "easeInOut" 
                    }}
                    style={{
                      background: message.sender === 'user'
                        ? 'radial-gradient(circle at center, rgba(139, 92, 246, 0.5), transparent 60%)'
                        : darkMode 
                          ? 'radial-gradient(circle at center, rgba(15, 23, 42, 0.8), transparent 70%)'
                          : 'radial-gradient(circle at center, rgba(224, 242, 254, 0.8), transparent 70%)'
                    }}
                  />
                  
                  {/* Message tag/category if any */}
                  {message.category && (
                    <div className="absolute -top-2 left-4">
                      <span 
                        className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium ${
                          message.category === 'question' 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' 
                            : message.category === 'answer' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                        }`}
                      >
                        {message.category}
                      </span>
                    </div>
                  )}
                  
                  {/* Message content with improved typography */}
                  <div className="space-y-1">
                    {/* Highlight if this is a reference to another message */}
                    {message.referencesMessageId && (
                      <div 
                        className={`text-xs mb-2 pb-2 border-b ${
                          message.sender === 'user' 
                            ? 'border-blue-400/30 text-blue-100' 
                            : darkMode ? 'border-gray-600/50 text-gray-400' : 'border-gray-300/50 text-gray-500'
                        } cursor-pointer hover:opacity-80 transition-opacity`}
                        onClick={() => {
                          // Find and scroll to referenced message
                          const element = document.getElementById(`message-${message.referencesMessageId}`);
                          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          // Highlight referenced message briefly
                          element?.classList.add('highlight-message');
                          setTimeout(() => element?.classList.remove('highlight-message'), 2000);
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M2.5 9.5A.5.5 0 0 1 3 9h6a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zM2.5 7.5A.5.5 0 0 1 3 7h6a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zM14 7a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM2.5 5.5A.5.5 0 0 1 3 5h6a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                            <path d="M3.762 10.015a.5.5 0 0 1 .82.242l.5 5a.5.5 0 0 1-.82.518L3.5 12.839V16a.5.5 0 0 1-.5.5h-.77a.5.5 0 0 1-.5-.5v-3.839l-.762 2.936a.5.5 0 0 1-.82-.518l.5-5a.5.5 0 0 1 .82-.242z"/>
                          </svg>
                          <span>In reply to previous message</span>
                        </div>
                      </div>
                    )}
                    
                    <p 
                      className={`text-[0.94rem] leading-relaxed whitespace-pre-wrap tracking-wide ${
                        message.sender === 'user' 
                          ? 'font-medium text-shadow-sm' 
                          : 'font-normal'
                      }`}
                      style={{
                        textShadow: message.sender === 'user' 
                          ? '0 1px 2px rgba(0, 0, 0, 0.15)' 
                          : 'none',
                        letterSpacing: '0.01em'
                      }}
                      dangerouslySetInnerHTML={{ __html: message.text }}
                    />
                  </div>
                  
                  {/* Message footer with metadata */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className={`text-[10px] ${message.sender === 'user' ? 'text-blue-100' : styles?.textSecondary || 'text-gray-500 dark:text-gray-400'}`}
                      >
                        {timeString}
                        {isLastInGroup && (
                          <span className="ml-1.5 inline-flex items-center">
                            {message.sender === 'user' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992a.252.252 0 0 1 .02-.022zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486-.943 1.179z"/>
                              </svg>
                            ) : (
                              message.id === messages[messages.length-1]?.id && isTyping ? (
                                <motion.span 
                                  className="flex gap-[2px] ml-1" 
                                  initial={{ opacity: 0 }} 
                                  animate={{ opacity: 1 }}
                                >
                                  <motion.div 
                                    className="w-1 h-1 rounded-full bg-current"
                                    animate={{ y: [0, -2, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, repeatType: "loop", delay: 0 }}
                                  />
                                  <motion.div 
                                    className="w-1 h-1 rounded-full bg-current"
                                    animate={{ y: [0, -2, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, repeatType: "loop", delay: 0.2 }}
                                  />
                                  <motion.div 
                                    className="w-1 h-1 rounded-full bg-current"
                                    animate={{ y: [0, -2, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, repeatType: "loop", delay: 0.4 }}
                                  />
                                </motion.span>
                              ) : null
                            )}
                          </span>
                        )}
                      </span>
                      
                      {/* Model name or source tag */}
                      {message.sender === 'ai' && message.model && (
                        <span className={`text-[9px] px-1 py-0.5 rounded-sm ${styles?.textSecondary || 'text-gray-500 dark:text-gray-400'} bg-gray-100/50 dark:bg-gray-700/50`}>
                          {message.model}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      {/* Message reactions with improved styling */}
                      {message.sender === 'ai' && (
                        <motion.div 
                          className="flex space-x-1 mr-1"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7 }}
                        >
                          {message.reaction && (
                            <motion.span 
                              className="text-xs bg-white/10 dark:bg-gray-700/30 backdrop-blur-sm p-1 rounded-full"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring" }}
                            >
                              {message.reaction}
                            </motion.span>
                          )}
                          {!message.reaction && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-0.5">
                              {['Like', 'Love', 'Clap', 'Great'].map((emoji, i) => (
                                <motion.button 
                                  key={emoji}
                                  className="hover:bg-white/10 dark:hover:bg-gray-600/30 rounded-full p-1 transition-colors"
                                  whileHover={{ scale: 1.2 }}
                                  whileTap={{ scale: 0.9 }}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1 * i }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMessages(msgs => msgs.map(m => 
                                      m.id === message.id ? {...m, reaction: emoji} : m
                                    ));
                                  }}
                                >
                                  <span className="text-xs">{emoji}</span>
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                      
                      {/* Read receipts for user messages */}
                      {message.sender === 'user' && (
                        <motion.div
                          className="flex items-center"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <span className="text-blue-100/70 mr-0.5 text-[9px] font-medium">Read</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="text-blue-100">
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  
                  {/* Enhanced message context menu icon with tooltip */}
                  <motion.div
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <div className="relative">
                      <motion.button
                        className={`p-1.5 rounded-full backdrop-blur-sm 
                          ${message.sender === 'user' 
                            ? 'bg-white/10 text-white/90 hover:bg-white/20 hover:text-white' 
                            : darkMode 
                              ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70 hover:text-white'
                              : 'bg-gray-100/70 text-gray-600 hover:bg-gray-200/90 hover:text-gray-800'
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessage(message);
                          setShowMessageActions(true);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                        </svg>
                        
                        {/* Tooltip */}
                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity -bottom-8 right-0 pointer-events-none">
                          <div className={`px-2 py-1 text-xs rounded shadow-lg whitespace-nowrap
                            ${message.sender === 'user' 
                              ? 'bg-blue-800 text-white'
                              : darkMode
                                ? 'bg-gray-800 text-gray-200'
                                : 'bg-white text-gray-700'
                            }`}
                          >
                            Message actions
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  </motion.div>
                  
                  {/* Rich content cards for AI messages */}
                  {message.sender === 'ai' && (
                    <>
                      {/* Link preview if message contains URL */}
                      {message.text.match(/(https?:\/\/[^\s]+)/g) && (
                        <motion.div 
                          className={`mt-2 pt-2 border-t ${darkMode ? 'border-gray-600/30' : 'border-gray-300/30'}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="text-xs font-medium px-3 py-1.5 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="mr-1 text-blue-500">
                                <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
                                <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
                              </svg>
                              Link preview
                            </div>
                            <div className="px-3 py-2">
                              <div className="text-xs text-blue-600 dark:text-blue-400 truncate">
                                {message.text.match(/(https?:\/\/[^\s]+)/g)[0]}
                              </div>
                              <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                Click to open link in secure browser
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Code snippet card */}
                      {message.text.includes('```') && (
                        <motion.div 
                          className={`mt-2 pt-2 border-t ${darkMode ? 'border-gray-600/30' : 'border-gray-300/30'}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="text-xs font-medium px-3 py-1.5 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="mr-1 text-purple-500">
                                  <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294l4-13zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0zm6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z"/>
                                </svg>
                                <span>Code snippet</span>
                              </div>
                              <div className="flex space-x-1">
                                <button className="p-0.5 hover:text-purple-500 transition-colors">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className={`px-0 py-0 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                              <div className="overflow-x-auto">
                                <pre className={`text-xs p-3 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                  {message.text.split("```").filter((_, i) => i % 2 === 1)[0]?.trim() || "// Code snippet"}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Chart/visualization card */}
                      {message.text.includes('Chart:') && (
                        <motion.div 
                          className={`mt-2 pt-2 border-t ${darkMode ? 'border-gray-600/30' : 'border-gray-300/30'}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="text-xs font-medium px-3 py-1.5 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="mr-1 text-green-500">
                                <path d="M4 11a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0v-1zm6-4a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0V7zM7 9a1 1 0 0 1 2 0v3a1 1 0 1 1-2 0V9z"/>
                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                              </svg>
                              Data visualization
                            </div>
                            <div className="p-3 flex justify-center">
                              <div className={`h-32 w-full max-w-xs flex items-center justify-center rounded border ${darkMode ? 'border-gray-700 bg-gray-800/70' : 'border-gray-200 bg-white/70'}`}>
                                <div className="flex items-end h-20 space-x-2">
                                  {[40, 65, 30, 85, 55, 70, 40, 60].map((height, i) => (
                                    <motion.div 
                                      key={i}
                                      className={`w-4 rounded-t ${darkMode ? 'bg-blue-500/70' : 'bg-blue-500'}`}
                                      initial={{ height: 0 }}
                                      animate={{ height: `${height}%` }}
                                      transition={{ delay: i * 0.1, duration: 0.5, type: "spring" }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
              </React.Fragment>
            );
          })}
        </AnimatePresence>
        
        {/* Typing indicator with enhanced animation */}
        <AnimatePresence>
          {isTyping && (
            <motion.div 
              className="flex justify-start"
              variants={typingIndicatorVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="flex items-end gap-2">
                <div className="relative">
                  <img src={aiAvatar} alt="AI" className="w-8 h-8 rounded-full" />
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
                    style={{
                      background: `conic-gradient(${styles?.primary || '#3b82f6'} ${isMicActive ? '100%' : '0%'}, transparent 0%)`
                    }}
                    animate={{
                      background: [
                        `conic-gradient(${styles?.primary || '#3b82f6'} 0%, transparent 0%)`,
                        `conic-gradient(${styles?.primary || '#3b82f6'} 100%, transparent 0%)`
                      ]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </div>
                
                <div className={`py-3 px-4 rounded-2xl rounded-tl-none shadow-sm ${styles?.panel || 'bg-gray-100 dark:bg-gray-700'}`}>
                  <div className="flex gap-1.5 items-center">
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${styles?.primary || 'bg-blue-500'}`}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.2 }}
                    />
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${styles?.primary || 'bg-blue-500'}`}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${styles?.primary || 'bg-blue-500'}`}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Quick response suggestions */}
        <AnimatePresence>
          {showSuggestions && messages.length < 4 && !isTyping && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`text-xs ${styles?.textSecondary || 'text-gray-500 dark:text-gray-400'} mb-2 ml-1`}>
                Suggested questions
              </div>
              <div className="flex gap-2 flex-wrap">
                {suggestedQuestions.map((question, index) => (
                  <motion.button
                    key={index}
                    className={`px-3 py-1.5 rounded-full text-sm border ${styles?.border || 'border-gray-200 dark:border-gray-700'} 
                             ${styles?.panel || 'bg-gray-50/80 dark:bg-gray-800/80'} ${styles?.text || 'text-gray-800 dark:text-white'}`}
                    onClick={() => handleSuggestion(question)}
                    variants={suggestionVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                    custom={index}
                  >
                    {question}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* New messages indicator - appears when user scrolls up */}
        <AnimatePresence>
          {unreadMessages > 0 && (
            <motion.div 
              className="sticky bottom-1 w-full flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button 
                className={`${styles?.primary || 'bg-blue-600'} text-white text-xs py-1.5 px-3 rounded-full shadow-lg flex items-center`}
                onClick={scrollToBottom}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{unreadMessages} new message{unreadMessages > 1 ? 's' : ''}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="ml-1">
                  <path fillRule="evenodd" d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z"/>
                </svg>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Anchor for auto-scrolling */}
        <div ref={messagesEndRef} />
        
        {/* Enhanced Message actions menu with glassmorphism and sophisticated animations */}
        <AnimatePresence>
          {showMessageActions && selectedMessage && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMessageActions(false)}
            >
              {/* Enhanced backdrop with more sophisticated blur effect */}
              <motion.div 
                className="absolute inset-0 z-0 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Background gradient with animated movement */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: darkMode 
                      ? 'radial-gradient(circle at 50% 50%, rgba(25, 25, 35, 0.8) 0%, rgba(10, 10, 15, 0.95) 100%)'
                      : 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9) 0%, rgba(240, 240, 245, 0.95) 100%)'
                  }}
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    transition: { duration: 0.5 }
                  }}
                  exit={{ 
                    scale: 1.1, 
                    opacity: 0,
                    transition: { duration: 0.3 } 
                  }}
                />
                
                {/* Animated blur effect */}
                <motion.div
                  className="absolute inset-0 backdrop-blur-md"
                  initial={{ backdropFilter: "blur(0px)" }}
                  animate={{ 
                    backdropFilter: "blur(10px)",
                    transition: { duration: 0.4 }
                  }}
                  exit={{ 
                    backdropFilter: "blur(0px)",
                    transition: { duration: 0.3 } 
                  }}
                />
                
                {/* Subtle animated particles */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute rounded-full ${darkMode ? 'bg-white' : 'bg-gray-900'} opacity-10`}
                    style={{
                      width: Math.random() * 80 + 40,
                      height: Math.random() * 80 + 40,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                    }}
                    initial={{ 
                      x: Math.random() * 100 - 50, 
                      y: Math.random() * 100 - 50, 
                      opacity: 0 
                    }}
                    animate={{ 
                      x: Math.random() * 100 - 50,
                      y: Math.random() * 100 - 50,
                      opacity: 0.1,
                      transition: { 
                        duration: Math.random() * 5 + 10,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }
                    }}
                    exit={{ opacity: 0 }}
                  />
                ))}
              </motion.div>
              
              <motion.div 
                className={`${darkMode 
                  ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90' 
                  : 'bg-gradient-to-br from-white/95 to-gray-50/95'
                } backdrop-blur-xl rounded-2xl shadow-2xl p-5 max-w-sm w-full mx-4 border ${darkMode ? 'border-gray-700/30' : 'border-gray-200/50'} relative z-10`}
                initial={{ scale: 0.9, opacity: 0, y: 30, rotateX: 5 }}
                animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15, rotateX: 5 }}
                transition={{ 
                  type: "spring", 
                  damping: 25, 
                  stiffness: 300,
                  mass: 1.2
                }}
                onClick={(e) => e.stopPropagation()}
                ref={messageActionsRef}
                style={{ perspective: "1200px" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`font-medium text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Message Actions
                    </h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                      Choose an action for this message
                    </p>
                  </div>
                  
                  <div className={`px-2 py-1 rounded-full ${darkMode 
                    ? selectedMessage.sender === 'user' ? 'bg-blue-900/30 text-blue-300' : 'bg-purple-900/30 text-purple-300'
                    : selectedMessage.sender === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  } text-xs font-medium`}>
                    {selectedMessage.sender === 'user' ? 'Your message' : 'AI response'}
                  </div>
                </div>
                
                <div className={`p-3 mb-4 rounded-lg text-sm max-h-24 overflow-y-auto ${darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50 text-gray-300' 
                  : 'bg-gray-100/70 border border-gray-200/50 text-gray-700'}`}>
                  {selectedMessage.text.length > 100 
                    ? `${selectedMessage.text.substring(0, 100)}...` 
                    : selectedMessage.text}
                </div>
                
                {/* Action buttons with staggered animations */}
                <motion.div 
                  className="space-y-1"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.1,
                      }
                    }
                  }}
                >
                  <motion.div
                    className="perspective-1000 w-full"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 }
                    }}
                  >
                    {(() => {
                      const { rippleProps, ripples } = RippleEffect({ 
                        color: darkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)",
                        duration: 0.8,
                        onClick: () => {
                          navigator.clipboard.writeText(selectedMessage.text);
                          toast && toast.success('Message copied to clipboard!', { position: 'bottom-center', duration: 2000 });
                          setShowMessageActions(false);
                        }
                      });
                      
                      return (
                        <motion.button 
                          className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 
                            ${darkMode 
                              ? 'hover:bg-gray-800/70 active:bg-gray-700/70' 
                              : 'hover:bg-gray-100/80 active:bg-gray-200/70'} transition-all`}
                          {...rippleProps}
                          whileHover={{ 
                            x: 5, 
                            boxShadow: "0 8px 25px rgba(0,0,0,0.15)", 
                            scale: 1.02,
                            rotateX: 5,
                            rotateY: 2,
                            transition: {
                              type: "spring",
                              stiffness: 400,
                              damping: 15
                            }
                          }}
                          whileTap={{ scale: 0.98, rotateX: 0, rotateY: 0 }}
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            visible: { 
                              opacity: 1, 
                              y: 0,
                              transition: {
                                type: "spring",
                                damping: 25
                              }
                            }
                          }}
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          {ripples}
                          <div className={`p-2 rounded-full ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" 
                              className="text-blue-500">
                              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                            </svg>
                          </div>
                          <div>
                            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Copy message</span>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Copy the full message text</p>
                          </div>
                        </motion.button>
                      );
                    })()}
                  </motion.div>
                  
                  {selectedMessage.sender === 'ai' && (
                    <motion.div
                      className="perspective-1000 w-full"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 }
                      }}
                    >
                      <motion.button 
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 
                          ${darkMode 
                            ? 'hover:bg-gray-800/70 active:bg-gray-700/70' 
                            : 'hover:bg-gray-100/80 active:bg-gray-200/70'} transition-all`}
                        onClick={() => {
                          // Add to flashcards or export as summary functionality
                          setShowMessageActions(false);
                          onNewCard && onNewCard("Custom Question", selectedMessage.text);
                          // Provide visual feedback
                          toast && toast.success('Added to flashcards!', { position: 'bottom-center', duration: 2000 });
                        }}
                        whileHover={{ 
                          x: 5, 
                          boxShadow: "0 8px 25px rgba(0,0,0,0.15)", 
                          scale: 1.02,
                          rotateX: 5,
                          rotateY: 2,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 15
                          }
                        }}
                        whileTap={{ scale: 0.98, rotateX: 0, rotateY: 0 }}
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { 
                            opacity: 1, 
                            y: 0,
                            transition: {
                              type: "spring",
                              damping: 25
                            }
                          }
                        }}
                        style={{ transformStyle: "preserve-3d" }}
                    >
                      <div className={`p-2 rounded-full ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" 
                          className="text-green-500">
                          <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zm-3.5-7h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z"/>
                        </svg>
                      </div>
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Add to flashcards</span>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Save this response for later review</p>
                      </div>
                    </motion.button>
                    </motion.div>
                  )}
                  
                  <motion.div
                    className="perspective-1000 w-full"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 }
                    }}
                  >
                    <motion.button 
                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 
                        ${darkMode 
                          ? 'hover:bg-gray-800/70 active:bg-gray-700/70' 
                          : 'hover:bg-gray-100/80 active:bg-gray-200/70'} transition-all`}
                      onClick={() => {
                        // Share functionality
                        if (navigator.share) {
                          navigator.share({
                            title: 'Shared from ChatBot',
                            text: selectedMessage.text
                          }).catch(err => console.log('Error sharing:', err));
                        } else {
                          navigator.clipboard.writeText(selectedMessage.text);
                          // Provide visual feedback
                          toast && toast.success('Link copied to clipboard!', { position: 'bottom-center', duration: 2000 });
                        }
                        setShowMessageActions(false);
                      }}
                      whileHover={{ 
                        x: 5, 
                        boxShadow: "0 8px 25px rgba(0,0,0,0.15)", 
                        scale: 1.02,
                        rotateX: 5,
                        rotateY: 2,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 15
                        }
                      }}
                      whileTap={{ scale: 0.98, rotateX: 0, rotateY: 0 }}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { 
                          opacity: 1, 
                          y: 0,
                          transition: {
                            type: "spring",
                            damping: 25
                          }
                        }
                      }}
                      style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className={`p-2 rounded-full ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" 
                        className="text-indigo-500">
                        <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                      </svg>
                    </div>
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Share</span>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Share this message</p>
                      </div>
                    </motion.button>
                  </motion.div>                  {selectedMessage.sender === 'user' && (
                    <motion.div
                      className="perspective-1000 w-full"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1 }
                      }}
                    >
                      <motion.button 
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 
                          ${darkMode 
                            ? 'hover:bg-gray-800/70 active:bg-gray-700/70' 
                            : 'hover:bg-gray-100/80 active:bg-gray-200/70'} transition-all`}
                        onClick={() => {
                          setMessages(msgs => msgs.filter(m => m.id !== selectedMessage.id));
                          setShowMessageActions(false);
                          // Provide visual feedback
                          toast && toast.success('Message deleted!', { position: 'bottom-center', duration: 2000 });
                        }}
                        whileHover={{ 
                          x: 5, 
                          boxShadow: "0 8px 25px rgba(0,0,0,0.15)", 
                          scale: 1.02,
                          rotateX: 5,
                          rotateY: 2,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 15
                          }
                        }}
                        whileTap={{ scale: 0.98, rotateX: 0, rotateY: 0 }}
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { 
                            opacity: 1, 
                            y: 0,
                            transition: {
                              type: "spring",
                              damping: 25
                            }
                          }
                        }}
                        style={{ transformStyle: "preserve-3d" }}
                    >
                      <div className={`p-2 rounded-full ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" 
                          className="text-red-500">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                          <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                      </div>
                      <div>
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Delete message</span>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Remove this message</p>
                      </div>
                    </motion.button>
                    </motion.div>
                  )}
                </motion.div>
                
                <motion.div 
                  className="mt-5 pt-4 border-t border-gray-200/30 dark:border-gray-700/30 flex justify-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.button 
                    className={`px-5 py-2 rounded-lg text-sm font-medium 
                      ${darkMode 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} 
                      transition-colors relative overflow-hidden`}
                    onClick={() => setShowMessageActions(false)}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.span
                      className="relative z-10"
                      initial={{ opacity: 1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      Close
                    </motion.span>
                    <motion.div
                      className={`absolute inset-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} opacity-0`}
                      whileHover={{ opacity: 1, scale: 1.5 }}
                      transition={{ duration: 0.3 }}
                      style={{ originX: 1, originY: 1 }}
                    />
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Chat input area - modernized */}
      <div className={`relative z-10 px-4 py-4 border-t ${styles?.border || 'border-gray-200/30 dark:border-gray-700/30'} backdrop-blur-md ${styles?.panel || 'bg-white/90 dark:bg-gray-800/90'} shadow-modern-sm`}>
        {/* Typing status indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div 
              className={`absolute -top-6 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-t-lg text-xs ${styles?.panel || 'bg-gray-100/90 dark:bg-gray-700/90'} ${styles?.textSecondary || 'text-gray-500 dark:text-gray-400'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
            >
              AI is typing...
            </motion.div>
          )}
        </AnimatePresence>
        
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2"
        >
          <div className="flex items-center">
            {/* File upload button */}
            <motion.button
              type="button"
              className={`p-2 rounded-full ${styles?.panel || 'bg-gray-100 dark:bg-gray-700'} ${styles?.textSecondary || 'text-gray-500 dark:text-gray-400'}`}
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13zm13 1a.5.5 0 0 1 .5.5v6l-3.775-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12v.54A.5.5 0 0 1 1 12.5v-9a.5.5 0 0 1 .5-.5h13z"/>
              </svg>
            </motion.button>
            
            {/* Voice input button */}
            <motion.button
              type="button"
              className={`p-2 rounded-full ${isMicActive ? `${styles?.primary || 'bg-red-500'} text-white` : `${styles?.panel || 'bg-gray-100 dark:bg-gray-700'} ${styles?.textSecondary || 'text-gray-500 dark:text-gray-400'}`}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMicrophone}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
                <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
              </svg>
            </motion.button>
          </div>
          
          <div className="relative flex-1 mx-1">
            <AnimatedInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isMicActive ? "Listening..." : "Message AI Study Assistant..."}
              onSubmit={send}
              className="flex-1 w-full"
              disabled={isMicActive}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            
            {/* Character count */}
            {input.length > 0 && (
              <motion.div 
                className={`absolute right-2 bottom-0 text-[10px] ${styles?.textSecondary || 'text-gray-400 dark:text-gray-500'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
              >
                {input.length}/500
              </motion.div>
            )}
          </div>
          
          <AnimatedButton
            onClick={send}
            variant="primary"
            size="medium"
            disabled={!input.trim() || isTyping}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
            </svg>}
          >
            Send
          </AnimatedButton>
        </form>
        
        {/* Smart reply suggestions when input is empty */}
        <AnimatePresence>
          {input === '' && !isTyping && messages.length >= 2 && (
            <motion.div
              className="mt-2 flex flex-wrap gap-1"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {['Tell me more', 'That sounds good', 'Create a summary'].map((text, i) => (
                <motion.button
                  key={i}
                  className={`text-xs px-4 py-2 rounded-full border ${styles?.border || 'border-gray-200/30 dark:border-gray-700/30'} 
                          ${styles?.panel || 'bg-white/80 dark:bg-gray-800/80'} backdrop-blur-md shadow-modern-sm font-medium`}
                  onClick={() => {
                    setInput(text);
                    setTimeout(() => send(), 100);
                  }}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {text}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Modern Floating Action Button (FAB) with actions menu */}
        <AnimatePresence>
          <motion.div 
            className="fixed bottom-24 right-6 z-40"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* Menu Items when FAB is open */}
            <AnimatePresence>
              {fabMenuOpen && (
                <motion.div 
                  className="absolute bottom-16 right-0 space-y-3 items-end flex flex-col-reverse"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  {/* Clear Chat Button */}
                  <motion.div 
                    className="flex items-center"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div 
                      className={`mr-2 px-2 py-1 rounded-lg text-sm ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} shadow-lg`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      Clear chat
                    </motion.div>
                    <motion.button
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg
                        ${darkMode 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-red-500 text-white hover:bg-red-600'}`}
                      onClick={() => {
                        setMessages([{ 
                          id: 1, 
                          text: "Chat cleared. How can I help you today?", 
                          sender: "ai", 
                          timestamp: new Date() 
                        }]);
                        setFabMenuOpen(false);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                      </svg>
                    </motion.button>
                  </motion.div>
                  
                  {/* Scroll to Bottom Button */}
                  <motion.div 
                    className="flex items-center"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <motion.div 
                      className={`mr-2 px-2 py-1 rounded-lg text-sm ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} shadow-lg`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      Scroll to bottom
                    </motion.div>
                    <motion.button
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg
                        ${darkMode 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
                      onClick={() => {
                        scrollToBottom();
                        setFabMenuOpen(false);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
                      </svg>
                    </motion.button>
                  </motion.div>
                  
                  {/* Share Chat Button */}
                  <motion.div 
                    className="flex items-center"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0 }}
                  >
                    <motion.div 
                      className={`mr-2 px-2 py-1 rounded-lg text-sm ${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'} shadow-lg`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      Share chat
                    </motion.div>
                    <motion.button
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg
                        ${darkMode 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-green-500 text-white hover:bg-green-600'}`}
                      onClick={() => {
                        shareConversation();
                        setFabMenuOpen(false);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                      </svg>
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Main FAB Button */}
            <motion.button
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl
                ${fabMenuOpen 
                  ? darkMode ? 'bg-red-500 text-white' : 'bg-red-500 text-white'
                  : darkMode ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                }`}
              onClick={() => setFabMenuOpen(!fabMenuOpen)}
              whileHover={{ scale: 1.05, rotate: fabMenuOpen ? 0 : 15 }}
              whileTap={{ scale: 0.95 }}
              animate={{ rotate: fabMenuOpen ? 45 : 0 }}
              style={{
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d={fabMenuOpen 
                  ? "M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-5a.5.5 0 0 0 0-1H3a.5.5 0 0 0 0 1h10z" // X icon
                  : "M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-5a.5.5 0 0 0 .5-.5V3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .5.5zm-4.5.5a.5.5 0 0 0 0-1H3a.5.5 0 0 0 0 1h.5zm9 0a.5.5 0 0 0 0-1H13a.5.5 0 0 0 0 1h-.5z" // Plus icon
                } />
              </svg>
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>
      </div>
      
      {/* Render ToastContainer if we're using our simpleToast */}
      {toast === simpleToast && <ToastContainer />}
    </motion.div>
  );
}
