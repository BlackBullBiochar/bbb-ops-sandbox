import React, { createContext, useContext, useState } from 'react';

export const TempDataContext = createContext();

export const TempDataProvider = ({ children }) => {
  // ARA state
  const [chart1dataARA, setChart1DataARA] = useState([]);
  const [chart2dataARA, setChart2DataARA] = useState([]);
  const [chart1labelsARA, setChart1LabelsARA] = useState([]);
  const [chart2labelsARA, setChart2LabelsARA] = useState([]);
  const [datatempsARA, setDataTempsARA] = useState(null);
  const [datatempsARA2, setDataTempsARA2] = useState(null);

  // JNR state
  const [chart1dataJNR, setChart1DataJNR] = useState([]);
  const [chart2dataJNR, setChart2DataJNR] = useState([]);
  const [chart1labelsJNR, setChart1LabelsJNR] = useState([]);
  const [chart2labelsJNR, setChart2LabelsJNR] = useState([]);
  const [datatempsJNR, setDataTempsJNR] = useState(null);
  const [datatempsJNR2, setDataTempsJNR2] = useState(null);

  const average = arr => arr.reduce((sum, v) => sum + v, 0) / (arr.length || 1);

  const fetchAndProcessTemps = async ({ mode, singleDate, fromDate, toDate }) => {
    const inWindow = d =>
      mode === 'single' ? d === singleDate : d >= fromDate && d <= toDate;

    try {
      const res = await fetch('/api/tempdatas');
      if (!res.ok) throw new Error(res.statusText);
      const docs = await res.json();

      // Accumulators
      const raw1ARA = [], raw2ARA = [], vals1ARA = [], vals2ARA = [];
      const raw1JNR = [], raw2JNR = [], vals1JNR = [], vals2JNR = [];

      docs.forEach(doc => {
        const fn = (doc.filename || '').toUpperCase();
        const data = doc.data || [];

        if (fn.includes('ARA')) {
          data.forEach(row => {
            const [datePart, timePart = ''] = String(row.timestamp || '').split(' ');
            if (!inWindow(datePart)) return;
            const t1 = parseFloat(row['Reactor 1 Temperature (°C)']);
            const t2 = parseFloat(row['Reactor 2 Temperature (°C)']);
            if (!isNaN(t1)) {
              raw1ARA.push({ date: datePart, time: timePart.split('.')[0], temp: t1 });
              vals1ARA.push(t1);
            }
            if (!isNaN(t2)) {
              raw2ARA.push({ date: datePart, time: timePart.split('.')[0], temp: t2 });
              vals2ARA.push(t2);
            }
          });
        } else if (fn.includes('JNR')) {
          data.forEach(row => {
            const [datePart, timePart = ''] = String(row.timestamp || '').split(' ');
            if (!inWindow(datePart)) return;
            const t5 = parseFloat(row['T5 Pyrolysis Temperature (°C)']);
            if (!isNaN(t5)) {
              raw1JNR.push({ date: datePart, time: timePart.split('.')[0], temp: t5 });
              vals1JNR.push(t5);
              raw2JNR.push({ date: datePart, time: timePart.split('.')[0], temp: t5 });
              vals2JNR.push(t5);
            }
          });
        }
      });

      // Helper for single/day processing
      const process = (raws, vals, setLabels, setData, setAvg) => {
        if (mode === 'single') {
          setLabels(raws.map(r => r.time));
          setData(raws.map(r => r.temp));
        } else {
          const map = {};
          raws.forEach(({ date, temp }) => {
            if (!map[date]) map[date] = [];
            map[date].push(temp);
          });
          const days = Object.keys(map).sort();
          setLabels(days);
          setData(days.map(d => average(map[d])));
        }
        setAvg(vals.length ? average(vals) : null);
      };

      // ARA
      process(raw1ARA, vals1ARA, setChart1LabelsARA, setChart1DataARA, setDataTempsARA);
      process(raw2ARA, vals2ARA, setChart2LabelsARA, setChart2DataARA, setDataTempsARA2);

      // JNR
      process(raw1JNR, vals1JNR, setChart1LabelsJNR, setChart1DataJNR, setDataTempsJNR);
      process(raw2JNR, vals2JNR, setChart2LabelsJNR, setChart2DataJNR, setDataTempsJNR2);
    } catch (err) {
      console.error('TempDataContext.fetchAndProcessTemps error:', err);
      // Reset on error
      setChart1DataARA([]);
      setChart2DataARA([]);
      setChart1LabelsARA([]);
      setChart2LabelsARA([]);
      setDataTempsARA(null);
      setDataTempsARA2(null);
      setChart1DataJNR([]);
      setChart2DataJNR([]);
      setChart1LabelsJNR([]);
      setChart2LabelsJNR([]);
      setDataTempsJNR(null);
      setDataTempsJNR2(null);
    }
  };

  return (
    <TempDataContext.Provider value={{
      chart1dataARA,
      chart2dataARA,
      chart1labelsARA,
      chart2labelsARA,
      datatempsARA,
      datatempsARA2,
      chart1dataJNR,
      chart2dataJNR,
      chart1labelsJNR,
      chart2labelsJNR,
      datatempsJNR,
      datatempsJNR2,
      fetchAndProcessTemps
    }}>
      {children}
    </TempDataContext.Provider>
  );
};

export const useTempData = () => useContext(TempDataContext);