// theme.js - Advanced theming system with modern design elements
import { createContext, useContext, useState, useEffect } from 'react';

// Theme context to provide theming throughout the app
export const ThemeContext = createContext();

// Available themes
export const THEMES = {
  MODERN: 'modern',       // New default modern theme
  MIDNIGHT: 'midnight',   // Dark elegant theme
  GRADIENT: 'gradient',   // Colorful gradient theme
  MINIMAL: 'minimal',     // Clean minimal theme
};

  // Theme provider component
export function ThemeProvider({ children }) {
  // Get saved theme or default to modern
  const [theme, setTheme] = useState(THEMES.MODERN);
  const [darkMode, setDarkMode] = useState(true);  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || THEMES.CYBER;
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setTheme(savedTheme);
    setDarkMode(savedDarkMode);
    
    // Apply dark mode class to document
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Update theme and save to local storage
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Toggle dark mode and save to local storage
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    
    // Apply dark mode class to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  // Theme color variables and styles based on the current theme
  const themeStyles = {
    [THEMES.MODERN]: {
      primary: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
      primarySolid: 'bg-violet-600',
      secondary: 'bg-gradient-to-r from-sky-400 to-indigo-500',
      secondarySolid: 'bg-sky-500',
      accent: 'bg-gradient-to-r from-emerald-400 to-cyan-400',
      accentSolid: 'bg-emerald-500',
      text: darkMode ? 'text-gray-50' : 'text-gray-800',
      textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
      textAccent: darkMode ? 'text-violet-300' : 'text-violet-600',
      background: darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-gray-50 to-gray-100',
      panel: darkMode 
        ? 'bg-gray-800/90 backdrop-blur-md border border-gray-700/50' 
        : 'bg-gray-50/90 backdrop-blur-md border border-gray-200/50',
      border: darkMode ? 'border-gray-700/50' : 'border-gray-200/50',
      glow: darkMode ? 'shadow-lg shadow-violet-500/10' : 'shadow-lg shadow-violet-500/5',
      gridBg: darkMode 
        ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 to-gray-900' 
        : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-50 to-gray-100',
    },
    [THEMES.MIDNIGHT]: {
      primary: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      primarySolid: 'bg-blue-600',
      secondary: 'bg-gradient-to-r from-fuchsia-500 to-purple-600',
      secondarySolid: 'bg-fuchsia-600',
      accent: 'bg-gradient-to-r from-cyan-400 to-sky-500',
      accentSolid: 'bg-cyan-500',
      text: darkMode ? 'text-gray-100' : 'text-gray-800',
      textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
      textAccent: darkMode ? 'text-blue-300' : 'text-blue-600',
      background: darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-[#0c1324] to-gray-900' 
        : 'bg-gradient-to-br from-gray-100 to-gray-200',
      panel: darkMode 
        ? 'bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b]/50' 
        : 'bg-gray-50/90 backdrop-blur-md border border-gray-200/50',
      border: darkMode ? 'border-[#1e293b]/50' : 'border-gray-200/50',
      glow: darkMode ? 'shadow-lg shadow-blue-700/10' : 'shadow-lg shadow-blue-500/5',
      gridBg: darkMode 
        ? 'bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-[#0f172a] to-gray-900' 
        : 'bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-gray-100 to-gray-200',
    },
    [THEMES.GRADIENT]: {
      primary: 'bg-gradient-to-r from-rose-500 to-orange-400',
      primarySolid: 'bg-rose-500',
      secondary: 'bg-gradient-to-r from-violet-500 to-purple-500',
      secondarySolid: 'bg-violet-500',
      accent: 'bg-gradient-to-r from-amber-400 to-yellow-300',
      accentSolid: 'bg-amber-400',
      text: darkMode ? 'text-gray-50' : 'text-gray-800',
      textMuted: darkMode ? 'text-gray-400' : 'text-gray-500',
      textAccent: darkMode ? 'text-rose-300' : 'text-rose-600',
      background: darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-[#1a1a2e] to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 to-rose-50',
      panel: darkMode 
        ? 'bg-gray-900/80 backdrop-blur-md border border-gray-800/50' 
        : 'bg-gray-50/80 backdrop-blur-md border border-gray-200/50',
      border: darkMode ? 'border-gray-800/50' : 'border-gray-200/50',
      glow: darkMode ? 'shadow-lg shadow-rose-500/10' : 'shadow-lg shadow-rose-500/5',
      gridBg: darkMode 
        ? 'bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#1a1a2e] to-gray-900' 
        : 'bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-gray-50 via-rose-50 to-gray-50',
    },
    [THEMES.MINIMAL]: {
      primary: 'bg-neutral-900 dark:bg-neutral-100',
      primarySolid: 'bg-neutral-900 dark:bg-neutral-100',
      secondary: 'bg-neutral-800 dark:bg-neutral-200',
      secondarySolid: 'bg-neutral-800 dark:bg-neutral-200',
      accent: 'bg-neutral-700 dark:bg-neutral-300',
      accentSolid: 'bg-neutral-700 dark:bg-neutral-300',
      text: darkMode ? 'text-neutral-100' : 'text-neutral-900',
      textMuted: darkMode ? 'text-neutral-400' : 'text-neutral-500',
      textAccent: darkMode ? 'text-neutral-300' : 'text-neutral-700',
      background: darkMode 
        ? 'bg-neutral-900' 
        : 'bg-neutral-50',
      panel: darkMode 
        ? 'bg-neutral-800/90 backdrop-blur-md border border-neutral-700/50' 
        : 'bg-neutral-50/90 backdrop-blur-md border border-neutral-200/50',
      border: darkMode ? 'border-neutral-700/50' : 'border-neutral-200/50',
      glow: 'shadow-md',
      gridBg: darkMode 
        ? 'bg-neutral-900' 
        : 'bg-neutral-50',
    },
  };

  // Ensure theme is a valid key in themeStyles
  const validTheme = Object.values(THEMES).includes(theme) ? theme : THEMES.MODERN;
  
  return (
    <ThemeContext.Provider value={{ 
      theme: validTheme, 
      changeTheme, 
      darkMode, 
      toggleDarkMode, 
      styles: themeStyles[validTheme] || themeStyles[THEMES.CYBER],
      allStyles: themeStyles,
      allThemes: THEMES
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  // Make sure we have valid styles
  const safeStyles = context.styles || {
    // Default fallback styles
    primary: 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
    primarySolid: 'bg-violet-600',
    secondary: 'bg-gradient-to-r from-sky-400 to-indigo-500',
    secondarySolid: 'bg-sky-500',
    accent: 'bg-gradient-to-r from-emerald-400 to-cyan-400',
    accentSolid: 'bg-emerald-500',
    text: 'text-gray-800 dark:text-gray-50',
    textMuted: 'text-gray-500 dark:text-gray-400',
    textAccent: 'text-violet-600 dark:text-violet-300',
    background: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800',
    panel: 'bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50',
    border: 'border-gray-200/50 dark:border-gray-700/50',
    glow: 'shadow-lg shadow-violet-500/10 dark:shadow-violet-500/5',
    gridBg: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800',
  };
  
  return {
    ...context,
    styles: safeStyles
  };
}
