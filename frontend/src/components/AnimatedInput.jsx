import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme';

export default function AnimatedInput({
  value,
  onChange,
  placeholder = "",
  type = "text",
  className = "",
  icon = null,
  onSubmit = null,
  autoFocus = false
}) {
  const { styles, darkMode } = useTheme();
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };
  
  return (
    <motion.div 
      className={`relative flex items-center overflow-hidden backdrop-blur-md
                rounded-xl border ${styles?.border || 'border-gray-200/30 dark:border-gray-700/30'}
                focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/20
                shadow-modern-sm ${darkMode ? 'bg-gray-800/40' : 'bg-white/40'} 
                ${className}`}
      initial={{ opacity: 0.95 }}
      animate={{ opacity: 1 }}
      whileFocus={{ scale: 1.005 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left icon if provided */}
      {icon && (
        <div className="pl-4">
          <motion.div 
            className={`text-gray-400 dark:text-gray-500`}
            initial={{ opacity: 0.7 }}
            whileFocus={{ opacity: 1 }}
          >
            {icon}
          </motion.div>
        </div>
      )}
      
      <motion.input
        className={`w-full py-3.5 px-4 bg-transparent ${styles?.text || 'text-gray-900 dark:text-gray-100'}
                  placeholder:text-gray-400/80 placeholder:dark:text-gray-500/80
                  focus:outline-none focus:ring-0 text-[15px] tracking-wide`}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onKeyPress={handleKeyPress}
        autoFocus={autoFocus}
      />
      
      {/* Animated focus indicator */}
      <motion.div 
        className={`absolute bottom-0 left-0 h-0.5 ${styles?.primarySolid || 'bg-violet-500'}`}
        initial={{ width: "0%" }}
        animate={{ width: value ? "100%" : "0%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
      
      {/* Subtle background glow */}
      <motion.div
        className="absolute inset-0 -z-10 opacity-20 blur-md"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: value ? [0.8, 1.01, 0.99] : 0.8, 
          opacity: value ? 0.2 : 0
        }}
        transition={{ 
          duration: 2, 
          repeat: value ? Infinity : 0, 
          repeatType: "reverse" 
        }}
        style={{
          background: `radial-gradient(circle at center, ${darkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}, transparent 70%)`,
        }}
      />
    </motion.div>
  );
}