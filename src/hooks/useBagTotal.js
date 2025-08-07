// hooks/useBagStats.js
import { useMemo } from 'react';

/**
 * @param {Array<{ weight: number|string }>} bagRows
 * @returns {{ totalWeight: number, bagCount: number }}
 */
export function useBagStats(bagRows) {
  return useMemo(() => {
    if (!Array.isArray(bagRows) || bagRows.length === 0) {
      return { totalWeight: 0, bagCount: 0 };
    }

    const bagCount = bagRows.length;
    const totalWeight = bagRows.reduce((sum, row) => {
      const w = typeof row.weight === 'string'
        ? parseFloat(row.weight)
        : row.weight;
      return sum + (Number.isNaN(w) ? 0 : w);
    }, 0);

    return { totalWeight, bagCount };
  }, [bagRows]);
}
