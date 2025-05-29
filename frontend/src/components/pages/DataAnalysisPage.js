import React, { useState, useContext, useEffect, useRef } from 'react';
import styles from './DataAnalysisPage.module.css';
import Module from '../Module.js';
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from '../ModuleMain.js'
import ChartMod from '../ChartMod.js';
import Figure from '../Figure.js';
import DateSelector from '../DateSelector.js'
import CharcodesList from '../CharcodesList.js';
import FaultMessages from '../FaultMessages';
import { DataAnalysisContext } from '../DataAnalysisContext.js';

const DataAnalysisPage = () => {
  // 1) date picker state
  const [mode, setMode] = useState('single');    // 'single' or 'range'
  const [singleDate, setSingleDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isToggleOn, setIsToggleOn] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [specHigh, setSpecHigh] = useState(780); 
  const [specLow, setSpecLow] = useState(520);
  

  // 2) stored context
  const { fetchAndProcessData,
    dataTempsARA, 
    dataTempsARA2, 
    charcodesARA, 
    formTempsARA,
    dataBioMCARA,
    chart1LabelsARA,
    chart2LabelsARA,
    chart1DataARA,
    chart2DataARA,
    ebcStatusARA,
    dailyHeatGenARA,
    faultMessagesARA,
    totalWeightARA,
    avgMCARA,
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
    <ScreenHeader name={"Data Analysis Dashboard ARA"}/>
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

      <div className = {styles.contentGrid}>
        <Module name={"Reactor 1 Avg. Temp"} spanColumn={3} spanRow={1}>
          <Figure title="Reactor 1 Avg. Temp" value={dataTempsARA} />
        </Module>

        <CharcodesList
          charcodes={charcodesARA}
          expanded={expanded}
          onToggle={() => setExpanded(prev => !prev)}
        />


        <Module name={"Reactor 2 Avg. Temp"} spanColumn={3} spanRow={1}>
          <Figure title="Reactor 2 Avg. Temp" value={dataTempsARA2} />
        </Module>
      
        <Module name={"Reactor 1 Temp"} spanColumn={12} spanRow={4}>
          <ChartMod
            isTimeAxis={mode === 'single' ? 'true' : false}
            title={mode === 'single' ? 'Reactor 1 Temps by Time' : 'Avg Reactor 1 Temp by Day'}
            labels={
              mode === 'single'
                ? chart1LabelsARA.map(time => time.split(':').slice(0, 2).join(':')).reverse()
                : chart1LabelsARA
            }
            dataPoints={
              mode === 'single'
                ? chart2LabelsARA.map((time, i) => ({
                    x: new Date(`1970-01-01T${time}`),
                    y: Number(chart1DataARA[i])
                  })).reverse()
                : chart1LabelsARA.map((date, i) => ({
                    x: date,
                    y: Number(chart1DataARA[i])
                  }))
            }
            unit="°C"
            extraLines={[
              { label: 'Upper Bound', value: specHigh},
              { label: 'Lower Bound', value: specLow}
            ]}
          />
        </Module>

        <Module name={"Reactor 2 Temp"} spanColumn={12} spanRow={4}>
          <ChartMod
            isTimeAxis={mode === 'single' ? 'true' : false}
            title={mode === 'single' ? 'Reactor 2 Temps by Time' : 'Avg Reactor 2 Temp by Day'}
            labels={
              mode === 'single'
                ? chart2LabelsARA.map(time => time.split(':').slice(0, 2).join(':')).reverse()
                : chart2LabelsARA
            }
            dataPoints={
              mode === 'single'
                ? chart2LabelsARA.map((time, i) => ({
                    x: new Date(`1970-01-01T${time}`),
                    y: Number(chart2DataARA[i])
                  })).reverse()
                : chart2LabelsARA.map((date, i) => ({
                    x: date,
                    y: Number(chart2DataARA[i])
                  }))
            }
            unit="°C"
            extraLines={[
              { label: 'Upper Bound', value: specHigh},
              { label: 'Lower Bound', value: specLow}
            ]}
          />
        </Module>
        
        <Module name={"Com. Biochar Produced (kg)"} spanColumn={4} spanRow={2}>
          <Figure value={totalWeightARA} variant="2" unit="kg" decimals={0} />
        </Module>

        <Module name={"Avg. Heat Generated (per hour)"} spanColumn={4} spanRow={2}>
          <Figure value={dailyHeatGenARA/24} variant="2" unit="kW"/>
        </Module>

        <Module name={"Avg. Heat Generated (daily)"} spanColumn={4} spanRow={2}>
          <Figure value={dailyHeatGenARA} variant="2" unit="kW"/>
        </Module>

        <Module name={"Fault Messages"} spanColumn={12} spanRow={3}>
          <FaultMessages messages={faultMessagesARA} />
        </Module>

        <Module name={"Avg. Biomass MC"} spanColumn={4} spanRow={1}>
          <Figure value={avgMCARA} unit = {""} />
        </Module>
        <Module name={"Biochar (Overflow)"} spanColumn={4} spanRow={1}>
          <Figure value={dailyHeatGenARA} unit="kW"/>
        </Module>
        <Module name={"Biochar (Total Weight)"} spanColumn={4} spanRow={1}>
          <Figure value={dailyHeatGenARA} unit="kW"/>
        </Module>
      </div>
    </ModuleMain>
  </div>
  );
};

export default DataAnalysisPage;
