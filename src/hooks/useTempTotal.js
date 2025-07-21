// hooks/useRunningHours.js
import { useMemo } from 'react';

/**
 * Calculates total time (in hours) that the given fields
 * stayed within [low, high] over the provided timestamped rows.
 *
 * @param {Array<{ timestamp: string|Date, [field: string]: string|number }>} rows
 * @param {number} low   lower bound (inclusive)
 * @param {number} high  upper bound (inclusive)
 * @param {string[]} fields  which numeric fields to check (e.g. ['r1_temp','r2_temp'])
 * @returns {{ hours: number, milliseconds: number }}
 */
export function useRunningHours(rows, low, high, fields = ['r1_temp','r2_temp']) {
  return useMemo(() => {
    if (!Array.isArray(rows) || rows.length < 2) {
      return { hours: 0, milliseconds: 0 };
    }

    // normalize & sort by timestamp
    const sorted = rows
      .map(r => {
        const ts = r.timestamp instanceof Date
          ? r.timestamp
          : new Date(r.timestamp);
        return { ...r, _ts: ts };
      })
      .filter(r => r._ts instanceof Date && !isNaN(r._ts.getTime()))
      .sort((a, b) => a._ts - b._ts);

    let totalMs = 0;

    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      // check every field in‐spec at both ends
      const inSpecA = fields.every(f => {
        const v = parseFloat(a[f]);
        return !isNaN(v) && v >= low && v <= high;
      });
      const inSpecB = fields.every(f => {
        const v = parseFloat(b[f]);
        return !isNaN(v) && v >= low && v <= high;
      });
      if (inSpecA && inSpecB) {
        totalMs += (b._ts - a._ts);
      }
    }

    return {
      milliseconds: totalMs,
      hours: totalMs / 1000 / 60 / 60
    };
  }, [rows, low, high, fields.join(',')]);
}
