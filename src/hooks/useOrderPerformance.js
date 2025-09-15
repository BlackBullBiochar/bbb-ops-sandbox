import { useState, useEffect, useContext } from 'react';
import { useFilters } from '../contexts/FilterContext';
import { UserContext } from '../UserContext';
import { API } from '../config/api';

export function useOrderPerformance(shouldFetch = false) {
  const { mode, singleDate, fromDate, toDate } = useFilters();
  const { user } = useContext(UserContext);

  const [orders, setOrders] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (
      !user?.token ||
      !shouldFetch ||
      (mode === 'single' && !singleDate) ||
      (mode !== 'single' && (!fromDate || !toDate))
    ) {
      return;
    }

    let qs = '';
    if (mode === 'single') {
      qs = `?from=${singleDate}`;
    } else {
      qs = `?from=${fromDate}&to=${toDate}`;
    }

    const url = `${API}/order/summary${qs}`;

    const fetchPerformance = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${user.token}` }
        });


        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const json = await res.json();

        const list = Array.isArray(json?.data?.orders) ? json.data.orders : [];
        setOrders(list);

        // sum per-order totals
        const grand = list.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
        setTotalAmount(grand);
      } catch (err) {
        console.error('❌ useOrderPerformance fetch error:', err);
        setError('Failed to fetch order performance');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [
    user.token,
    shouldFetch,
    mode,
    singleDate,
    fromDate,
    toDate
  ]);
  
  return {
    orders,
    totalAmount,
    loading,
    error
  };
}
