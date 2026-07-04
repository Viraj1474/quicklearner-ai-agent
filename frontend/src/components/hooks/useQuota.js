import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Features locked for free users (limit === 0)
export const LOCKED_FOR_FREE = ['quiz', 'flashcards'];

export function useQuota() {
  const { isAuthenticated } = useAuth();
  const [quota, setQuota] = useState(null); // null = not loaded yet

  const fetchQuota = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/api/quota/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setQuota(await res.json());
    } catch (_) {}
  }, [isAuthenticated]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  const isFeatureLocked = (feature) => {
    if (!quota) return false;
    if (quota.is_premium) return false;
    return quota.features?.[feature]?.allowed === false && quota.features?.[feature]?.limit === 0;
  };

  const getRemaining = (feature) => quota?.features?.[feature]?.remaining ?? null;
  const getLimit = (feature) => quota?.features?.[feature]?.limit ?? null;
  const getUsed = (feature) => quota?.features?.[feature]?.used ?? 0;

  return { quota, fetchQuota, isFeatureLocked, getRemaining, getLimit, getUsed };
}
