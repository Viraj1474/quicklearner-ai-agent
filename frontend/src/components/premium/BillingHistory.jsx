import React, { useEffect, useState } from 'react';
import { getBillingHistory } from '../services/authService';

function BillingHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getBillingHistory();
        if (!mounted) return;
        setItems(data?.items || []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Unable to load billing history');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Billing history
        </h4>
      </div>

      {loading && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading history...</p>}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No payments yet.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="mt-3 space-y-2">
          {items.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-black/20"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {(item.provider || 'provider').toUpperCase()} {item.status}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {(((item.amount ?? item.amount_cents) || 0) / 100).toFixed(2)} {item.currency}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BillingHistory;
