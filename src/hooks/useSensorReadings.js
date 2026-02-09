import { useState, useEffect, useContext } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { UserContext } from '../UserContext';
import { API } from '../config/api';

/**
 * Fetches meter readings for either a single day or a date range.
 * @param {boolean} shouldFetch — when true, triggers a refetch
 * @returns {Array<object>}     — the raw readings array from the server
 */
export function useSensorReadings(shouldFetch) {
  const { mode, singleDate, fromDate, toDate } = useFilters();
  const { user } = useContext(UserContext);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!user.token || !shouldFetch) return;

    // Build querystring
    let qs = '?';
    if (mode === 'single') {
      qs += `singleDate=${encodeURIComponent(singleDate)}`;
    } else {
      qs += `fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
    }

    fetch(`${API}/sensor/readings${qs}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then(json => {
        // Assuming json.data is an array of sensor readings
        const flattenedData = json.data || [];

        // Optionally, you can map or transform the data here if needed
        setRows(flattenedData);  // Set the rows with the sensor readings
      })
      .catch(err => console.error('SensorReadings fetch error:', err));
  }, [
    user.token,
    mode, singleDate, fromDate, toDate,
    shouldFetch
  ]);
  return rows;
}
