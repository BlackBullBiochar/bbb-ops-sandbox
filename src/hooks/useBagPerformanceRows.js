import { useState, useEffect, useContext } from 'react';
import { useFilters }  from '../contexts/FilterContext';
import { UserContext } from '../UserContext';
import { API }         from '../config/api';

export function useBagPerformanceCount(siteCode, shouldFetch = false) {
  const { mode, singleDate, fromDate, toDate } = useFilters();
  const { user } = useContext(UserContext);

  const [bagging, setBagging] = useState([]);
  const [pickup, setPickup] = useState([]);
  const [pickupBags, setPickupBags] = useState([]);
  const [delivery, setDelivery] = useState([]);
  const [application, setApplication] = useState([]);
  const [sameDayCount, setSameDayCount] = useState(0);
  const [sameDayRate, setSameDayRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.token || !shouldFetch || !siteCode) {
      return;
    }

    let qs = `?site=${siteCode}`;
    if (mode === 'single') {
      qs += `&date=${singleDate}`;
    } else {
      qs += `&from=${fromDate}&to=${toDate}`;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API}/bag/charcode-summary${qs}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const json = await res.json();

        const b = json.data?.bagging || [];
        const p = json.data?.pickup || [];
        const d = json.data?.delivery || [];
        const a = json.data?.application || [];

        setBagging(b);
        setPickup(p);
        setDelivery(d);
        setApplication(a);

        const filtered = p.filter(bag =>
          bag?.pickup_date && bag?.delivery_date
        );
        setPickupBags(filtered);

        const sameDay = filtered.filter(bag => {
          const pickedUp = new Date(bag.pickup_date).toISOString().slice(0, 10);
          const delivered = new Date(bag.delivery_date).toISOString().slice(0, 10);
          const isSameDay = pickedUp === delivered;

          return isSameDay;
        });

        const sameDayTotal = sameDay.length;
        const filteredTotal = filtered.length;
        const rate = filteredTotal ? (sameDayTotal / filteredTotal) * 100 : 0;

        setSameDayCount(sameDayTotal);
        setSameDayRate(rate);

      } catch (err) {
        console.error('❌ useBagPerformanceCount fetch error:', err);
        setError('Failed to fetch bag performance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    user.token,
    siteCode,
    mode,
    singleDate,
    fromDate,
    toDate,
    shouldFetch
  ]);

  return {
    counts: {
      bagging: bagging.length,
      pickup: pickup.length,
      delivery: delivery.length,
      application: application.length,
      sameDayCount,
      sameDayRate: sameDayRate.toFixed(2)
    },
    rows: {
      bagging,
      pickup,
      delivery,
      application
    },
    loading,
    error
  };
}
