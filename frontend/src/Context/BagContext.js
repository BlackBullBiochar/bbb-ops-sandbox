// src/Context/BagContext.js
import React, { createContext, useContext, useState } from 'react';
import { useSite } from './SiteContext';

export const BagContext = createContext();

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const BagProvider = ({ children }) => {
  const [bagData, setBagData] = useState({});
  const { siteLookupByName, siteLookupById } = useSite();

  const fetchAndFilterBags = async ({ siteCode, mode, singleDate, fromDate, toDate }) => {
  console.log('👉 fetchAndFilterBags called with:', { siteCode, mode, singleDate, fromDate, toDate });

  const siteEntry = siteLookupByName[siteCode.toLowerCase()];
  console.log('👉 siteEntry lookup gave:', siteEntry);
  if (!siteEntry) {
    console.error(`BagContext: no site entry for code ${siteCode}`);
    return;
  }
  const siteId = siteEntry._id;
  console.log('👉 resolved siteId =', siteId);

  const inWindow = d =>
    mode === 'single' ? d === singleDate : d >= fromDate && d <= toDate;

  try {
    const token = localStorage.getItem('token');
    const url   = `${API}/api/bags?site=${siteId}`;
    console.log('👉 about to fetch URL:', url);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('👉 fetch returned status', res.status);
    if (!res.ok) throw new Error(res.statusText);
    const allBags = await res.json();
    console.log(`👉 fetched ${allBags.length} bags`, allBags);

      // 4) filter by date and enrich with siteName & max_stock
      const filtered = allBags
        .filter(bag => {
          const dateStr = (bag.bagging_date || '').split('T')[0];
          return inWindow(dateStr);
        })
        .map(bag => {
          const siteInfo = siteLookupById[bag._site];
          return {
            ...bag,
            siteName:  siteInfo?.name,
            max_stock: siteInfo?.max_stock
          };
        });

      // 5) store under uppercase code
      setBagData(prev => ({
        ...prev,
        [siteCode.toUpperCase()]: filtered
      }));
    } catch (err) {
      console.error('BagContext.fetchAndFilterBags error:', err);
    }
  };

  const getBags = siteCode =>
    bagData[siteCode?.toUpperCase()] || [];

  return (
    <BagContext.Provider value={{ fetchAndFilterBags, getBags }}>
      {children}
    </BagContext.Provider>
  );
};

export const useBags = () => useContext(BagContext);
