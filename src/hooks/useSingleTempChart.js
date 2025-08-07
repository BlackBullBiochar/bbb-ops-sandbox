import { useMemo } from 'react';

/**
 * Generates labels and a single data series for a temperature chart.
 * @param {Array<{ timestamp: string|Date, [key: string]: string|number }>} rows
 * @param {string} field  one of "r1_temp", "r2_temp", "t5_temp"
 * @returns {{ labels: string[], data: (number|null)[] }}
 */
export function useSingleTempChart(rows, field) {
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
          : new Date(r.timestamp.replace(/Z$/, '')) // treat as local if you prefer
      }))
      .filter(r => r._ts instanceof Date && !isNaN(r._ts.getTime()))
      .sort((a, b) => a._ts - b._ts);

    const labels = [];
    const data = [];

    for (const { _ts } of sorted) {
      // build UTC‐based label so you avoid the +1h BST shift
      labels.push(_ts.toTimeString().split(' ')[0]);
    }

    // Now build the single series
    for (const row of sorted) {
      const raw = row[field];
      const num = parseFloat(raw);
      data.push(Number.isNaN(num) ? null : num);
    }
    return { labels, data };
  }, [rows, field]);
}
