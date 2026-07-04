/**
 * Productivity Hooks
 * 
 * Provides productivity features:
 * - Recent items tracking
 * - Quick actions
 * - Draft auto-save
 * - Session activity tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Storage keys
const RECENT_ITEMS_KEY = 'productivity_recent_items';
const DRAFTS_KEY = 'productivity_drafts';
const SESSION_KEY = 'productivity_session';

// ===== RECENT ITEMS HOOK =====

/**
 * Track and access recently used items
 * @param {number} maxItems - Maximum items to keep (default: 10)
 */
export function useRecentItems(maxItems = 10) {
  const [recentItems, setRecentItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_ITEMS_KEY) || '[]');
    } catch {
      return [];
    }
  });

  // Add item to recent
  const addRecentItem = useCallback((item) => {
    setRecentItems(prev => {
      // Create new item with timestamp
      const newItem = {
        ...item,
        id: item.id || `${item.type}-${Date.now()}`,
        timestamp: Date.now(),
      };
      
      // Remove duplicates and add to front
      const filtered = prev.filter(i => i.id !== newItem.id);
      const updated = [newItem, ...filtered].slice(0, maxItems);
      
      // Persist
      try {
        localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
      } catch {}
      
      return updated;
    });
  }, [maxItems]);

  // Remove item
  const removeRecentItem = useCallback((id) => {
    setRecentItems(prev => {
      const updated = prev.filter(i => i.id !== id);
      try {
        localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Clear all
  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
    try {
      localStorage.removeItem(RECENT_ITEMS_KEY);
    } catch {}
  }, []);

  // Get items by type
  const getByType = useCallback((type) => {
    return recentItems.filter(i => i.type === type);
  }, [recentItems]);

  return {
    recentItems,
    addRecentItem,
    removeRecentItem,
    clearRecentItems,
    getByType,
  };
}

// ===== AUTO-SAVE DRAFTS HOOK =====

/**
 * Auto-save drafts with debouncing
 * @param {string} key - Unique key for this draft
 * @param {number} debounceMs - Debounce delay (default: 1000ms)
 */
export function useDraft(key, debounceMs = 1000) {
  const [draft, setDraft] = useState(() => {
    try {
      const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
      return drafts[key]?.content || '';
    } catch {
      return '';
    }
  });
  
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef(null);

  // Save draft with debounce
  const saveDraft = useCallback((content) => {
    setDraft(content);
    setIsSaving(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      try {
        const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
        drafts[key] = {
          content,
          savedAt: Date.now(),
        };
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
        setLastSaved(Date.now());
      } catch {}
      setIsSaving(false);
    }, debounceMs);
  }, [key, debounceMs]);

  // Clear this draft
  const clearDraft = useCallback(() => {
    setDraft('');
    try {
      const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
      delete drafts[key];
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    } catch {}
  }, [key]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    draft,
    saveDraft,
    clearDraft,
    lastSaved,
    isSaving,
    hasDraft: draft.length > 0,
  };
}

// ===== SESSION ACTIVITY HOOK =====

/**
 * Track session activity for timeout warnings
 * @param {number} warningMinutes - Minutes before showing warning (default: 25)
 * @param {number} timeoutMinutes - Minutes before session timeout (default: 30)
 */
export function useSessionActivity(warningMinutes = 25, timeoutMinutes = 30) {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  
  const warningMs = warningMinutes * 60 * 1000;
  const timeoutMs = timeoutMinutes * 60 * 1000;

  // Update last activity
  const updateActivity = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    setShowWarning(false);
    setIsTimedOut(false);
    try {
      sessionStorage.setItem(SESSION_KEY, String(now));
    } catch {}
  }, []);

  // Check session status
  useEffect(() => {
    const checkSession = () => {
      const now = Date.now();
      const elapsed = now - lastActivity;
      
      if (elapsed >= timeoutMs) {
        setIsTimedOut(true);
        setShowWarning(false);
        setRemainingTime(0);
      } else if (elapsed >= warningMs) {
        setShowWarning(true);
        setRemainingTime(Math.ceil((timeoutMs - elapsed) / 1000));
      } else {
        setShowWarning(false);
        setRemainingTime(null);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);
    checkSession();

    return () => clearInterval(interval);
  }, [lastActivity, warningMs, timeoutMs]);

  // Listen for user activity
  useEffect(() => {
    // Only track discrete interactions, not continuous events like scroll
    const events = ['mousedown', 'keydown', 'touchstart'];
    let lastUpdate = 0;
    const throttleMs = 5000; // Only update every 5 seconds max
    
    const handleActivity = () => {
      if (!showWarning && !isTimedOut) {
        const now = Date.now();
        if (now - lastUpdate > throttleMs) {
          lastUpdate = now;
          updateActivity();
        }
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [showWarning, isTimedOut, updateActivity]);

  return {
    lastActivity,
    showWarning,
    isTimedOut,
    remainingTime,
    updateActivity,
    extendSession: updateActivity,
  };
}

// ===== QUICK ACTIONS HOOK =====

/**
 * Quick actions registry and execution
 */
export function useQuickActions() {
  const [actions, setActions] = useState([]);

  // Register an action
  const registerAction = useCallback((action) => {
    setActions(prev => {
      const exists = prev.some(a => a.id === action.id);
      if (exists) {
        return prev.map(a => a.id === action.id ? action : a);
      }
      return [...prev, action];
    });
  }, []);

  // Unregister an action
  const unregisterAction = useCallback((id) => {
    setActions(prev => prev.filter(a => a.id !== id));
  }, []);

  // Execute action by id
  const executeAction = useCallback((id) => {
    const action = actions.find(a => a.id === id);
    if (action?.execute) {
      action.execute();
      return true;
    }
    return false;
  }, [actions]);

  // Get actions by category
  const getByCategory = useCallback((category) => {
    return actions.filter(a => a.category === category);
  }, [actions]);

  // Search actions
  const searchActions = useCallback((query) => {
    const q = query.toLowerCase();
    return actions.filter(a => 
      a.name?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.keywords?.some(k => k.toLowerCase().includes(q))
    );
  }, [actions]);

  return {
    actions,
    registerAction,
    unregisterAction,
    executeAction,
    getByCategory,
    searchActions,
  };
}

// ===== KEYBOARD SHORTCUTS HOOK =====

/**
 * Global keyboard shortcut handler
 */
export function useKeyboardShortcuts(shortcuts = []) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger in input fields
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        // Allow Escape in inputs
        if (e.key !== 'Escape') return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.action?.();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// ===== FOCUS MANAGEMENT HOOK =====

/**
 * Focus trap and management for modals/dialogs
 */
export function useFocusTrap(ref, isActive = true) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [ref, isActive]);
}

export default {
  useRecentItems,
  useDraft,
  useSessionActivity,
  useQuickActions,
  useKeyboardShortcuts,
  useFocusTrap,
};
