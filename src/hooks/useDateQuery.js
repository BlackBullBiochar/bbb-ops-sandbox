// src/hooks/useDateQuery.js
import { useMemo } from 'react'
import { useFilters } from '../contexts/FilterContext'
import { API } from '../config/api'

/**
 * Returns just the query string for your date filter,
 * e.g. "date=2025-07-10"  or  "from=2025-07-01&to=2025-07-10"
 */
export function useDateQueryParams() {
  const { mode, singleDate, fromDate, toDate } = useFilters()

  return useMemo(() => {
    const params = new URLSearchParams()
    if (mode === 'single') {
      params.set('date', singleDate)
    } else {
      params.set('from', fromDate)
      params.set('to', toDate)
    }
    return params.toString()
  }, [mode, singleDate, fromDate, toDate])
}

export function useDataUrl(resourcePath) {
  const query = useDateQueryParams()
  const url = useMemo(
    () => `${API}/${resourcePath}${query ? `?${query}` : ''}`,
    [resourcePath, query]
  )

    console.log(`🚀 [useDataUrl] → ${url}`)

  return url

}
