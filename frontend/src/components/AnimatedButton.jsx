import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme';

const buttonVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.05,
    y: -2,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      damping: 17
    }
  },
  tap: { 
    scale: 0.95,
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 500, 
      damping: 10
    }
  }
};

const glowVariants = {
  rest: { opacity: 0, scale: 0.95 },
  hover: { 
    opacity: 0.8,
    scale: 1.1,
    transition: { 
      duration: 0.4
    }
  }
};

// Button sizes
const sizes = {
  small: "py-1.5 px-3.5 text-sm font-medium",
  medium: "py-2.5 px-5 text-base font-medium",
  large: "py-3.5 px-7 text-lg font-medium"
};

// Button variants
const variants = {
  primary: (styles) => `${styles?.primary || 'bg-gradient-to-r from-violet-600 to-violet-500'} text-white shadow-lg shadow-violet-500/25`,
  secondary: (styles) => `${styles?.secondary || 'bg-gradient-to-r from-sky-600 to-sky-500'} text-white shadow-lg shadow-sky-500/25`,
  accent: (styles) => `${styles?.accent || 'bg-gradient-to-r from-emerald-600 to-emerald-500'} text-white shadow-lg shadow-emerald-500/25`,
  outline: (styles) => `bg-transparent backdrop-blur-sm border-2 ${styles?.border || 'border-gray-200/50 dark:border-gray-700/50'} ${styles?.text || 'text-gray-900 dark:text-gray-100'}`,
  ghost: (styles) => `bg-transparent backdrop-blur-sm ${styles?.text || 'text-gray-900 dark:text-gray-100'} hover:bg-gray-100/50 dark:hover:bg-gray-800/30`,
};

export default function AnimatedButton({ 
  children, 
  onClick, 
  className = "", 
  type = "button", 
  variant = "primary", 
  size = "medium",
  disabled = false,
  icon = null
}) {
  const { styles, darkMode } = useTheme();
  
  const variantClass = variants[variant] ? variants[variant](styles) : variants.primary(styles);
  const sizeClass = sizes[size] || sizes.medium;
  
  return (
    <motion.button
      className={`relative overflow-hidden rounded-xl ${sizeClass} ${variantClass} ${className} backdrop-blur-sm flex items-center justify-center gap-2
                  ${disabled ? 'opacity-50 cursor-not-allowed saturate-50' : 'cursor-pointer'}`}
      onClick={disabled ? undefined : onClick}
      type={type}
      disabled={disabled}
      variants={buttonVariants}
      initial="rest"
      whileHover={disabled ? "" : "hover"}
      whileTap={disabled ? "" : "tap"}
      transition={{ duration: 0.3 }}
    >
      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0"
        style={{
          background: darkMode 
            ? 'radial-gradient(circle at center, rgba(255,255,255,0.5), rgba(255,255,255,0) 70%)'
            : 'radial-gradient(circle at center, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)',
          mixBlendMode: 'overlay'
        }}
        variants={glowVariants}
      />
      
      {/* Button content */}
      <div className="relative z-10 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {children}
      </div>
    </motion.button>
  );
}