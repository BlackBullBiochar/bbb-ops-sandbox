import React, { createContext, useState } from 'react';

export const DataAnalysisContext = createContext();

export const DataAnalysisProvider = ({ children }) => {
  // ARA states
  const [dataTempsARA, setDataTempsARA] = useState([]);
  const [dataTempsARA2, setDataTempsARA2] = useState([]);
  const [charcodesARA, setCharcodesARA] = useState([]);
  const [formTempsARA, setFormTempsARA] = useState([]);
  const [dataBioMCARA, setDataBioMCARA] = useState(null);
  const [chart1LabelsARA, setChart1LabelsARA] = useState([]);
  const [chart2LabelsARA, setChart2LabelsARA] = useState([]);
  const [chart1DataARA, setChart1DataARA] = useState([]);
  const [chart2DataARA, setChart2DataARA] = useState([]);
  const [dailyHeatGenARA, setDailyHeatGenARA] = useState(null);
  const [faultMessagesARA, setFaultMessagesARA] = useState([]);
  const [ebcLookupARA, setEbcLookupARA] = useState({});
  const [avgMCARA, setAvgMCARA] = useState(null);
  const [totalWeightARA, setTotalWeightARA] = useState('');

  // JNR states
  const [dataTempsJNR, setDataTempsJNR] = useState([]);
  const [dataTempsJNR2, setDataTempsJNR2] = useState([]);
  const [charcodesJNR, setCharcodesJNR] = useState([]);
  const [formTempsJNR, setFormTempsJNR] = useState([]);
  const [dataBioMCJNR, setDataBioMCJNR] = useState(null);
  const [chart1LabelsJNR, setChart1LabelsJNR] = useState([]);
  const [chart2LabelsJNR, setChart2LabelsJNR] = useState([]);
  const [chart1DataJNR, setChart1DataJNR] = useState([]);
  const [chart2DataJNR, setChart2DataJNR] = useState([]);
  const [dailyHeatGenJNR, setDailyHeatGenJNR] = useState(null);
  const [faultMessagesJNR, setFaultMessagesJNR] = useState([]);
  const [ebcLookupJNR, setEbcLookupJNR] = useState({});
  const [avgMCJNR, setAvgMCJNR] = useState(null);
  const [totalWeightJNR, setTotalWeightJNR] = useState('');

  const fetchAndProcessData = async ({ mode, singleDate, fromDate, toDate }) => {
    const inWindow = d => (mode === 'single' ? d === singleDate : d >= fromDate && d <= toDate);

    // fetch raw temperature data uploads, form data, and EBC status docs
    const [dataRes, formRes, ebcRes] = await Promise.all([
      fetch('http://localhost:5000/api/tempData'),
      fetch('http://localhost:5000/api/forms'),
      fetch('http://localhost:5000/api/ebcstatus')
    ]);
    const [{ uploads: dataDocs }, formDocs, ebcDocs] = await Promise.all([
      dataRes.json(),
      formRes.json(),
      ebcRes.json()
    ]);

    // aggregate all temp rows across uploads
    const allTempRows = dataDocs.flatMap(doc => doc.data || []);

    // Process ARA temperatures
    const rawTemps1ARA = [], rawTemps2ARA = [], tempsArr1 = [], tempsArr2 = [];
    const rawTemps1JNR = [], rawTemps2JNR = [], tempsJrr1 = [], tempsJrr2 = [];
    allTempRows.forEach(row => {
      const [datePart, timePart] = String(row.timestamp || '').split(' ');
      if (!inWindow(datePart)) return;
      const t1 = parseFloat(row['Reactor 1 Temperature (°C)']);
      const t2 = parseFloat(row['Reactor 2 Temperature (°C)']);
      const t3 = parseFloat(row['T5 Pyrolysis Temperature (°C)']);
      if (!isNaN(t1)) { rawTemps1ARA.push({ date: datePart, time: timePart, temp: t1 }); tempsArr1.push(t1); }
      if (!isNaN(t2)) { rawTemps2ARA.push({ date: datePart, time: timePart, temp: t2 }); tempsArr2.push(t2); }
      if (!isNaN(t3)) { rawTemps1JNR.push({ date: datePart, time: timePart, temp: t3 }); tempsJrr1.push(t3); }
      if (!isNaN(t3)) { rawTemps2JNR.push({ date: datePart, time: timePart, temp: t3 }); tempsJrr2.push(t3); }
    });
    if (mode === 'single') {
      setChart1LabelsARA(rawTemps1ARA.map(d => d.time));
      setChart1DataARA(rawTemps1ARA.map(d => d.temp));
      setChart2LabelsARA(rawTemps2ARA.map(d => d.time));
      setChart2DataARA(rawTemps2ARA.map(d => d.temp));
      setChart1LabelsJNR(rawTemps1JNR.map(d => d.time));
      setChart1DataJNR(rawTemps1JNR.map(d => d.temp));
      setChart2LabelsJNR(rawTemps2JNR.map(d => d.time));
      setChart2DataJNR(rawTemps2JNR.map(d => d.temp));

    } else {
      // ARA range…
      const map1 = {}, map2 = {};
      rawTemps1ARA.forEach(({ date, temp }) => (map1[date] ||= []).push(temp));
      rawTemps2ARA.forEach(({ date, temp }) => (map2[date] ||= []).push(temp));
      const datesA = Array.from(new Set([...Object.keys(map1), ...Object.keys(map2)])).sort();

      setChart1LabelsARA(datesA);
      setChart1DataARA(datesA.map(d => map1[d]?.length
        ? map1[d].reduce((a,b)=>a+b,0)/map1[d].length
        : null
      ));
      setChart2LabelsARA(datesA);
      setChart2DataARA(datesA.map(d => map2[d]?.length
        ? map2[d].reduce((a,b)=>a+b,0)/map2[d].length
        : null
      ));

      // JNR range…
      const mapJ1 = {}, mapJ2 = {};
      rawTemps1JNR.forEach(({ date, temp }) => (mapJ1[date] ||= []).push(temp));
      rawTemps2JNR.forEach(({ date, temp }) => (mapJ2[date] ||= []).push(temp));
      const datesJ = Array.from(new Set([...Object.keys(mapJ1), ...Object.keys(mapJ2)])).sort();

      setChart1LabelsJNR(datesJ);
      setChart1DataJNR(datesJ.map(d => mapJ1[d]?.length
        ? mapJ1[d].reduce((a,b)=>a+b,0)/mapJ1[d].length
        : null
      ));
      setChart2LabelsJNR(datesJ);
      setChart2DataJNR(datesJ.map(d => mapJ2[d]?.length
        ? mapJ2[d].reduce((a,b)=>a+b,0)/mapJ2[d].length
        : null
      ));
    }

    // overall averages
    setDataTempsARA(tempsArr1.length
      ? tempsArr1.reduce((a,b)=>a+b,0)/tempsArr1.length
      : null
    );
    setDataTempsARA2(tempsArr2.length
      ? tempsArr2.reduce((a,b)=>a+b,0)/tempsArr2.length
      : null
    );

    setDataTempsJNR(tempsJrr1.length
      ? tempsJrr1.reduce((a,b)=>a+b,0)/tempsJrr1.length
      : null
    );
    setDataTempsJNR2(tempsJrr2.length
      ? tempsJrr2.reduce((a,b)=>a+b,0)/tempsJrr2.length
      : null
    );

    // Process ARA forms
    const mcArrARA = [], heatArrARA = [], faultsArrARA = [];
    formDocs.forEach(doc => doc.data?.forEach(row => {
      const [year, day, month] = String(row.Date || '').split('-');
      const isoDate = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
      if (!inWindow(isoDate)) return;
      const mc = parseFloat(row['Biomass Bin MC']); if (!isNaN(mc)) mcArrARA.push(mc);
      const heat = parseFloat(row['P500 Heat Meter Total'] || 0); heatArrARA.push(heat);
      const msg = row['P500 Fault Message(s)'];
      if (msg && !['','0','N/A','None'].includes(msg.trim())) faultsArrARA.push({ date: row.Date, message: msg });
    }));
    setDataBioMCARA(mcArrARA.length ? mcArrARA.reduce((a,b)=>a+b,0)/mcArrARA.length : null);
    setDailyHeatGenARA(heatArrARA.length ? heatArrARA.reduce((a,b)=>a+b,0)/heatArrARA.length : 0);
    setFaultMessagesARA(faultsArrARA);

    // Fetch bag lists for both sites
    const fetchBags = async site => {
      const query = mode==='single' ? `?from=${singleDate}` : `?from=${fromDate}&to=${toDate}`;
      const res = await fetch(`http://localhost:5000/api/sites/${site}/bags${query}`, { headers:{ Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const { bags=[] } = await res.json();
      return bags.map(b=>({ ...b, site }));
    };
    const [bagsARA, bagsJNR] = await Promise.all([fetchBags('ARA'), fetchBags('JNR')]);

    // Build EBC lookup
    const buildLookup = (bags, siteKey) => {
      const doc = ebcDocs.find(d => d.site.toLowerCase() === siteKey.toLowerCase());
      if (!doc) return {};
      const ids = bags.map(b => String(b.charcode||'').trim());
      return doc.data.reduce((m,row) => {
        const id = String(row.charcodeId||'').trim();
        if (id && ids.includes(id)) m[id] = [...(m[id]||[]), { date: row['EBC Date'], time: row['EBC Time'], status: row['EBC Cert Status'], reason: row['EBC Status Reason'] }];
        return m;
      }, {});
    };
    const lookupARA = buildLookup(bagsARA, 'ARA');
    const lookupJNR = buildLookup(bagsJNR, 'JNR');
    setEbcLookupARA(lookupARA);
    setEbcLookupJNR(lookupJNR);

    // Attach latest status
    const attachLatest = (bags, lookup) => bags.map(b => {
      const hist = lookup[String(b.charcode||'').trim()]||[];
      return { ...b, ebcCertStatus: hist.length ? hist[hist.length-1].status : null };
    });
    setCharcodesARA(attachLatest(bagsARA, lookupARA));
    setCharcodesJNR(attachLatest(bagsJNR, lookupJNR));

    // Compute weights
    const sumWeight = bags => {
      const vals = bags.filter(b => {
        const d = String(b.bagging_date||'').split('T')[0];
        return mode==='single' ? d===singleDate : d>=fromDate && d<=toDate;
      }).map(b=>Number(b.weight)).filter(v=>!isNaN(v));
      return vals.length ? vals.reduce((a,b)=>a+b,0) : '';
    };
    setTotalWeightARA(sumWeight(bagsARA));
    setTotalWeightJNR(sumWeight(bagsJNR));

    // Compute average moisture content
    const avgMC = bags => {
      const arr = bags.map(b=>parseFloat(b.moisture_content)).filter(v=>!isNaN(v));
      return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
    };
    setAvgMCARA(avgMC(bagsARA));
    setAvgMCJNR(avgMC(bagsJNR));
  };

  return (
    <DataAnalysisContext.Provider value={{
      dataTempsARA, dataTempsARA2, charcodesARA, formTempsARA, dataBioMCARA,
      chart1LabelsARA, chart1DataARA, chart2LabelsARA, chart2DataARA,
      dailyHeatGenARA, faultMessagesARA, ebcLookupARA, avgMCARA, totalWeightARA,
      dataTempsJNR, dataTempsJNR2, charcodesJNR, formTempsJNR, dataBioMCJNR,
      chart1LabelsJNR, chart1DataJNR, chart2LabelsJNR, chart2DataJNR,
      dailyHeatGenJNR, faultMessagesJNR, ebcLookupJNR, avgMCJNR, totalWeightJNR,
      fetchAndProcessData
    }}>
      {children}
    </DataAnalysisContext.Provider>
  );
};

export default DataAnalysisContext;
