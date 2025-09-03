import React, { useState } from 'react';
import styles from './DataAnalysisPage.module.css';
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from '../ModuleMain.js';
import Module from '../Module.js';
import ChartMod from '../ChartMod.js';
import Figure from '../Figure.js';
import DateSelector from '../DateSelector.js';
import CharcodesList from '../CharcodesList.js';
import FaultMessagesContainer from '../FaultMessagesContainer.js';
import { useFilterDispatch, useFilters, ACTIONS } from '../../contexts/FilterContext';
import { useSiteNames } from '../../hooks/useSiteNames';
import { useTempDataRows } from '../../hooks/useTempDataRows'
import { useBagDataRows } from '../../hooks/useBagDataRows';
import { useAvgTemps } from '../../hooks/useAvg.js';
import { useSingleTempChart } from '../../hooks/useSingleTempChart';
import { useRangeTempChart } from '../../hooks/useRangeTempChart';

const DataAnalysisPageJNR = () => {
  const dispatch = useFilterDispatch();
  const [specHigh, setSpecHigh] = useState(780); 
  const [specLow, setSpecLow] = useState(520);

  const [expanded, setExpanded] = useState(false);
  const [isRange, setIsRange] = useState(false);
  const [singleDate, setSingleDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fetchToggle, setFetchToggle] = useState(false);

  // pull rows whenever fetchToggle flips
  const bagRows = useBagDataRows('JNR', fetchToggle);
  const tempRows = useTempDataRows('JNR', fetchToggle);
  const [avg1, avg2, avg5, bagAvgWeight, bagAvgMC, bagTotalWeight] = useAvgTemps(tempRows, bagRows);
  const { labels: r1SingleLabels, data: r1SingleData } = useSingleTempChart(tempRows, 't5_temp');
  const { labels: r1RangeLabels, data: r1RangeData } = useRangeTempChart(tempRows, 't5_temp');

  const mode = isRange ? 'range' : 'single';

  const faultMessagesJNR = [];


  const handleFetch = () => {
    if (mode === 'single' && !singleDate) return alert('Pick a date');
    if (mode === 'range' && (!fromDate || !toDate)) return alert('Pick both start and end dates');

    dispatch({ type: ACTIONS.SET_MODE, payload: mode });
    dispatch({ type: ACTIONS.SET_SINGLE_DATE, payload: singleDate });
    dispatch({ type: ACTIONS.SET_FROM_DATE, payload: fromDate });
    dispatch({ type: ACTIONS.SET_TO_DATE, payload: toDate });

    // toggle to re-trigger data hooks
    setFetchToggle(true);
    setTimeout(() => setFetchToggle(false), 10); 
  };


  return (
    <div className={styles.mainWhiteContainer}>
      <ScreenHeader name={"JNR Plant Dashboard"} />
      <ModuleMain>
        <DateSelector
          isRange={isRange}
          singleDate={singleDate}
          fromDate={fromDate}
          toDate={toDate}
          onToggle={() => {
            if (isRange) {
              window.location.reload();       // was range → reload page
            } else {
              setIsRange(true);               // was single → go to range (no reload)
            }
          }}
          onChange={(type, value) => {
            if (type === 'single') setSingleDate(value);
            if (type === 'from') setFromDate(value);
            if (type === 'to') setToDate(value);
          }}
          onFetch={handleFetch}
        />

        <div className={styles.contentGrid}>
          <Module name="T5 Avg. Temp" spanColumn={3} spanRow={1}>
            <Figure title="T5 Avg. Temp" value={avg5} unit="°C" />
          </Module>

          <CharcodesList
            charcodes={bagRows}
            expanded={expanded}
            onToggle={() => setExpanded(prev => !prev)}
          />

          <Module name="T5 Avg. Temp" spanColumn={3} spanRow={1}>
            <Figure title="T5 Avg. Temp" value={avg5} unit="°C" />
          </Module>

          <Module name="T5 Temp" spanColumn={12} spanRow={4}>
            <ChartMod
              isTimeAxis={mode === 'single'}
              title={mode === 'single'
                ? 'T5 Temps by Time'
                : 'Avg T5 Temp by Day'}
              labels={mode === 'single' ? r1SingleLabels : r1RangeLabels}
              dataPoints={mode === 'single'
                ? r1SingleLabels.map((t, i) => ({ x: `${singleDate}T${t}`, y: r1SingleData[i] }))
                : r1RangeLabels.map((d, i) => ({ x: d, y: r1RangeData[i] }))}
              unit="°C"
              extraLines={[
                { label: 'Upper Bound', value: specHigh },
                { label: 'Lower Bound', value: specLow }
              ]}
            />
          </Module>

          <Module name="Com. Biochar Produced (kg)" spanColumn={4} spanRow={2}>
            <Figure value={bagTotalWeight} variant="2" unit="kg" decimals={0} />
          </Module>

          <Module name="Fault Messages" spanColumn={8} spanRow={4}>
            <FaultMessagesContainer  wrapperSize="lol" siteCode="JNR" />
          </Module>
          
          <Module name="Avg. Biomass MC" spanColumn={4} spanRow={2}>
            <Figure value={bagAvgMC} variant="2" unit="" />
          </Module>
        </div>
      </ModuleMain>
    </div>
  );  
};

export default DataAnalysisPageJNR;
