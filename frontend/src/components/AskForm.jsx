import React, { useState } from "react";
import * as ai from "./services/aiService"; // keep your service path
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
      staggerChildren: 0.15
    }
  }
};

const formItemVariants = {
  hidden: { opacity: 0, y: 10 },
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

// Loading indicator animation
const pulseVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1,
    opacity: 1,
    transition: { 
      duration: 0.3 
    }
  },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: "loop"
    }
  }
};

export default function AskForm({ onNewSummary = () => {} }) {
  const { styles, darkMode } = useTheme();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const summary = await (ai.generateSummary ? ai.generateSummary(topic) : Promise.resolve(`Summary for "${topic}"`));
      onNewSummary(summary);
      setTopic("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className={`${styles?.panel || 'bg-white dark:bg-gray-800'} rounded-xl border ${styles?.border || 'border-gray-200 dark:border-gray-700'} p-4 shadow-lg relative overflow-hidden`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)" }}
    >
      {/* Background gradient animation */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-blue-50/10 to-purple-50/10 dark:from-blue-900/10 dark:to-purple-900/10 z-0"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%']
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear"
        }}
      />
      
      {/* Decorative elements */}
      <motion.div 
        className="absolute -top-10 -right-10 w-20 h-20 rounded-full"
        style={{
          background: `radial-gradient(circle, ${styles?.primary || '#3b82f6'}40 0%, transparent 70%)`,
          opacity: 0.1,
          filter: 'blur(15px)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.1, 0.05]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      <div className="relative z-10">
        <form onSubmit={submit} className="flex flex-col md:flex-row gap-3">
          <motion.div
            className="flex-1 relative"
            variants={formItemVariants}
          >
            <motion.input
              className={`w-full py-3 px-4 rounded-lg border ${styles?.border || 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900 ${styles?.text || 'text-gray-900 dark:text-white'} focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm`}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic to summarize..."
              whileFocus={{ boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)" }}
              disabled={loading}
            />
            
            {topic.length > 0 && (
              <motion.button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                onClick={() => setTopic("")}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </motion.div>
          
          <motion.button 
            className={`${styles?.primary || 'bg-blue-600'} rounded-lg py-3 px-6 text-white font-semibold flex items-center justify-center gap-2 
                      ${loading ? 'cursor-wait' : 'hover:bg-blue-700'} 
                      ${!topic.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            type="submit" 
            disabled={loading || !topic.trim()}
            variants={formItemVariants}
            whileHover={{ 
              scale: (!loading && topic.trim()) ? 1.03 : 1,
              boxShadow: (!loading && topic.trim()) ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none"
            }}
            whileTap={{ scale: (!loading && topic.trim()) ? 0.97 : 1 }}
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  className="flex items-center"
                  initial="hidden"
                  animate={["visible", "pulse"]}
                  exit="hidden"
                  variants={pulseVariants}
                >
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing
                </motion.div>
              ) : (
                <motion.div 
                  key="submit"
                  className="flex items-center"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={pulseVariants}
                >
                  <motion.svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    animate={{ rotate: topic.trim() ? [0, 360] : 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </motion.svg>
                  Generate
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
