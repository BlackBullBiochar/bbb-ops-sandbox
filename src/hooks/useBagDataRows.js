import { useState, useEffect, useContext } from 'react';
import { useFilters }  from '../contexts/FilterContext';
import { UserContext } from '../UserContext';
import { API }         from '../config/api';

const addDays = (yyyy_mm_dd, days) => {
  if (!yyyy_mm_dd) return '';
  // force UTC midnight to avoid timezone weirdness
  const d = new Date(`${yyyy_mm_dd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export function useBagDataRows(siteCode, shouldFetch) {
  const { mode, singleDate, fromDate, toDate } = useFilters();
  const { user } = useContext(UserContext);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!user.token || !shouldFetch) return;

    // Build query string
    let qs = `?site=${siteCode}`;
    if (mode === 'single') {
      qs += `&date=${singleDate}`;
    } else {
      // 👇 make "to" inclusive by sending next day
      const toInclusiveFix = addDays(toDate, 1);
      qs += `&from=${fromDate}&to=${toInclusiveFix}`;
    }

    fetch(`${API}/bag/summary${qs}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then(json => {
        const byDate = json.data || {};
        const flat = Object.values(byDate).flat();
        setRows(flat);
      })
      .catch(err => console.error('BagData summary fetch error:', err));
  }, [
    user.token,
    mode,
    singleDate,
    fromDate,
    toDate,
    shouldFetch,
    siteCode
  ]);

  return rows;
}
