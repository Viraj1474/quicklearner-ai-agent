import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Toast notification store
const toasts = [];
let toastId = 0;
let setToastsState = null;

// Export toast functions that components can use
export const toast = {
  success: (message, options = {}) => addToast(message, 'success', options),
  error: (message, options = {}) => addToast(message, 'error', options),
  info: (message, options = {}) => addToast(message, 'info', options),
  warning: (message, options = {}) => addToast(message, 'warning', options)
};

// Function to add a new toast
function addToast(message, type, options) {
  const id = toastId++;
  const newToast = {
    id,
    message,
    type,
    position: options.position || 'bottom-center',
    duration: options.duration || 3000
  };

  toasts.push(newToast);
  if (setToastsState) {
    setToastsState([...toasts]);
  }

  // Auto-remove toast after duration
  setTimeout(() => {
    removeToast(id);
  }, newToast.duration);

  return id;
}

// Function to remove a toast by ID
function removeToast(id) {
  const index = toasts.findIndex(t => t.id === id);
  if (index !== -1) {
    toasts.splice(index, 1);
    if (setToastsState) {
      setToastsState([...toasts]);
    }
  }
}

// Toast container component
export function ToastContainer() {
  const [toastsState, setToastsStateLocal] = useState([]);
  
  useEffect(() => {
    setToastsState = setToastsStateLocal;
    return () => {
      setToastsState = null;
    };
  }, []);

  // Group toasts by position
  const positionGroups = {};
  toastsState.forEach(toast => {
    if (!positionGroups[toast.position]) {
      positionGroups[toast.position] = [];
    }
    positionGroups[toast.position].push(toast);
  });

  return (
    <>
      {Object.entries(positionGroups).map(([position, positionToasts]) => (
        <div 
          key={position} 
          className={`fixed z-50 flex flex-col ${getPositionClasses(position)}`}
        >
          <AnimatePresence>
            {positionToasts.map(toast => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                className={`m-2 p-3 rounded-lg shadow-lg ${getTypeClasses(toast.type)} max-w-md`}
                onClick={() => removeToast(toast.id)}
              >
                <div className="flex items-center">
                  {getIcon(toast.type)}
                  <p className="ml-2 text-sm font-medium">{toast.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ))}
    </>
  );
}

// Helper function to get position classes
function getPositionClasses(position) {
  switch (position) {
    case 'top-left':
      return 'top-0 left-0';
    case 'top-center':
      return 'top-0 left-1/2 transform -translate-x-1/2';
    case 'top-right':
      return 'top-0 right-0';
    case 'bottom-left':
      return 'bottom-0 left-0';
    case 'bottom-center':
      return 'bottom-0 left-1/2 transform -translate-x-1/2';
    case 'bottom-right':
      return 'bottom-0 right-0';
    default:
      return 'bottom-0 left-1/2 transform -translate-x-1/2';
  }
}

// Helper function to get type-specific classes
function getTypeClasses(type) {
  switch (type) {
    case 'success':
      return 'bg-green-500 text-white';
    case 'error':
      return 'bg-red-500 text-white';
    case 'info':
      return 'bg-blue-500 text-white';
    case 'warning':
      return 'bg-yellow-500 text-white';
    default:
      return 'bg-gray-700 text-white';
  }
}

// Helper function to get type-specific icon
function getIcon(type) {
  const iconClassName = "w-5 h-5";
  
  switch (type) {
    case 'success':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClassName} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case 'error':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClassName} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    case 'info':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClassName} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    case 'warning':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClassName} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
}