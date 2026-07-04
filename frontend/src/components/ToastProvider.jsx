import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

// Toast Context
const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

// Individual Toast Component
const Toast = ({ id, type, title, message, onDismiss }) => {
  const { darkMode } = useTheme();

  const icons = {
    success: (
      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const bgColors = {
    success: darkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
    error: darkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200',
    warning: darkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200',
    info: darkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 400 }}
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm ${bgColors[type]} ${
        darkMode ? 'shadow-black/20' : 'shadow-gray-200/50'
      }`}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <div className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </div>
        )}
        {message && (
          <div className={`text-sm ${title ? 'mt-1' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {message}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
          darkMode ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-black/5 text-gray-400'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((options) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      type: options.type || "info",
      title: options.title,
      message: options.message,
      duration: options.duration ?? 4000,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss
    if (toast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title, message) => addToast({ type: "success", title, message }), [addToast]);
  const error = useCallback((title, message) => addToast({ type: "error", title, message }), [addToast]);
  const warning = useCallback((title, message) => addToast({ type: "warning", title, message }), [addToast]);
  const info = useCallback((title, message) => addToast({ type: "info", title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, dismissToast, dismissAll, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
