// DataAnalysisContext.js

/// Acc. to george shouldn't be needed anymore.

import React, { createContext, useState, useContext } from 'react';
import { UserContext } from '../UserContext.js';
import { API } from '../config/api.js';

export const DataAnalysisContext = createContext();

export const DataAnalysisProvider = ({ children }) => {
  const { user } = useContext(UserContext);

  // --- ARA states ---
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

  // --- JNR states ---
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
  const [sensorLabels, setSensorLabels] = useState([]) // times or dates
  const [sensorData, setSensorData]     = useState([]) // P values

  const fetchAndProcessData = async ({ mode, singleDate, fromDate, toDate }) => {
    if (!user.token || !API) {
      console.error("Cannot fetch: missing user.token or API");
      return;
    }

    // Helper to check if a given ISO‐date string is in the desired window
    const inWindow = (d) => {
      if (mode === 'single') {
        return d === singleDate;
      } else {
        return d >= fromDate && d <= toDate;
      }
    };

    // Common fetch options with Authorization header
    const commonOpts = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    };

    // 1) Fetch raw temperature‐data uploads
    const dataRes = await fetch(`${API}/tempData`, {
      ...commonOpts,
      method: 'GET',
    });
    if (!dataRes.ok) {
      console.error("Failed to fetch tempData:", dataRes.status, dataRes.statusText);
      return;
    }
    const dataJson = await dataRes.json();
    // tempData endpoint returns { success: true, data: { uploads: [...] } }
    const dataDocs = dataJson.data?.uploads || [];

    // 2) Fetch form‐uploads
    const formRes = await fetch(`${API}/forms`, {
      ...commonOpts,
      method: 'GET',
    });
    if (!formRes.ok) {
      console.error("Failed to fetch forms:", formRes.status, formRes.statusText);
      return;
    }
    const formJson = await formRes.json();
    // forms endpoint returns e.g. { success: true, data: [ { filename: ..., data: [...] }, ... ] }
    const formDocs = Array.isArray(formJson)
      ? formJson
      : Array.isArray(formJson)
        ? formJson
        : [];

    // 3) Fetch EBC‐status documents
    const fetchStatuses = async (siteCode) => {
      const res = await fetch(
        `${API}/ebc/statuses/${siteCode.toLowerCase()}`,
        { ...commonOpts, method: 'GET' }
      );
      if (!res.ok) {
        console.error(`Failed to fetch ebc statuses for ${siteCode}:`, res.status, res.statusText);
        return [];
      }
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    };

    const [ebcDocsARA, ebcDocsJNR] = await Promise.all([
      fetchStatuses('ARA'),
      fetchStatuses('JNR')
    ]);

// 4) Fetch heat sensor data
let params;
if (mode === 'single') {
  // Single date mode: Only pass fromDate
  params = new URLSearchParams({ singleDate });
} else if (mode === 'range') {
  // Range mode: Pass both fromDate and toDate
  params = new URLSearchParams({ fromDate, toDate });
} else {
  // Handle any other unexpected modes, if applicable
  console.error('Invalid mode:', mode);
  return;
}

const sensRes = await fetch(
  `${API}/sensor/readings?${params}`,
  { ...commonOpts, method: 'GET' }
);

// 1) Check sensRes, not res
if (!sensRes.ok) {
  console.error(
    'Fetch sensor readings failed:',
    sensRes.status,
    sensRes.statusText
  );
  setSensorLabels([]);
  setSensorData([]);
}

// 2) Pull the array out of sensRes.json().data
const sensJson = await sensRes.json();
const readings = Array.isArray(sensJson.data) ? sensJson.data : [];

// 3) Now process `readings` instead of the undefined `readings`
if (mode === 'single') {
  // In single mode, filter by the selected date (singleDate)
  const dayReadings = readings
    .filter(r => r.meterTs.split('T')[0] === singleDate) // Filter by the specific date
    .sort((a, b) => a.meterTs.localeCompare(b.meterTs));

  setSensorLabels(
    dayReadings.map(r => r.meterTs.split('T')[1].slice(0, 8)) // Extract time part (HH:mm:ss)
  );
  setSensorData(dayReadings.map(r => r.energy)); // Use `energy` from readings
} else { // Range mode
  const buckets = {};
  readings.forEach(r => {
    const d = r.meterTs.split('T')[0]; // Group by date (YYYY-MM-DD)
    buckets[d] = buckets[d] || [];
    buckets[d].push(r.energy*10); // Use `energy` field
  });

  const dates = Object.keys(buckets).sort();
  setSensorLabels(dates); // Dates for range mode
  setSensorData(
    dates.map(d => {
      const vals = buckets[d];
      return vals.reduce((s, v) => s + v, 0) / vals.length; // Average energy for each day
    })
  );
}


    // ----- PROCESS TEMPERATURE ROWS (combine all uploads) -----
    const allTempRows = dataDocs.flatMap(doc => doc.data || []);

    // Separate raw temps by site/key
    const rawTemps1ARA = [], rawTemps2ARA = [], tempsArr1 = [], tempsArr2 = [];
    const rawTemps1JNR = [], rawTemps2JNR = [], tempsArrJ1 = [], tempsArrJ2 = [];

    allTempRows.forEach(row => {
      const [datePart, timePart] = String(row.timestamp || '').split(' ');
      if (!inWindow(datePart)) return;
      // Example columns: 'Reactor 1 Temperature (°C)', 'Reactor 2 Temperature (°C)', 'T5 Pyrolysis Temperature (°C)'
      const t1 = parseFloat(row['Reactor 1 Temperature (°C)']);
      const t2 = parseFloat(row['Reactor 2 Temperature (°C)']);
      const t3 = parseFloat(row['T5 Pyrolysis Temperature (°C)']);

      // ARA uses t1/t2
      if (!isNaN(t1)) {
        rawTemps1ARA.push({ date: datePart, time: timePart, temp: t1 });
        tempsArr1.push(t1);
      }
      if (!isNaN(t2)) {
        rawTemps2ARA.push({ date: datePart, time: timePart, temp: t2 });
        tempsArr2.push(t2);
      }
      // JNR also uses the same 'T5 Pyrolysis Temperature (°C)' as a proxy
      if (!isNaN(t3)) {
        rawTemps1JNR.push({ date: datePart, time: timePart, temp: t3 });
        tempsArrJ1.push(t3);
        rawTemps2JNR.push({ date: datePart, time: timePart, temp: t3 });
        tempsArrJ2.push(t3);
      }
    });

    // If single‐date mode, push time‐series directly; otherwise take daily averages
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
      // Build a map of date → [temps] for ARA and JNR
      const map1ARA = {}, map2ARA = {}, map1JNR = {}, map2JNR = {};

      rawTemps1ARA.forEach(({ date, temp }) => (map1ARA[date] = map1ARA[date] ? [...map1ARA[date], temp] : [temp]));
      rawTemps2ARA.forEach(({ date, temp }) => (map2ARA[date] = map2ARA[date] ? [...map2ARA[date], temp] : [temp]));

      rawTemps1JNR.forEach(({ date, temp }) => (map1JNR[date] = map1JNR[date] ? [...map1JNR[date], temp] : [temp]));
      rawTemps2JNR.forEach(({ date, temp }) => (map2JNR[date] = map2JNR[date] ? [...map2JNR[date], temp] : [temp]));

      const datesARA = Array.from(new Set([...Object.keys(map1ARA), ...Object.keys(map2ARA)])).sort();
      const datesJNR = Array.from(new Set([...Object.keys(map1JNR), ...Object.keys(map2JNR)])).sort();

      setChart1LabelsARA(datesARA);
      setChart1DataARA(datesARA.map(d =>
        Array.isArray(map1ARA[d]) ? map1ARA[d].reduce((a, b) => a + b, 0) / map1ARA[d].length : null
      ));
      setChart2LabelsARA(datesARA);
      setChart2DataARA(datesARA.map(d =>
        Array.isArray(map2ARA[d]) ? map2ARA[d].reduce((a, b) => a + b, 0) / map2ARA[d].length : null
      ));

      setChart1LabelsJNR(datesJNR);
      setChart1DataJNR(datesJNR.map(d =>
        Array.isArray(map1JNR[d]) ? map1JNR[d].reduce((a, b) => a + b, 0) / map1JNR[d].length : null
      ));
      setChart2LabelsJNR(datesJNR);
      setChart2DataJNR(datesJNR.map(d =>
        Array.isArray(map2JNR[d]) ? map2JNR[d].reduce((a, b) => a + b, 0) / map2JNR[d].length : null
      ));
    }

    // Set overall averages
    setDataTempsARA(tempsArr1.length ? tempsArr1.reduce((a, b) => a + b, 0) / tempsArr1.length : null);
    setDataTempsARA2(tempsArr2.length ? tempsArr2.reduce((a, b) => a + b, 0) / tempsArr2.length : null);
    setDataTempsJNR(tempsArrJ1.length ? tempsArrJ1.reduce((a, b) => a + b, 0) / tempsArrJ1.length : null);
    setDataTempsJNR2(tempsArrJ2.length ? tempsArrJ2.reduce((a, b) => a + b, 0) / tempsArrJ2.length : null);

    // ----- PROCESS FORM UPLOADS (Heat Generation & Fault Messages) -----
    const heatArrARA = [], faultsArrARA = [];
    formDocs.forEach(doc => {
      (doc.data || []).forEach(row => {
        // Row.Date in format "YYYY-DD-MM"? Adjust if needed
        const [year, day, month] = String(row.Date || '').split('-');
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        if (!inWindow(isoDate)) return;

        // ARA fields: 'P500 Heat Meter Total', 'P500 Fault Message(s)'
        const heatValARA = parseFloat(row['P500 Heat Meter Total'] || 0);
        if (!isNaN(heatValARA)) heatArrARA.push(heatValARA);
        const faultMsgARA = row['P500 Fault Message(s)'];
        if (faultMsgARA && !['', '0', 'N/A', 'None'].includes(faultMsgARA.trim())) {
          faultsArrARA.push({ date: row.Date, message: faultMsgARA });
        }
      });
    });
    setDailyHeatGenARA(heatArrARA.length ? heatArrARA.reduce((a, b) => a + b, 0) / heatArrARA.length : 0);
    setFaultMessagesARA(faultsArrARA);

    // JNR fields: 'C500-I Heat Meter Reading', 'C500-I Fault Messages'
    const heatArrJNR = [], faultsArrJNR = [];
    formDocs.forEach(doc => {
      (doc.data || []).forEach(row => {
        const [year, day, month] = String(row.Date || '').split('-');
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        if (!inWindow(isoDate)) return;

        const heatValJNR = parseFloat(row['C500-I Heat Meter Reading'] || 0);
        if (!isNaN(heatValJNR)) heatArrJNR.push(heatValJNR);

        const faultMsgJNR = row['C500-I Fault Messages'];
        if (faultMsgJNR && !['', '0', 'N/A', 'None', 'clear', 'CLEAR', 'no', 'NO', 'n/a'].includes(faultMsgJNR.trim())) {
          faultsArrJNR.push({ date: row.Date, message: faultMsgJNR });
        }
      });
    });
    setDailyHeatGenJNR(heatArrJNR.length ? heatArrJNR.reduce((a, b) => a + b, 0) / heatArrJNR.length : 0);
    setFaultMessagesJNR(faultsArrJNR);

    // ----- FETCH BAG LISTS FOR BOTH SITES (ARA & JNR) -----
    const fetchBags = async (siteCode) => {
      const queryString = mode === 'single'
        ? `?from=${singleDate}`
        : `?from=${fromDate}&to=${toDate}`;

      const resp = await fetch(
        `${API}/sites/${siteCode}/bags${queryString}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      if (!resp.ok) {
        console.error(`Failed to fetch ${siteCode} bags:`, resp.status, resp.statusText);
        return [];
      }
      const json = await resp.json();
      // Expecting { success: true, data: { bags: [...], farmers: [...] } }
      return Array.isArray(json.data?.bags) ? json.data.bags : [];
    };

    const [bagsARA, bagsJNR] = await Promise.all([
      fetchBags('ARA'),
      fetchBags('JNR'),
    ]);

    // ----- BUILD EBC LOOKUP TABLES -----
 const buildLookup = (bags, statuses) => {
      const bagIds = bags.map(b => String(b.charcode || '').trim());
      return statuses.reduce((map, row) => {
        const idKey = String(row.charcodeId || '').trim();
        if (!idKey || !bagIds.includes(idKey)) return map;
        const entry = {
          date:   row.date,
          time:   row.time,
          status: row.status,
          reason: row.reason
        };
        if (!map[idKey]) map[idKey] = [];
        map[idKey].push(entry);
        return map;
      }, {});
    };

    const lookupARA = buildLookup(bagsARA, ebcDocsARA);
    const lookupJNR = buildLookup(bagsJNR, ebcDocsJNR);
    setEbcLookupARA(lookupARA);
    setEbcLookupJNR(lookupJNR);

    // ----- ATTACH LATEST EBC STATUS TO EACH BAG -----
    const attachLatest = (bags, lookup) =>
      bags.map(b => {
        const idKey = String(b.charcode || '').trim();
        const history = lookup[idKey] || [];
        const latest = history.length ? history[history.length - 1].status : null;
        return { ...b, ebcCertStatus: latest };
      });

    setCharcodesARA(attachLatest(bagsARA, lookupARA));
    setCharcodesJNR(attachLatest(bagsJNR, lookupJNR));

    // ----- COMPUTE TOTAL WEIGHT & AVERAGE MOISTURE CONTENT -----
    const sumWeight = (bags) => {
      const weights = bags
        .filter(b => {
          const d = String(b.bagging_date || '').split('T')[0];
          return mode === 'single' ? d === singleDate : d >= fromDate && d <= toDate;
        })
        .map(b => Number(b.weight))
        .filter(v => !isNaN(v));
      return weights.length ? weights.reduce((a, b) => a + b, 0) : '';
    };
    setTotalWeightARA(sumWeight(bagsARA));
    setTotalWeightJNR(sumWeight(bagsJNR));

    const avgMC = (bags) => {
      const mcs = bags
        .map(b => parseFloat(b.moisture_content))
        .filter(v => !isNaN(v));
      return mcs.length ? mcs.reduce((a, b) => a + b, 0) / mcs.length : null;
    };
    setAvgMCARA(avgMC(bagsARA));
    setAvgMCJNR(avgMC(bagsJNR));
  };

  return (
    <DataAnalysisContext.Provider
      value={{
        dataTempsARA,
        dataTempsARA2,
        charcodesARA,
        formTempsARA,
        dataBioMCARA,
        chart1LabelsARA,
        chart1DataARA,
        chart2LabelsARA,
        chart2DataARA,
        dailyHeatGenARA,
        faultMessagesARA,
        ebcLookupARA,
        avgMCARA,
        totalWeightARA,
        dataTempsJNR,
        dataTempsJNR2,
        charcodesJNR,
        formTempsJNR,
        dataBioMCJNR,
        chart1LabelsJNR,
        chart1DataJNR,
        chart2LabelsJNR,
        chart2DataJNR,
        dailyHeatGenJNR,
        faultMessagesJNR,
        ebcLookupJNR,
        avgMCJNR,
        totalWeightJNR,
        fetchAndProcessData,
        sensorLabels,
        sensorData
      }}
    >
      {children}
    </DataAnalysisContext.Provider>
  );
};

export default DataAnalysisContext;
