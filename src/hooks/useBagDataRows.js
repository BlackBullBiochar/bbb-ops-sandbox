import { useState, useEffect, useContext } from 'react';
import { useFilters }  from '../contexts/FilterContext';
import { UserContext } from '../UserContext';
import { API }         from '../config/api';

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
      qs += `&from=${fromDate}&to=${toDate}`;
    }

    fetch(`${API}/bag/summary${qs}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then(json => {
        // json.data is { "YYYY-MM-DD": [ { r1_temp, r2_temp, r5_temp, … }, … ], … }
        const byDate = json.data || {};
        // flatten into one array:
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
