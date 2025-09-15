// hooks/useUniqueOrderUsers.js
import { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { API } from '../config/api';
import { UserContext } from '../UserContext';

export function useUniqueOrderUsers(orderIds = [], shouldFetch = false) {
  const { user } = useContext(UserContext);
  const [count, setCount] = useState(0);
  const [userIds, setUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastReq = useRef(null);

  // Flatten (in case nested) + de-dupe + stringify IDs
  const uniqueIds = useMemo(() => {
    const flat = Array.isArray(orderIds) ? orderIds.flat(Infinity) : [];
    const strIds = flat
      .map(v => (v && typeof v === 'object' && v._id ? String(v._id) : String(v)))
      .filter(Boolean);
    return Array.from(new Set(strIds));
  }, [orderIds]);

  useEffect(() => {
    // Guards
    if (!user?.token) {
      console.debug('[useUniqueOrderUsers] skip: missing token');
      return;
    }
    if (!shouldFetch) {
      console.debug('[useUniqueOrderUsers] skip: shouldFetch=false');
      return;
    }
    if (uniqueIds.length === 0) {
      console.debug('[useUniqueOrderUsers] skip: no order ids');
      return;
    }

    const controller = new AbortController();
    const reqKey = `${Date.now()}-${uniqueIds.join(',')}`;
    lastReq.current = reqKey;

    console.groupCollapsed('%c[useUniqueOrderUsers] START', 'color:#2b90d9');
    console.log('ids(len):', uniqueIds.length, uniqueIds.slice(0, 10));
    console.log('url:', `${API}/order/users/unique`);
    console.groupEnd();

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API}/order/users/unique`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ ids: uniqueIds }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}: ${text || 'Request failed'}`);
        }

        const json = await res.json();
        const payload = json?.data || json;
        const ids = Array.isArray(payload?.userIds) ? payload.userIds : [];
        const c = Number.isFinite(payload?.count) ? payload.count : ids.length;

        // Only set if this is still the latest request
        if (lastReq.current === reqKey) {
          setUserIds(ids);
          setCount(c);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error('❌ useUniqueOrderUsers error:', e);
          setError(e?.message || 'Failed to fetch unique order users');
        } else {
          console.debug('[useUniqueOrderUsers] aborted');
        }
      } finally {
        if (!controller.signal.aborted && lastReq.current === reqKey) {
          setLoading(false);
          console.debug('[useUniqueOrderUsers] DONE', { count: count });
        }
      }
    })();

    // Abort on unmount or when token/ids change — NOT on shouldFetch flip
    return () => {
      controller.abort();
    };
  }, [user?.token, shouldFetch, uniqueIds]);

  return { count, userIds, loading, error };
}
