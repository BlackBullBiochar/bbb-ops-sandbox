// hooks/useHeatTotal.js
import { useMemo } from 'react';

/**
 * Returns the difference between the first and last valid reading of a given numeric field.
 *
 * @param {Array<{ meterTs?: string|Date, timestamp?: string|Date, [key: string]: any }>} readings
 * @param {string} field  the numeric field to diff (e.g. "energy")
 * @returns {number|null}  last(field) - first(field), or null if not enough valid data
 */
export function useHeatTotal(readings, field = 'energy') {
  return useMemo(() => {

    if (!Array.isArray(readings) || readings.length < 2) {
      return null;
    }

    // normalize timestamps and sort
    const sorted = readings
      .map(r => {
        const rawTs = r.meterTs ?? r.timestamp;
        const _ts = rawTs instanceof Date ? rawTs : new Date(rawTs);
        return { ...r, _ts };
      })
      .filter(r => r._ts instanceof Date && !isNaN(r._ts.getTime()))
      .sort((a, b) => a._ts - b._ts);

    // find first valid numeric
    let firstVal = null;
    for (const row of sorted) {
      const n = parseFloat(row[field]);
      if (!Number.isNaN(n)) {
        firstVal = n;
        break;
      }
    }

    // find last valid numeric
    let lastVal = null;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const row = sorted[i];
      const n = parseFloat(row[field]);
      if (!Number.isNaN(n)) {
        lastVal = n;
        break;
      }
    }

    if (firstVal === null || lastVal === null) {
      return null;
    }

    const delta = lastVal - firstVal;
    return delta;
  }, [readings, field]);
}
