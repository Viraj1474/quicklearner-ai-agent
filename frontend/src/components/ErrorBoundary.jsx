import React, { Component } from "react";
import { motion } from "framer-motion";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to error reporting service
    console.error("Error Boundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const { darkMode = true, fallback } = this.props;

      // Custom fallback UI
      if (fallback) {
        return fallback({ 
          error: this.state.error, 
          reset: this.handleReset 
        });
      }

      // Default error UI
      return (
        <div className={`min-h-[400px] flex items-center justify-center p-8 ${
          darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-50'
        }`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`max-w-md w-full p-8 rounded-2xl border text-center ${
              darkMode 
                ? 'bg-[#1f1f1f] border-[#2a2a2a]' 
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Error icon */}
            <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
              darkMode ? 'bg-red-500/10' : 'bg-red-50'
            }`}>
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Error message */}
            <h2 className={`text-xl font-semibold mb-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Something went wrong
            </h2>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {/* Error details (collapsible) */}
            {this.state.error && (
              <details className={`mb-6 text-left ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <summary className="cursor-pointer text-sm hover:underline">
                  View technical details
                </summary>
                <pre className={`mt-2 p-3 rounded-lg text-xs overflow-auto max-h-32 ${
                  darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'
                }`}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>\n{this.state.errorInfo.componentStack}</>
                  )}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-colors ${
                  darkMode 
                    ? 'bg-white text-black hover:bg-gray-200' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-colors ${
                  darkMode 
                    ? 'bg-[#2a2a2a] text-gray-300 hover:bg-[#333]' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Reload Page
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper with hooks support
export const withErrorBoundary = (Component, fallback) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Mini error display for inline errors
export const InlineError = ({ message, onRetry, className = "" }) => {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 ${className}`}>
      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm text-red-400 flex-1">{message}</span>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-sm text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorBoundary;
