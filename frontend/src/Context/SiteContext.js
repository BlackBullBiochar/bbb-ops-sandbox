import React, { createContext, useState, useEffect, useContext } from 'react';

export const SiteContext = createContext();

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const SiteProvider = ({ children }) => {
  const [sites, setSites] = useState([]);
  const [siteLookupByName, setSiteLookupByName] = useState({});
  const [siteLookupById,   setSiteLookupById]   = useState({});
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteError,   setSiteError]   = useState(null);

  const fetchSites = async () => {
    setSiteLoading(true);
    try {
      const res = await fetch(`${API}/api/sites`);
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();

      setSites(data);

      // Build lookups
      const byName = {};
      const byId   = {};

      data.forEach(site => {
        // Store by lowercase name → full site object (including _id)
        byName[site.name.toLowerCase()] = {
          _id:       site._id,
          name:      site.name,
          max_stock: site.max_stock
        };

        // Store by _id → minimal info
        byId[site._id] = {
          name:      site.name,
          max_stock: site.max_stock
        };
      });

      setSiteLookupByName(byName);
      setSiteLookupById(byId);
      setSiteError(null);
    } catch (err) {
      console.error('SiteContext fetchSites error:', err);
      setSiteError(err.message);
    } finally {
      setSiteLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  return (
    <SiteContext.Provider value={{
      sites,
      siteLoading,
      siteError,
      siteLookupByName,
      siteLookupById,
      fetchSites
    }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);