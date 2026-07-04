import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

// Extended theme definitions
export const CUSTOM_THEMES = {
  // Classic themes from existing
  claude: {
    id: "claude",
    name: "Claude",
    description: "Clean, modern dark theme",
    preview: {
      bg: "#1a1a1a",
      card: "#1f1f1f",
      accent: "#ffffff",
      text: "#e5e5e5",
    },
    colors: {
      bg: "#1a1a1a",
      bgSecondary: "#1f1f1f",
      border: "#2a2a2a",
      text: "#e5e5e5",
      textMuted: "#888888",
      accent: "#ffffff",
      accentText: "#000000",
    },
  },
  nord: {
    id: "nord",
    name: "Nord",
    description: "Arctic, bluish color palette",
    preview: {
      bg: "#2E3440",
      card: "#3B4252",
      accent: "#88C0D0",
      text: "#ECEFF4",
    },
    colors: {
      bg: "#2E3440",
      bgSecondary: "#3B4252",
      border: "#4C566A",
      text: "#ECEFF4",
      textMuted: "#D8DEE9",
      accent: "#88C0D0",
      accentText: "#2E3440",
    },
  },
  dracula: {
    id: "dracula",
    name: "Dracula",
    description: "Dark theme with vibrant colors",
    preview: {
      bg: "#282A36",
      card: "#44475A",
      accent: "#BD93F9",
      text: "#F8F8F2",
    },
    colors: {
      bg: "#282A36",
      bgSecondary: "#44475A",
      border: "#6272A4",
      text: "#F8F8F2",
      textMuted: "#6272A4",
      accent: "#BD93F9",
      accentText: "#282A36",
    },
  },
  solarizedDark: {
    id: "solarizedDark",
    name: "Solarized Dark",
    description: "Precision colors for dark mode",
    preview: {
      bg: "#002B36",
      card: "#073642",
      accent: "#268BD2",
      text: "#839496",
    },
    colors: {
      bg: "#002B36",
      bgSecondary: "#073642",
      border: "#586E75",
      text: "#839496",
      textMuted: "#657B83",
      accent: "#268BD2",
      accentText: "#FDF6E3",
    },
  },
  solarizedLight: {
    id: "solarizedLight",
    name: "Solarized Light",
    description: "Easy on the eyes, light mode",
    preview: {
      bg: "#FDF6E3",
      card: "#EEE8D5",
      accent: "#268BD2",
      text: "#657B83",
    },
    colors: {
      bg: "#FDF6E3",
      bgSecondary: "#EEE8D5",
      border: "#93A1A1",
      text: "#657B83",
      textMuted: "#93A1A1",
      accent: "#268BD2",
      accentText: "#FDF6E3",
    },
  },
  monokai: {
    id: "monokai",
    name: "Monokai",
    description: "Classic code editor theme",
    preview: {
      bg: "#272822",
      card: "#3E3D32",
      accent: "#F92672",
      text: "#F8F8F2",
    },
    colors: {
      bg: "#272822",
      bgSecondary: "#3E3D32",
      border: "#75715E",
      text: "#F8F8F2",
      textMuted: "#75715E",
      accent: "#F92672",
      accentText: "#F8F8F2",
    },
  },
  github: {
    id: "github",
    name: "GitHub Dark",
    description: "GitHub's dark color scheme",
    preview: {
      bg: "#0D1117",
      card: "#161B22",
      accent: "#58A6FF",
      text: "#C9D1D9",
    },
    colors: {
      bg: "#0D1117",
      bgSecondary: "#161B22",
      border: "#30363D",
      text: "#C9D1D9",
      textMuted: "#8B949E",
      accent: "#58A6FF",
      accentText: "#0D1117",
    },
  },
  oceanBlue: {
    id: "oceanBlue",
    name: "Ocean Blue",
    description: "Deep blue ocean vibes",
    preview: {
      bg: "#0F1729",
      card: "#1A2744",
      accent: "#00D9FF",
      text: "#E1E8F0",
    },
    colors: {
      bg: "#0F1729",
      bgSecondary: "#1A2744",
      border: "#2D3F5F",
      text: "#E1E8F0",
      textMuted: "#7A8BA3",
      accent: "#00D9FF",
      accentText: "#0F1729",
    },
  },
  rosePine: {
    id: "rosePine",
    name: "Rosé Pine",
    description: "All natural pine, faux fur",
    preview: {
      bg: "#191724",
      card: "#1F1D2E",
      accent: "#EBBCBA",
      text: "#E0DEF4",
    },
    colors: {
      bg: "#191724",
      bgSecondary: "#1F1D2E",
      border: "#26233A",
      text: "#E0DEF4",
      textMuted: "#6E6A86",
      accent: "#EBBCBA",
      accentText: "#191724",
    },
  },
};

const ThemePicker = ({ isOpen, onClose }) => {
  const { darkMode } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(
    localStorage.getItem("customTheme") || "claude"
  );
  const [previewTheme, setPreviewTheme] = useState(null);

  const applyTheme = (themeId) => {
    const theme = CUSTOM_THEMES[themeId];
    if (!theme) return;

    // Save to localStorage
    localStorage.setItem("customTheme", themeId);
    setSelectedTheme(themeId);

    // Apply CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    // Apply to body/html for immediate effect
    document.body.style.backgroundColor = theme.colors.bg;
  };

  const handleSelect = (themeId) => {
    applyTheme(themeId);
    onClose();
  };

  const themes = Object.values(CUSTOM_THEMES);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 w-full max-w-2xl max-h-[80vh] z-50"
            style={{ x: "-50%", y: "-50%" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className={`
              mx-4 rounded-2xl border shadow-2xl overflow-hidden
              ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}
            `}>
              {/* Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${
                darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'}`}>
                    <svg className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5"/>
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Choose Theme
                    </h2>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      Personalize your study environment
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-[#2a2a2a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Theme Grid */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {themes.map((theme, index) => (
                    <motion.button
                      key={theme.id}
                      onClick={() => handleSelect(theme.id)}
                      onMouseEnter={() => setPreviewTheme(theme.id)}
                      onMouseLeave={() => setPreviewTheme(null)}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all text-left
                        ${selectedTheme === theme.id
                          ? 'border-white ring-2 ring-white/20'
                          : darkMode
                            ? 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                            : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Theme Preview */}
                      <div 
                        className="h-20 rounded-lg mb-3 overflow-hidden shadow-inner"
                        style={{ backgroundColor: theme.preview.bg }}
                      >
                        <div className="p-2 h-full flex flex-col">
                          {/* Mini header */}
                          <div className="flex items-center gap-1.5 mb-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: theme.preview.accent }}
                            />
                            <div 
                              className="h-1.5 w-8 rounded-full opacity-50"
                              style={{ backgroundColor: theme.preview.text }}
                            />
                          </div>
                          {/* Mini content */}
                          <div 
                            className="flex-1 rounded p-1.5"
                            style={{ backgroundColor: theme.preview.card }}
                          >
                            <div 
                              className="h-1 w-12 rounded-full mb-1"
                              style={{ backgroundColor: theme.preview.text, opacity: 0.6 }}
                            />
                            <div 
                              className="h-1 w-8 rounded-full"
                              style={{ backgroundColor: theme.preview.text, opacity: 0.4 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Theme Info */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {theme.name}
                          </h3>
                          {selectedTheme === theme.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full bg-white flex items-center justify-center"
                            >
                              <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            </motion.div>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {theme.description}
                        </p>
                      </div>

                      {/* Color swatches */}
                      <div className="flex gap-1 mt-2">
                        {Object.values(theme.preview).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className={`flex items-center justify-between px-6 py-4 border-t ${
                darkMode ? 'border-[#2a2a2a] bg-[#1f1f1f]' : 'border-gray-200 bg-gray-50'
              }`}>
                <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Currently using: {CUSTOM_THEMES[selectedTheme]?.name || "Claude"}
                </span>
                <button
                  onClick={onClose}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    darkMode 
                      ? 'bg-white text-black hover:bg-gray-200' 
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook to apply theme on mount
export const useCustomTheme = () => {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("customTheme");
    if (savedTheme && CUSTOM_THEMES[savedTheme]) {
      const theme = CUSTOM_THEMES[savedTheme];
      const root = document.documentElement;
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value);
      });
    }
  }, []);
};

export default ThemePicker;
