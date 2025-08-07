import { useState, useEffect, useContext } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { UserContext } from '../UserContext';
import { API } from '../config/api';

export function useUniqueAppliedUsers(siteCode, shouldFetch = false) {
  const { mode, singleDate, fromDate, toDate } = useFilters();
  const { user } = useContext(UserContext);

  const [uniqueUserIds, setUniqueUserIds] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (
      !user?.token ||
      !shouldFetch ||
      !siteCode ||
      (mode === 'single' && !singleDate) ||
      (mode !== 'single' && (!fromDate || !toDate))
    ) return;

    let qs = `?site=${siteCode}`;
    if (mode === 'single') {
      qs += `&date=${singleDate}`;
    } else {
      qs += `&from=${fromDate}&to=${toDate}`;
    }

    const fetchUniqueUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API}/bag/summary/users${qs}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const json = await res.json();

        setUniqueUserIds(json.userIds || []);
        setCount(json.uniqueUserCount || 0);
      } catch (err) {
        console.error('❌ useUniqueAppliedUsers fetch error:', err);
        setError('Failed to fetch unique user count');
      } finally {
        setLoading(false);
      }
    };

    fetchUniqueUsers();
  }, [
    user.token,
    siteCode,
    mode,
    singleDate,
    fromDate,
    toDate,
    shouldFetch
  ]);

  return {
    uniqueUserIds,
    count,
    loading,
    error
  };
}
