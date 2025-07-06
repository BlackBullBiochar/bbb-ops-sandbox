import React, { createContext, useContext, useState } from 'react';

export const FormsContext = createContext();

export const FormsProvider = ({ children }) => {
  // Holds per-site metrics
  const [formsData, setFormsData] = useState({});

  const fetchForms = async ({ mode, singleDate, fromDate, toDate, siteCode }) => {
    const inWindow = d =>
      mode === 'single' ? d === singleDate : d >= fromDate && d <= toDate;

    try {
      const res = await fetch('/api/forms');
      if (!res.ok) throw new Error(res.statusText);
      const docs = await res.json();

      const next = {};

      docs.forEach(doc => {
        const fn   = (doc.filename || '').toUpperCase();
        const site = fn.includes('ARA') ? 'ARA'
                   : fn.includes('JNR') ? 'JNR'
                   : null;
        if (!site) return;

        const BMC    = [];
        const HEAT   = [];
        const FAULTS = [];

        (doc.data || []).forEach(row => {
          const date = row.Date?.split('T')[0];
          if (!inWindow(date)) return;

          // Biomass MC
          const mc = parseFloat(row['Biomass Bin MC']);
          if (!isNaN(mc)) BMC.push(mc);

          // Heat Meter (choose field present)
          const h = parseFloat(
            row['P500 Heat Meter Total'] ??
            row['EOW | Biomass Dryer Heat Meter']
          );
          if (!isNaN(h)) HEAT.push(h);

          // Fault messages
          const msg = row['P500 Fault Message(s)'] ||
                      row['C500-I Fault Messages'];
          if (
            msg &&
            !['', '0', 'N/A', 'NONE', 'NONE', 'CLEAR', 'N/A']
              .includes(msg.trim().toUpperCase())
          ) {
            FAULTS.push({ date, message: msg });
          }
        });

        if (!next[site]) next[site] = {};
        next[site].dataBioMC     = BMC.length ? BMC.reduce((a,b)=>a+b,0)/BMC.length : null;
        next[site].dailyHeatGen  = HEAT.length? HEAT.reduce((a,b)=>a+b,0)/HEAT.length : null;
        next[site].faultMessages = FAULTS;
      });

      setFormsData(next);
    } catch (err) {
      console.error('FormsContext.fetchForms error:', err);
      setFormsData({});
    }
  };

  const getFormMetrics = (siteCode) => {
    return formsData[siteCode] || {
      dataBioMC: null,
      dailyHeatGen: null,
      faultMessages: []
    };
  };

  return (
    <FormsContext.Provider value={{ fetchForms, getFormMetrics }}>
      {children}
    </FormsContext.Provider>
  );
};

export const useForms = () => useContext(FormsContext);
