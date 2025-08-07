// hooks/useRangeHours.js
import { useMemo } from 'react';
import { useFilters } from '../contexts/FilterContext';

/**
 * Returns the total number of hours between fromDate (00:00) and toDate (23:59:59.999).
 * If mode==='single', always returns 24.
 */
export function useRangeHours() {
  const { mode, singleDate, fromDate, toDate } = useFilters();

  return useMemo(() => {
    // single-day → 24 hours
    if (mode === 'single' && singleDate) {
      return 24;
    }

    // need both endpoints
    if (!fromDate || !toDate) {
      return 0;
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);
    // extend to end of day
    end.setHours(23, 59, 59, 999);

    // invalid dates?
    if (isNaN(start) || isNaN(end) || end < start) {
      return 0;
    }

    const ms = end.getTime() - start.getTime();
    // round up partial hours
    const hours = Math.ceil(ms / (1000 * 60 * 60));
    return hours;
  }, [mode, singleDate, fromDate, toDate]);
}
