import React, { useState, useEffect, useRef, useContext} from 'react';
import styles from './AlertDashboard.module.css';
import Module from '../Module.js';
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from '../ModuleMain.js'
import ChartMod from '../ChartMod.js';
import Figure from '../Figure.js';
import DateSelector from '../DateSelector.js'
import CharcodesList from '../CharcodesList.js';
import FaultMessages from '../FaultMessages';
import { DataAnalysisContext } from '../DataAnalysisContext';
import CharcodesAlertBoard from '../CharcodesAlertBoard';
import SiteSelector from '../SiteSelector';


const AlertDashboard = () => {
  const [mode, setMode] = useState('single');
  const [singleDate, setSingleDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isToggleOn, setIsToggleOn] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const[specHigh, setSpecHigh] = useState(780); 
  const[specLow, setSpecLow] = useState(520); 

  const { fetchAndProcessData,
    dataTempsJNR, 
    dataTempsJNR2, 
    charcodesJNR, 
    formTempsJNR,
    dataBioMCJNR,
    chart1LabelsJNR,
    chart2LabelsJNR,
    chart1DataJNR,
    chart2DataJNR,
    dailyHeatGenJNR,
    faultMessagesJNR,
    ebcReasonsJNR,
    dataTempsARA, 
    dataTempsARA2, 
    charcodesARA, 
    formTempsARA,
    dataBioMCARA,
    chart1LabelsARA,
    chart2LabelsARA,
    chart1DataARA,
    chart2DataARA,
    dailyHeatGenARA,
    faultMessagesARA,
  } = useContext(DataAnalysisContext);
  
  const [selectedSites, setSelectedSites] = useState(['ARA', 'JNR']);

  const handleToggleSite = (site) => {
    setSelectedSites((prev) =>
      prev.includes(site) ? prev.filter(s => s !== site) : [...prev, site]
    );
  };
  

  const inWindow = (d) => {
    if (mode === 'single') {
      return d === singleDate;
    }
    return d >= fromDate && d <= toDate;
  };

  useEffect(() => {
    setMode(isToggleOn ? 'range' : 'single');
  }, [isToggleOn]);

  const handleFetch = () => {
    if (mode === 'single' && !singleDate) return alert('Pick a date');
    if (mode === 'range' && (!fromDate || !toDate)) return alert('Pick both start and end dates');
    fetchAndProcessData({ mode, singleDate, fromDate, toDate });
  };

  return (
    <div className={styles.mainWhiteContainer}>
      <ScreenHeader name={"Charcode Inventory"} />
        <ModuleMain>
          <div>
          <div className={styles.topRow}>
            <DateSelector
            isRange={isToggleOn}
            singleDate={singleDate}
            fromDate={fromDate}
            toDate={toDate}
            onToggle={() => setIsToggleOn(prev => !prev)}
            onChange={(type, value) => {
                if (type === 'single') setSingleDate(value);
                if (type === 'from') setFromDate(value);
                if (type === 'to') setToDate(value);
            }}
            onFetch={handleFetch}
            />
            <SiteSelector
              selected={selectedSites}
              onToggle={handleToggleSite}
              options={[
                { key: 'ARA', label: 'ARA' },
                { key: 'JNR', label: 'JNR' }
              ]}
            />
          </div>
          <div className={styles.contentGrid}>
            {selectedSites.includes('ARA') && (
              <Module name="Charcodes ARA" spanColumn={24}>
                <CharcodesAlertBoard charcodes={charcodesARA} />
              </Module>
            )}

            {selectedSites.includes('JNR') && (
              <Module name="Charcodes JNR" spanColumn={24}>
                <CharcodesAlertBoard charcodes={charcodesJNR} />
              </Module>
            )}
          </div>
          </div>
        </ModuleMain>
    </div>
  );  
};

export default AlertDashboard;
