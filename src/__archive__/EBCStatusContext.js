import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
export const EBCStatusContext = createContext();

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Provider to fetch and expose EBC statuses
export const EBCStatusProvider = ({ children }) => {
  const [ebcLookup, setEbcLookup] = useState({});

  const fetchEBCStatuses = async () => {
    try {
      const res = await fetch(`${API}/api/ebcstatus`);
      if (!res.ok) throw new Error(res.statusText);
      const docs = await res.json();

      const lookup = {};
      docs.forEach(({ site, data }) => {
        data.forEach(row => {
          const id = String(row.charcodeId || '').trim();
          if (!id) return;
          if (!lookup[id]) lookup[id] = [];
          lookup[id].push({
            site,
            date:   row['EBC Date'] || '',
            time:   row['EBC Time'] || '',
            status: row['EBC Cert Status'] || '',
            reason: row['EBC Status Reason'] || ''
          });
        });
      });

      setEbcLookup(lookup);
    } catch (err) {
      console.error('EBCStatusContext fetch error:', err);
    }
  };

  useEffect(() => {
    fetchEBCStatuses();
  }, []);

  const getByCharcode = (charcodeId) => {
    return ebcLookup[charcodeId] || [];
  };

  return (
    <EBCStatusContext.Provider value={{
      ebcLookup,
      getByCharcode,
      fetchEBCStatuses
    }}>
      {children}
    </EBCStatusContext.Provider>
  );
};

// Custom hook for easy consumption
export const useEbcStatus = () => useContext(EBCStatusContext);
