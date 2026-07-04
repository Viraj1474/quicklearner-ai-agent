import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "./theme";

export default function Navbar() {
  const { styles, darkMode, toggleDarkMode, theme, changeTheme, allThemes } = useTheme();
  
  // Navbar animation variants
  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Staggered children animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.nav
      className={`fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-7xl z-50
                 ${styles?.panel || 'bg-white/80 dark:bg-gray-800/80'} 
                 backdrop-blur-md
                 ${styles?.border || 'border border-gray-200/50 dark:border-gray-700/50'}
                 ${styles?.glow || 'shadow-modern-lg'}
                 flex justify-between items-center px-3 sm:px-4 md:px-6 rounded-2xl`}
      variants={navVariants}
      initial="hidden"
      animate="visible"
      style={{
        height: "64px", // Exact height for layout calculations
        maxHeight: "64px", // Ensure it doesn't grow
        boxSizing: "border-box" // Include padding and border in height
      }}
    >
      {/* Logo with brand name */}
      <motion.div 
        className="flex items-center gap-3"
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <motion.div 
          className={`h-9 w-9 rounded-xl overflow-hidden ${styles?.primary || 'bg-gradient-to-br from-violet-500 to-fuchsia-500'} flex items-center justify-center flex-shrink-0 ${styles?.glow || 'shadow-lg shadow-violet-500/20'}`}
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.95, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <span className="text-white font-bold text-lg">Q</span>
        </motion.div>
        <div className="font-bold text-base sm:text-lg truncate max-w-[10rem] sm:max-w-none">
          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${darkMode ? 'from-violet-300 to-fuchsia-300' : 'from-violet-600 to-fuchsia-600'}`}>
            Quicklearner AI
          </span>
        </div>
      </motion.div>
      
      {/* Navigation links */}
      <motion.div 
        className="hidden md:flex items-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {['Dashboard', 'Analytics', 'Library', 'Settings'].map((item, index) => (
          <motion.a 
            key={item}
            variants={itemVariants}
            className={`relative text-sm font-medium ${styles?.textMuted || 'text-gray-600 dark:text-gray-300'} cursor-pointer mx-4 py-1 px-1 transition-colors duration-200 ease-in-out`}
            whileHover={{ 
              color: darkMode ? 'rgb(167, 139, 250)' : 'rgb(124, 58, 237)' 
            }}
          >
            {item}
            <motion.span 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 dark:bg-violet-400 rounded-full origin-left"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.2 }}
            />
          </motion.a>
        ))}
      </motion.div>
      
      {/* Theme controls */}
      <div className="flex items-center gap-4">
        <motion.button
          className={`relative overflow-hidden group backdrop-blur-sm 
                    ${styles?.panel || 'bg-white/50 dark:bg-gray-800/50'} 
                    border ${styles?.border || 'border-gray-200/30 dark:border-gray-700/30'} 
                    rounded-full p-2.5 focus:outline-none ${styles?.glow || 'shadow-modern-sm'}`}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={() => toggleDarkMode()}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <motion.div 
            className="relative z-10 w-5 h-5 flex items-center justify-center"
            initial={false}
            animate={{ 
              rotateZ: darkMode ? 180 : 0,
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              duration: 0.5,
              scale: { times: [0, 0.5, 1], duration: 0.5 }
            }}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-amber-400">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-indigo-600">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </motion.div>
        </motion.button>
      </div>
    </motion.nav>
  );
}
