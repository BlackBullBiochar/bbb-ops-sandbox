import { useMemo } from 'react';

/**
 * Generates labels and data arrays for range‐mode temperature chart.
 * @param {Array<{ timestamp: string|Date, [key: string]: any }>} rows
 * @param {string} column  name of the temperature field (default 'r1_temp')
 * @returns {{ labels: string[], data: number[] }}
 */
export function useRangeTempChart(rows, column = 'r1_temp') {
  return useMemo(() => {
    if (!Array.isArray(rows)) {
      return { labels: [], data: [] };
    }

    // 1) Normalize timestamps and filter invalid
    const valid = rows
      .map(r => ({
        ...r,
        _ts: r.timestamp instanceof Date 
          ? r.timestamp 
          : new Date(r.timestamp)
      }))
      .filter(r => r._ts instanceof Date && !isNaN(r._ts.getTime()));

    // 2) Bucket by ISO‐date
    const buckets = {};
    valid.forEach(r => {
      const dateKey = r._ts.toISOString().slice(0, 10);
      const tempVal = parseFloat(r[column]);
      if (!isNaN(tempVal)) {
        buckets[dateKey] = buckets[dateKey] || [];
        buckets[dateKey].push(tempVal);
      }
    });

    // 3) Sort and average
    const dates = Object.keys(buckets).sort();
    const labels = dates;
    const data = dates.map(d => {
      const vals = buckets[d];
      return vals.reduce((sum, v) => sum + v, 0) / vals.length;
    });

    return { labels, data };
  }, [rows, column]);
}
