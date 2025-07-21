import { useMemo } from 'react';

/**
 * Generates labels and a single data series for a temperature chart
 * over an arbitrary date‐range (i.e. no daily aggregation—just
 * plot every point in time order).
 *
 * @param {Array<{ timestamp: string|Date, [key: string]: string|number }>} rows
 * @param {string} field  one of "r1_temp", "r2_temp", "t5_temp"
 * @returns {{ labels: string[], data: (number|null)[] }}
 */
export function useSingleRangeTempChart(rows, field) {
  return useMemo(() => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { labels: [], data: [] };
    }

    // 1) normalize & sort by timestamp
    const sorted = rows
      .map(r => ({
        ...r,
        _ts: r.timestamp instanceof Date
          ? r.timestamp
          : new Date(r.timestamp)
      }))
      .filter(r => r._ts instanceof Date && !isNaN(r._ts.getTime()))
      .sort((a, b) => a._ts - b._ts);

    // 2) Use full ISO datetime for each label
    const labels = sorted.map(r => r._ts.toISOString());

    // 3) Pull out the numeric values (or null)
    const data = sorted.map(r => {
      const num = parseFloat(r[field]);
      return Number.isNaN(num) ? null : num;
    });

    return { labels, data };
  }, [rows, field]);
}
