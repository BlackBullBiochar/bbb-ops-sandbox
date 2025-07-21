// hooks/useSiteNames.js
import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../UserContext';
import { API } from '../config/api';

/**
 * Custom hook to fetch all site names keyed by their ObjectId.
 * Depends on an endpoint GET /sites returning { data: { sites: [ { _id, name }, … ] } }
 */
export function useSiteNames() {
  const { user } = useContext(UserContext);
  const [siteMap, setSiteMap] = useState({});

  useEffect(() => {
    if (!user.token) return;
    fetch(`${API}/sites`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Fetch sites failed: ${res.status}`);
        return res.json();
      })
      .then(json => {
        const map = {};
        (json.data?.sites || []).forEach(site => {
          map[site._id] = site.name;
        });
        setSiteMap(map);
      })
      .catch(err => console.error('Site names fetch error:', err));
  }, [user.token]);

  return siteMap;
}