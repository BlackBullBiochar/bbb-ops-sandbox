import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../UserContext';
import { API } from '../config/api';

export function useBatchIds() {
  const { user } = useContext(UserContext);
  const [batchIds, setBatchIds] = useState([]);

  useEffect(() => {
    if (!user?.token) return;
    fetch(`${API}/bag/batch-ids`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Fetch batch-ids failed: ${res.status}`);
        return res.json();
      })
      .then((json) => setBatchIds(json.data?.batchIds ?? []))
      .catch((err) => console.error('useBatchIds fetch error:', err));
  }, [user?.token]);

  return batchIds;
}
