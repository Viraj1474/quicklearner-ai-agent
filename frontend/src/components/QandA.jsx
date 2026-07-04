import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.4,
      when: "beforeChildren",
      staggerChildren: 0.1 
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 100,
      damping: 10 
    }
  }
};

const answerVariants = {
  hidden: { opacity: 0, y: 20, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 150,
      when: "beforeChildren",
      staggerChildren: 0.03
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    height: 0,
    transition: {
      duration: 0.3
    }
  }
};

const textCharVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      type: "spring",
      damping: 16,
      stiffness: 200
    }
  }
};

function QandA() {
  const { styles, darkMode } = useTheme();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTypingEffect, setShowTypingEffect] = useState(false);
  const [typedChars, setTypedChars] = useState(0);

  const handleAsk = () => {
    if (!question.trim() || loading) return;
    
    setLoading(true);
    setAnswer("");
    
    // Simulate API delay
    setTimeout(() => {
      const aiResponse = "This is a sample AI response that demonstrates the typing effect animation. The AI generates this answer based on your question and provides helpful information.";
      setAnswer(aiResponse);
      setLoading(false);
      setShowTypingEffect(true);
      
      // Simulate typing effect
      let chars = 0;
      const typingInterval = setInterval(() => {
        chars += 1;
        if (chars <= aiResponse.length) {
          setTypedChars(chars);
        } else {
          clearInterval(typingInterval);
          setShowTypingEffect(false);
        }
      }, 20);
    }, 1500);
  };

  return (
    <motion.div 
      className={`${styles?.panel || 'bg-white dark:bg-gray-800'} rounded-xl border ${styles?.border || 'border-gray-200 dark:border-gray-700'} p-6 flex flex-col gap-4 shadow-lg relative overflow-hidden`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background animation */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-blue-50/10 to-purple-50/10 dark:from-blue-900/10 dark:to-purple-900/10 z-0"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%']
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear"
        }}
      />
      
      {/* Content wrapper */}
      <div className="relative z-10">
        <motion.div 
          className="flex items-center gap-2 mb-2"
          variants={itemVariants}
        >
          <motion.div 
            className={`h-8 w-8 flex items-center justify-center rounded-lg ${styles?.secondary || 'bg-purple-500'}`}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </motion.div>
          
          <motion.h2 
            className={`text-xl font-semibold ${styles?.text || 'text-gray-800 dark:text-white'}`}
            variants={itemVariants}
          >
            Practice Q&A
          </motion.h2>
        </motion.div>
        
        <motion.p 
          className={`text-sm mb-4 ${styles?.textSecondary || 'text-gray-500 dark:text-gray-400'}`}
          variants={itemVariants}
        >
          Ask any question to get an AI-powered answer
        </motion.p>
        
        <motion.div 
          className="relative"
          variants={itemVariants}
        >
          <motion.input
            type="text"
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className={`w-full border ${styles?.border || 'border-gray-300 dark:border-gray-600'} rounded-lg px-4 py-3 ${styles?.text || 'text-gray-800 dark:text-white'} bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
            disabled={loading}
            whileFocus={{ boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)" }}
          />
          {question.trim() && (
            <motion.button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              onClick={() => setQuestion("")}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </motion.button>
          )}
        </motion.div>

        <motion.button
          onClick={handleAsk}
          disabled={!question.trim() || loading}
          className={`mt-3 ${styles?.primary || 'bg-blue-600'} text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center w-full
                    ${!question.trim() || loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          variants={itemVariants}
          whileHover={{ scale: (question.trim() && !loading) ? 1.03 : 1, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
          whileTap={{ scale: (question.trim() && !loading) ? 0.97 : 1 }}
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Thinking...
            </div>
          ) : (
            <div className="flex items-center">
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
                animate={{ rotate: question.trim() ? [0, 15, -15, 0] : 0 }}
                transition={{ duration: 0.5, repeat: 3, repeatDelay: 2 }}
              >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </motion.svg>
              Ask AI
            </div>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {answer && (
          <motion.div 
            className={`${styles?.panel || 'bg-gray-50 dark:bg-gray-700'} rounded-lg p-4 ${styles?.text || 'text-gray-700 dark:text-gray-100'} border ${styles?.border || 'border-gray-200 dark:border-gray-700'} mt-2 relative`}
            variants={answerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
              style={{
                background: `${styles?.primary || '#3b82f6'}`
              }}
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              transition={{ duration: 0.4 }}
            />
            
            <div className="flex items-center gap-2 mb-2">
              <motion.div 
                className={`h-6 w-6 rounded-full bg-gradient-to-br ${styles?.primary || 'from-blue-500'} ${styles?.secondary || 'to-purple-500'} flex items-center justify-center`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
              
              <motion.span 
                className="font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Answer:
              </motion.span>
              
              {loading && (
                <motion.div 
                  className="ml-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex gap-1">
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${styles?.primary || 'bg-blue-500'}`}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1 }}
                    />
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${styles?.primary || 'bg-blue-500'}`}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.2, delay: 0.1 }}
                    />
                    <motion.div 
                      className={`w-2 h-2 rounded-full ${styles?.primary || 'bg-blue-500'}`}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.2, delay: 0.2 }}
                    />
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="pl-2">
              {showTypingEffect ? (
                <div className="relative min-h-[40px]">
                  <p>{answer.substring(0, typedChars)}</p>
                  <motion.div 
                    className={`absolute right-0 bottom-0 w-2 h-5 ${styles?.secondary || 'bg-purple-500'}`}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                </div>
              ) : (
                <div className="relative min-h-[40px]">
                  <p>{answer}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default QandA;
