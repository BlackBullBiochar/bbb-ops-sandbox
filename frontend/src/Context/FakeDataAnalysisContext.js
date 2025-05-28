import React, { createContext, useState } from 'react';

export const DataAnalysisContext = createContext();

export const DataAnalysisProvider = ({ children }) => {

  const [groupedCharcodes, setGroupedCharcodes] = useState({});

//ARA

  const [dataTempsARA, setdataTempsARA] = useState([]);
  const [dataTempsARA2, setdataTempsARA2] = useState([]);  
  const [charcodesARA, setCharcodesARA] = useState([]);
  const [formtempsARA, setformtempsARA] = useState([]);
  const [dataBioMCARA, setdataBioMCARA] = useState([]);
  const [chart1LabelsARA, setchart1LabelsARA] = useState([]);
  const [chart2LabelsARA, setchart2LabelsARA] = useState([]);
  const [chart1DataARA, setchart1DataARA] = useState([]);
  const [chart2DataARA, setchart2DataARA] = useState([]);
  const [dailyHeatGenARA, setdailyHeatGenARA] = useState([]);
  const [faultMessagesARA, setfaultMessagesARA] = useState([]);
  const [ebcReasonsARA, setEbcReasonsARA] = useState([]);
  const [ebcStatusARA, setEbcStatusARA] = useState([]);
  const [ebcDateARA, setEbcDateARA] = useState([]);
  const [ebcTimeARA, setEbcTimeARA] = useState([]);
  const [ebcLookupARA, setEbcLookupARA] = useState({});


  
  

//jnrkinson

  const [chart1LabelsJNR, setchart1LabelsJNR] = useState([]);
  const [chart2LabelsJNR, setchart2LabelsJNR] = useState([]);
  const [chart1DataJNR, setChart1DataJNR] = useState([]);
  const [chart2DataJNR, setChart2DataJNR] = useState([]);
  const [dataTempsJNR, setdataTempsJNR] = useState([]);
  const [dataTempsJNR2, setdataTempsJNR2] = useState([]);
  const [charcodesJNR, setCharcodesJNR] = useState([]);
  const [formTempsJNR, setformTempsJNR] = useState([]);
  const [dataBioMCJNR, setdataBioMCJNR] = useState([]);
  const [dailyHeatGenJNR, setdailyHeatGenJNR] = useState([]);
  const [faultMessagesJNR, setfaultMessagesJNR] = useState([]);
  const [ebcReasonsJNR, setEbcReasonsJNR] = useState([]);
  const [ebcStatusJNR, setEbcStatusJNR] = useState([]);
  const [ebcDateJNR, setEbcDateJNR] = useState([]);
  const [ebcTimeJNR, setEbcTimeJNR] = useState([]);
  const [ebcLookupJNR, setEbcLookupJNR] = useState([]);

  

  const fetchAndProcessData = async ({ mode, singleDate, fromDate, toDate }) => {
    const inWindow = (d) => {
      if (mode === 'single') return d === singleDate;
      return d >= fromDate && d <= toDate;
    };

    const [dataRes, charRes, formRes, EBCres] = await Promise.all([
      fetch('http://localhost:5000/api/upload'),
      fetch('http://localhost:5000/api/charcodes'),
      fetch('http://localhost:5000/api/forms'),
      fetch('http://localhost:5000/api/ebcstatus'),
    ]);
    const [dataDocs, charDocs, formDocs, EBCdocs] = await Promise.all([
      dataRes.json(),
      charRes.json(),
      formRes.json(),
      EBCres.json(),
    ]);
    console.log('Fetched EBCdocs:', EBCdocs.map(doc => doc.site));


//ARA Data Collection

    const rawtempsARA = [], rawtempsARA2 = [], tempsARA = [], tempsARA2 = [];
    const BMCARA = [], DHGARA = [], ftempsARA = [], faultsARA = [];

    dataDocs.forEach(doc => {
      (doc.data || []).forEach(row => {
        const [datePart, timePart] = String(row.timestamp || '').split(' ');
        if (!inWindow(datePart)) return;

        const t1 = parseFloat(row['Reactor 1 Temperature (°C)']);
        const t2 = parseFloat(row['Reactor 2 Temperature (°C)']);

        if (!isNaN(t1)) {
          rawtempsARA.push({ date: datePart, time: timePart, temp: t1 });
          tempsARA.push(t1);
        }
        if (!isNaN(t2)) {
          rawtempsARA2.push({ date: datePart, time: timePart, temp: t2 });
          tempsARA2.push(t2);
        }
      });
    });

    if (mode === 'single') {
      setchart1LabelsARA(rawtempsARA.map(d => d.time));
      setchart1DataARA(rawtempsARA.map(d => d.temp));
      setchart2LabelsARA(rawtempsARA2.map(d => d.time));
      setchart2DataARA(rawtempsARA2.map(d => d.temp));
    } else {
      const dailyMap1 = {}, dailyMap2 = {};
      rawtempsARA.forEach(({ date, temp }) => {
        if (!dailyMap1[date]) dailyMap1[date] = [];
        dailyMap1[date].push(temp);
      });
      rawtempsARA2.forEach(({ date, temp }) => {
        if (!dailyMap2[date]) dailyMap2[date] = [];
        dailyMap2[date].push(temp);
      });

      const dateKeys = Object.keys({ ...dailyMap1, ...dailyMap2 }).sort();

      setchart1LabelsARA(dateKeys);
      setchart1DataARA(dateKeys.map(d => {
        const daytempsARA = dailyMap1[d] || [];
        return daytempsARA.length ? daytempsARA.reduce((sum, t) => sum + t, 0) / daytempsARA.length : null;
      }));

      setchart2LabelsARA(dateKeys);
      setchart2DataARA(dateKeys.map(d => {
        const daytempsARA = dailyMap2[d] || [];
        return daytempsARA.length ? daytempsARA.reduce((sum, t) => sum + t, 0) / daytempsARA.length : null;
      }));
    }

    setdataTempsARA(tempsARA.length ? tempsARA.reduce((sum, t) => sum + t, 0) / tempsARA.length : null);
    setdataTempsARA2(tempsARA2.length ? tempsARA2.reduce((sum, t) => sum + t, 0) / tempsARA2.length : null);

    formDocs.forEach(doc => {
      (doc.data || []).forEach(row => {
        if (!inWindow(row.Date)) return;

        const mc = parseFloat(row['Biomass Bin MC']);
        if (!isNaN(mc)) BMCARA.push(mc);

        const heat = parseFloat(row['P500 Heat Meter Total']);
        if (!isNaN(heat)) DHGARA.push(heat);

        const formTemp = row['Reactor 1 Temperature'];
        if (formTemp) ftempsARA.push(formTemp);

        const message = row['P500 Fault Message(s)'];
        if (
          message &&
          !['', '0', 'N/A', 'None', 'n/a'].includes(message.trim())
        ) {
          faultsARA.push({ date: row.Date, message });
        }
      });
    });

    setdataBioMCARA(BMCARA.length ? BMCARA.reduce((sum, t) => sum + t, 0) / BMCARA.length : null);
    setdailyHeatGenARA(DHGARA.length ? DHGARA.reduce((sum, t) => sum + t, 0) / DHGARA.length : null);
    setformtempsARA(ftempsARA);
    setfaultMessagesARA(faultsARA);

    const codesARA = charDocs
      .flatMap(doc => doc.data || [])
      .filter(row => inWindow(row.Produced) && row.site === 'ara')
      .map(row => JSON.stringify(row));
    setCharcodesARA(codesARA);

    const matchedARACodes = charDocs
      .flatMap(doc => doc.data || [])
      .filter(row => inWindow(row.Produced) && row.site === 'ara');
    
    const araEbcDoc = EBCdocs.find(doc => doc.site === 'ara') || { data: [] };
    const araCharcodeIds = matchedARACodes.map(row => String(row.ID || '').trim());
    
    const ebcARAMap = {};
    
    araEbcDoc.data.forEach(row => {
      const id = String(row.charcodeId || '').trim();
      if (!id || !araCharcodeIds.includes(id)) return;
    
      if (!ebcARAMap[id]) ebcARAMap[id] = [];
    
      ebcARAMap[id].push({
        date: row['EBC Date'] || '',
        time: row['EBC Time'] || '',
        status: row['EBC Cert Status'] || '',
        reason: row['EBC Status Reason'] || '',
      });
    });
    
    setEbcLookupARA(ebcARAMap);

//JNR data collection

    const rawTempsJNR = [], rawTempsJNR2 = [], tempsJNR = [], temps2JNR = [];
    const BMCJNR = [], ftempsJNR = [], faultsJNR = [];
  
    dataDocs.forEach(doc => {
      (doc.data || []).forEach(row => {
        const [datePart, timePart] = String(row.timestamp || '').split(' ');
        if (!inWindow(datePart)) return;
  
        const temp = parseFloat(row['T5 Pyrolysis Temperature (°C)']);
        if (!isNaN(temp)) {
          rawTempsJNR.push({ date: datePart, time: timePart, temp });
          rawTempsJNR2.push({ date: datePart, time: timePart, temp });
          tempsJNR.push(temp);
          temps2JNR.push(temp);
        }
      });
    });
  
    if (mode === 'single') {
      setchart1LabelsJNR(rawTempsJNR.map(d => d.time));
      setChart1DataJNR(rawTempsJNR.map(d => d.temp));
      setchart2LabelsJNR(rawTempsJNR2.map(d => d.time));
      setChart2DataJNR(rawTempsJNR2.map(d => d.temp));
    } else {
      const dailyMap1 = {}, dailyMap2 = {};
      rawTempsJNR.forEach(({ date, temp }) => {
        if (!dailyMap1[date]) dailyMap1[date] = [];
        dailyMap1[date].push(temp);
      });
      rawTempsJNR2.forEach(({ date, temp }) => {
        if (!dailyMap2[date]) dailyMap2[date] = [];
        dailyMap2[date].push(temp);
      });
  
      const dateKeys = Object.keys({ ...dailyMap1, ...dailyMap2 }).sort();
  
      setchart1LabelsJNR(dateKeys);
      setChart1DataJNR(dateKeys.map(d => {
        const dayTemps = dailyMap1[d] || [];
        return dayTemps.length ? dayTemps.reduce((sum, t) => sum + t, 0) / dayTemps.length : null;
      }));
  
      setchart2LabelsJNR(dateKeys);
      setChart2DataJNR(dateKeys.map(d => {
        const dayTemps = dailyMap2[d] || [];
        return dayTemps.length ? dayTemps.reduce((sum, t) => sum + t, 0) / dayTemps.length : null;
      }));
    }
  
    setdataTempsJNR(tempsJNR.length ? tempsJNR.reduce((sum, t) => sum + t, 0) / tempsJNR.length : null);
    setdataTempsJNR2(temps2JNR.length ? temps2JNR.reduce((sum, t) => sum + t, 0) / temps2JNR.length : null);
  
    const DHGrows = formDocs
      .flatMap(doc => doc.data || [])
      .filter(row => inWindow(row.Date))
      .sort((a, b) => new Date(a.Date) - new Date(b.Date));
  
    if (DHGrows.length < 1) {
      setdailyHeatGenJNR();
    } else {
      const parseMeterTotal = row => parseFloat(String(row['EOW | Biomass Dryer Heat Meter'] ?? '').replace(/,/g, '').trim());
      const first = parseMeterTotal(DHGrows[0]);
      const last = parseMeterTotal(DHGrows[DHGrows.length - 1]);
      const days = (new Date(DHGrows[DHGrows.length - 1].Date) - new Date(DHGrows[0].Date)) / (1000 * 60 * 60 * 24);
  
      setdailyHeatGenJNR(!isNaN(first) && !isNaN(last) && days > 0 ? (last - first) / days : null);
    }
  
    formDocs.forEach(doc => {
      (doc.data || []).forEach(row => {
        if (!inWindow(row.Date)) return;
  
        const mc = parseFloat(row['Biomass Bin MC']);
        if (!isNaN(mc)) BMCJNR.push(mc);
  
        const temp = row['Reactor 1 Temperature'];
        if (temp) ftempsJNR.push(temp);
  
        const message = row['C500-I Fault Messages'];
        if (
          message &&
          ![ '', '0', 'N/A', 'None', 'No', 'no', 'NONE', 'clear', 'CLEAR', 'cleae', 'A/N', 'na', 'N?F', 'n/a' ]
            .includes(message.trim())
        ) {
          faultsJNR.push({ date: row.Date, message });
        }
      });
    });
  
    setdataBioMCJNR(BMCJNR.length ? BMCJNR.reduce((sum, t) => sum + t, 0) / BMCJNR.length : null);
    setformTempsJNR(ftempsJNR);
    setfaultMessagesJNR(faultsJNR);

    const codesJNR = charDocs
      .flatMap(doc => doc.data || [])
      .filter(row => inWindow(row.Produced) && row.site === 'jnr')
      .map(row => JSON.stringify(row));
    setCharcodesJNR(codesJNR);    
    
    const matchedJNRCodes = charDocs
      .flatMap(doc => doc.data || [])
      .filter(row => inWindow(row.Produced) && row.site === 'jnr');
    
    const jnrEbcDoc = EBCdocs.find(doc => doc.site === 'jnr') || { data: [] };
    const jnrCharcodeIds = matchedJNRCodes.map(row => String(row.ID || '').trim());
    
    const ebcJNRMap = {};
    
    jnrEbcDoc.data.forEach(row => {
      const id = String(row.charcodeId || '').trim();
      if (!id || !jnrCharcodeIds.includes(id)) return;
    
      if (!ebcJNRMap[id]) ebcJNRMap[id] = [];
    
      ebcJNRMap[id].push({
        date: row['EBC Date'] || '',
        time: row['EBC Time'] || '',
        status: row['EBC Cert Status'] || '',
        reason: row['EBC Status Reason'] || '',
      });
    });
    
    setEbcLookupJNR(ebcJNRMap);
  };

  return (
    <DataAnalysisContext.Provider value={{
      dataTempsARA, setdataTempsARA,
      dataTempsARA2, setdataTempsARA2,
      charcodesARA, setCharcodesARA,
      formtempsARA, setformtempsARA,
      dataBioMCARA, setdataBioMCARA,
      chart1LabelsARA, setchart1LabelsARA,
      chart2LabelsARA, setchart2LabelsARA,
      chart1DataARA, setchart1DataARA,
      chart2DataARA, setchart2DataARA,
      dailyHeatGenARA, setdailyHeatGenARA,
      faultMessagesARA, setfaultMessagesARA,
      ebcReasonsARA, setEbcReasonsARA,
      ebcStatusARA, setEbcStatusARA,
      ebcDateARA, setEbcDateARA,
      ebcTimeARA, setEbcTimeARA,
      ebcLookupARA,

      chart1LabelsJNR, setchart1LabelsJNR,
      chart2LabelsJNR, setchart2LabelsJNR,
      chart1DataJNR, setChart1DataJNR,
      chart2DataJNR, setChart2DataJNR,
      dataTempsJNR, setdataTempsJNR,
      dataTempsJNR2, setdataTempsJNR2,
      charcodesJNR, setCharcodesJNR,
      formTempsJNR, setformTempsJNR,
      dataBioMCJNR, setdataBioMCJNR,
      dailyHeatGenJNR, setdailyHeatGenJNR,
      faultMessagesJNR, setfaultMessagesJNR,
      ebcReasonsJNR, setEbcReasonsJNR,
      ebcStatusJNR, setEbcStatusJNR,
      ebcDateJNR, setEbcDateJNR,
      ebcTimeJNR, setEbcTimeJNR,
      ebcLookupJNR,
      fetchAndProcessData
    }}>
      {children}
    </DataAnalysisContext.Provider>
  );
};