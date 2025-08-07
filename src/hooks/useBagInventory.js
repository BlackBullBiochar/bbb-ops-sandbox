import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../UserContext';
import { API } from '../config/api';

export function useBagInventory(shouldFetch = false) {
  const { user } = useContext(UserContext);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.token || !shouldFetch) return;

    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API}/bag/summary/inventory`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const json = await res.json();
        setStats(json);
      } catch (err) {
        console.error('❌ useBagEBCStats fetch error:', err);
        setError('Failed to fetch bag stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user.token, shouldFetch]);

  return {
    stats,
    loading,
    error
  };
}
