import React, { useState, useEffect, useRef, useContext} from 'react';
import styles from './DataAnalysisPage.module.css';
import Module from '../Module.js';
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from '../ModuleMain.js'
import ChartMod from '../ChartMod.js';
import Figure from '../Figure.js';
import DateSelector from '../DateSelector.js'
import CharcodesList from '../CharcodesList.js';
import FaultMessages from '../FaultMessages.js';
import { DataAnalysisContext } from '../DataAnalysisContext.js';

const DataAnalysisPageJNR = () => {
  // 1) date picker state
  const [mode, setMode] = useState('single');    // 'single' or 'range'
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
    totalWeightJNR,
    avgMCJNR,
  } = useContext(DataAnalysisContext);
  

  // date-filter helper
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
      <ScreenHeader name={"Data Analysis Dashboard JNR"} />
      <ModuleMain>
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
  
        <div className={styles.contentGrid}>
          <Module name={"Reactor 1 Avg. Temp"} spanColumn={3} spanRow={1}>
            <Figure value={dataTempsJNR} />
          </Module>
  
          <CharcodesList
            spanColumn={21}
            charcodes={charcodesJNR}
            expanded={expanded}
            onToggle={() => setExpanded(prev => !prev)}
          />
  
          <Module name={"Reactor 2 Avg. Temp"} spanColumn={3} spanRow={1}>
            <Figure value={dataTempsJNR2} />
          </Module>
  
          <Module name={"T5 Pyrolysis Temperature"} spanColumn={12} spanRow={4}>
            <ChartMod
              isTimeAxis={mode === 'single' ? 'true' : false}
              title={mode === 'single' ? 'Reactor 1 Temps by Time' : 'Avg Reactor 1 Temp by Day'}
              labels={
                mode === 'single'
                  ? chart1LabelsJNR.map(time => time.split(':').slice(0, 2).join(':')).reverse()
                  : chart1LabelsJNR
              }
              dataPoints={
                mode === 'single'
                  ? chart2LabelsJNR.map((time, i) => ({
                      x: new Date(`1970-01-01T${time}`),
                      y: Number(chart1DataJNR[i])
                    })).reverse()
                  : chart1LabelsJNR.map((date, i) => ({
                      x: date,
                      y: Number(chart1DataJNR[i])
                    }))
              }
              unit="°C"
              extraLines={[
                { label: 'Upper Bound', value: specHigh },
                { label: 'Lower Bound', value: specLow }
              ]}
            />
          </Module>
  
          <Module name={"T5 Pyrolysis Temperature"} spanColumn={12} spanRow={4}>
            <ChartMod
              isTimeAxis={mode === 'single' ? 'true' : false}
              title={mode === 'single' ? 'Reactor 1 Temps by Time' : 'Avg Reactor 1 Temp by Day'}
              labels={
                mode === 'single'
                  ? chart1LabelsJNR.map(time => time.split(':').slice(0, 2).join(':')).reverse()
                  : chart1LabelsJNR
              }
              dataPoints={
                mode === 'single'
                  ? chart2LabelsJNR.map((time, i) => ({
                      x: new Date(`1970-01-01T${time}`),
                      y: Number(chart1DataJNR[i])
                    })).reverse()
                  : chart1LabelsJNR.map((date, i) => ({
                      x: date,
                      y: Number(chart1DataJNR[i])
                    }))
              }
              unit="°C"
              extraLines={[
                { label: 'Upper Bound', value: specHigh },
                { label: 'Lower Bound', value: specLow }
              ]}
            />
          </Module>
  
          <Module name={"Com. Biochar Produced (kg)"} spanColumn={4} spanRow={2}>
            <Figure value={totalWeightJNR} variant="2" unit="kg" decimals={0} />
          </Module>
  
          <Module name={"Avg. Heat Generated (per hour)"} spanColumn={4} spanRow={2}>
            <Figure value={dailyHeatGenJNR/24} variant="2" unit="kW"/>
          </Module>
  
          <Module name={"Avg. Heat Generated (daily)"} spanColumn={4} spanRow={2}>
            <Figure value={dailyHeatGenJNR} variant="2" unit="kW" />
          </Module>
  
          <Module name={"Fault Messages"} spanColumn={12} spanRow={3}>
            <FaultMessages messages={faultMessagesJNR} wrapperSize = "full" />
          </Module>
  
          <Module name={"Biomass MC"} spanColumn={4} spanRow={1}>
            <Figure value={avgMCJNR} unit = "" />
          </Module>
  
          <Module name={"Biochar (Overflow)"} spanColumn={4} spanRow={1}>
            <Figure value={dataTempsJNR2} />
          </Module>
  
          <Module name={"Biochar (Total Weight)"} spanColumn={4} spanRow={1}>
            <Figure value={dataTempsJNR2} />
          </Module>
        </div>
      </ModuleMain>
    </div>
  );  
};

export default DataAnalysisPageJNR;
