import { useState, useEffect, useContext } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { UserContext } from '../UserContext';
import { API } from '../config/api';

/**
 * Fetches meter/sensor readings for either a single day or a date range.
 * Backwards-compatible: still returns an Array of reading objects like before,
 * but normalizes Mongo Extended JSON date fields (timestamp/received_at) to ISO strings,
 * and coerces common numeric fields to numbers.
 *
 * @param {boolean} shouldFetch — when true, triggers a refetch
 * @returns {Array<object>}     — the raw readings array from the server (normalized)
 */
export function useSensorReadings(shouldFetch) {
  const { mode, singleDate, fromDate, toDate } = useFilters();
  const { user } = useContext(UserContext);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!user?.token || !shouldFetch) return;

    // Build querystring
    let qs = '?';
    if (mode === 'single') {
      qs += `singleDate=${encodeURIComponent(singleDate)}`;
    } else {
      qs += `fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
    }

    const controller = new AbortController();

    fetch(`${API}/sensor/readings${qs}`, {
      headers: { Authorization: `Bearer ${user.token}` },
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then(json => {
        // Backwards compatible: always return a flat array
        const raw = Array.isArray(json?.data) ? json.data : [];

        const normalizeDate = (v) => {
          // supports: ISO string, Date, Mongo Extended JSON { $date: ... }
          if (!v) return null;
          if (typeof v === 'string') return v;
          if (v instanceof Date) return v.toISOString();
          if (typeof v === 'object' && v.$date) return v.$date;
          return null;
        };

        const toNum = (v) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : v; // keep original if not numeric (backwards-safe)
        };

        const normalized = raw.map(r => {
          const ts = normalizeDate(r?.timestamp);
          const ra = normalizeDate(r?.received_at);

          return {
            ...r,

            // normalize date fields used across charts/sorts
            timestamp: ts ?? r?.timestamp,      // preserve original if unknown shape
            received_at: ra ?? r?.received_at,  // preserve original if unknown shape

            // coerce common meter fields (safe even if absent)
            energy: toNum(r?.energy),
            volume: toNum(r?.volume),
            flow_t: toNum(r?.flow_t),
            return_t: toNum(r?.return_t),
            delta_t: toNum(r?.delta_t),

            // If you have other common numeric sensor fields across components,
            // add them here (kept backward-safe via toNum).
          };
        });

        setRows(normalized);
      })
      .catch(err => {
        if (err?.name === 'AbortError') return;
        console.error('SensorReadings fetch error:', err);
      });

    return () => controller.abort();
  }, [user?.token, mode, singleDate, fromDate, toDate, shouldFetch]);

  return rows;
}
