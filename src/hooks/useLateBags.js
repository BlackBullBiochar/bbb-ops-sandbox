import { useState, useEffect, useContext } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { UserContext } from '../UserContext';
import { API } from '../config/api';

export function useLateBags(siteCode, shouldFetch = false) {
  const { mode, singleDate, fromDate, toDate } = useFilters();
  const { user } = useContext(UserContext);

  const [lateBags, setLateBags] = useState([]);
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

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API}/bag/charcode-summary${qs}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const json = await res.json();

        const bags = Array.isArray(json.data?.bagging)
          ? json.data.bagging
          : Object.values(json.data?.bagging || {}).flat();

        const late = bags.filter(bag => {
          const bagged = new Date(bag.bagging_date);
          const logged = new Date(bag.locations?.bagging?.time);
          const isValid = !isNaN(bagged) && !isNaN(logged);
          const diffDays = isValid ? (logged - bagged) / (1000 * 60 * 60 * 24) : null;

          // Always log both dates, even if invalid
          return isValid && diffDays > 3;
        });

        setLateBags(late);
      } catch (err) {
        console.error('❌ useLateBags fetch error:', err);
        setError('Failed to fetch late bags');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    lateBags,
    count: lateBags.length,
    loading,
    error
  };
}
