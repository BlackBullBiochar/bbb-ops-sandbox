import { useState, useEffect, useCallback, useContext } from "react";
import { UserContext } from "../UserContext";
import { API } from "../config/api";

/**
 * Fetches all completed stocktakes and the full site list.
 * Returns { stocktakes, sites, loading, error, refetch }
 */
export function useStocktakes() {
  const { user } = useContext(UserContext);
  const [stocktakes, setStocktakes] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${user.token}` };

      const [stRes, siteRes] = await Promise.all([
        fetch(`${API}/stocktake`, { headers }),
        fetch(`${API}/sites`, { headers }),
      ]);

      const stJson = await stRes.json();
      const siteJson = await siteRes.json();

      setStocktakes(stJson.stocktakes || []);

      // Full site objects (includes lat, lng, category, full_name, name)
      const allSites = siteJson.data?.sites || siteJson.sites || [];
      setSites(allSites.filter((s) => !s.is_deleted));
    } catch (e) {
      setError("Failed to load stocktake data");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { stocktakes, sites, loading, error, refetch: fetchAll };
}
