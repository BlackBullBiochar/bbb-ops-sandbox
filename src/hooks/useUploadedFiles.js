import { useState, useEffect, useContext, useCallback } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { UserContext } from '../UserContext';
import { API } from '../config/api';

/**
 * Custom hook to fetch and manage uploaded files (temp or forms)
 * based on date filters only, triggered explicitly.
 * @param {'data'|'forms'} type  'data' for temp, 'forms' for form uploads
 * @param {boolean} shouldFetch  true when fetch button has been clicked
 */
export function useUploadedFiles(type, shouldFetch) {
  const { mode, singleDate, fromDate, toDate } = useFilters();
  const { user } = useContext(UserContext);
  const [buckets, setBuckets] = useState({});
  const [rowsCache, setRowsCache] = useState({});
  const [expanded, setExpanded] = useState([]);

  useEffect(() => {
    if (!user.token || !shouldFetch) return;
    const endpoint = type === 'data' ? 'temp' : 'forms';
    const qs = mode === 'single'
      ? `?date=${singleDate}`
      : `?from=${fromDate}&to=${toDate}`;
    fetch(`${API}/${endpoint}${qs}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Fetch ${endpoint} failed: ${res.status}`);
        return res.json();
      })
      .then(json => {
        const uploads = (json.data && json.data.uploads) || [];
        const map = {};
        uploads.forEach(doc => {
          map[doc._id] = doc;
        });
        setBuckets(map);
      })
      .catch(err => console.error(`Bucket fetch error (${type}):`, err));
  }, [user.token, type, shouldFetch, mode, singleDate, fromDate, toDate]);

  const toggleBucket = useCallback(
    async (bucketId) => {
      if (!expanded.includes(bucketId)) {
        const path = type === 'data'
          ? 'temp/data'
          : 'forms/data';
        const url = `${API}/${path}?id=${bucketId}`;
        try {
          const res = await fetch(url, { headers: { Authorization: `Bearer ${user.token}` } });
          if (!res.ok) throw new Error(`Fetch rows failed: ${res.status}`);
          const payload = await res.json();
          let dataRows = [];
          if (payload.data) {
            if (Array.isArray(payload.data)) dataRows = payload.data;
            else if (Array.isArray(payload.data.data)) dataRows = payload.data.data;
          }
          setRowsCache(prev => ({ ...prev, [bucketId]: dataRows }));
        } catch (err) {
          console.error(`Toggle fetch error (${type}):`, err);
        }
      }
      setExpanded(prev =>
        prev.includes(bucketId)
          ? prev.filter(id => id !== bucketId)
          : [...prev, bucketId]
      );
    },
    [expanded, type, user.token]
  );

  const deleteBucket = useCallback(
    async (bucketId) => {
      if (!window.confirm(`Delete all data for "${bucketId}"?`)) return;
      const path = type === 'data' ? 'temp' : 'forms';
      const url = `${API}/${path}?id=${bucketId}`;
      try {
        const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${user.token}` } });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
        setBuckets(prev => {
          const copy = { ...prev };
          delete copy[bucketId];
          return copy;
        });
        setRowsCache(prev => {
          const copy = { ...prev };
          delete copy[bucketId];
          return copy;
        });
        setExpanded(prev => prev.filter(id => id !== bucketId));
      } catch (err) {
        console.error(`Delete error (${type}):`, err);
      }
    },
    [type, user.token]
  );

  const deleteRow = useCallback(
    async (bucketId, rowIndex) => {
      if (!window.confirm(`Delete this row?`)) return;
      const path = type === 'data' ? 'temp/row' : 'forms/row';
      const url = `${API}/${path}?bucketId=${bucketId}&rowIndex=${rowIndex}`;
      try {
        const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${user.token}` } });
        if (!res.ok) throw new Error(`Delete row failed: ${res.status}`);
        setRowsCache(prev => {
          const copy = { ...prev };
          if (copy[bucketId]) {
            copy[bucketId] = copy[bucketId].filter((_, idx) => idx !== rowIndex);
          }
          return copy;
        });
      } catch (err) {
        console.error(`Delete row error (${type}):`, err);
      }
    },
    [type, user.token]
  );

  return { buckets, rowsCache, expanded, toggleBucket, deleteBucket, deleteRow };
}