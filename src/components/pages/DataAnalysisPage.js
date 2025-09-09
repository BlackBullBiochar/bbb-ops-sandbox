import React, { useState, useMemo } from 'react';
import styles from './DataAnalysisPage.module.css';
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from '../ModuleMain.js';
import Module from '../Module.js';
import ChartMod from '../ChartMod.js';
import Figure from '../Figure.js';
import DateSelector from '../DateSelector.js';
import CharcodesList from '../CharcodesList.js';
import FaultMessagesContainer from '../FaultMessagesContainer.js';
import { useRangeHours } from '../../hooks/useRangeHours.js';
import { useHeatTotal } from '../../hooks/useHeatTotal.js';
import { useFilterDispatch, useFilters, ACTIONS } from '../../contexts/FilterContext';
import { useSiteNames } from '../../hooks/useSiteNames';
import { useTempDataRows } from '../../hooks/useTempDataRows';
import { useBagDataRows } from '../../hooks/useBagDataRows';
import { useAvgTemps } from '../../hooks/useAvg.js';
import { useSingleTempChart } from '../../hooks/useSingleTempChart'
import { useRangeTempChart } from '../../hooks/useRangeTempChart';
import { useSensorReadings } from '../../hooks/useSensorReadings';
import { useBagStats } from '../../hooks/useBagTotal.js';
import usePowerFromSensorRows from '../../hooks/usePowerFromSensorRows.js'

const DataAnalysisPage = () => {
  const dispatch = useFilterDispatch();
  const [specHigh, setSpecHigh] = useState(780); 
  const [specLow, setSpecLow] = useState(520);
  const siteNames = useSiteNames();

  const [expanded, setExpanded] = useState(false);
  const [isRange, setIsRange] = useState(false);
  const [singleDate, setSingleDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fetchToggle, setFetchToggle] = useState(false);

  // pull tempRows whenever fetchToggle flips
  const bagRows = useBagDataRows('ARA', fetchToggle);
  const tempRows = useTempDataRows('ARA', fetchToggle);
  const rawSensoreReadings = useSensorReadings(fetchToggle);

  const noHours = useRangeHours();
  const sensorRows    = Object.values(rawSensoreReadings).flat();
  const meterDelta = useHeatTotal(sensorRows, 'energy');
  const avgHeatGenerated = meterDelta / noHours;  
  const { totalWeight, bagCount } = useBagStats(bagRows);
  const [avg1, avg2, avg5, bagAvgWeight, bagAvgMC] = useAvgTemps(tempRows, bagRows);
  const { labels: r1SingleLabels, data: r1SingleData } = useSingleTempChart(tempRows, 'r1_temp');
  const { labels: r1RangeLabels, data: r1RangeData } = useRangeTempChart(tempRows, 'r1_temp');
  const { labels: r2SingleLabels, data: r2SingleData } = useSingleTempChart(tempRows, 'r2_temp');
  const { labels: r2RangeLabels, data: r2RangeData } = useRangeTempChart(tempRows, 'r2_temp');
  const {labels: sensorSingleLabels, data: sensorSingleData} = useSingleTempChart(sensorRows,'energy');
  const {labels: sensorRangeLabels, data: sensorRangeData} = useRangeTempChart(sensorRows,'energy');
  const { powerData, powerLabels } = usePowerFromSensorRows(sensorRows);

  // placeholders—replace or move into context as needed
  const faultMessagesARA = [];

  const mode = isRange ? 'range' : 'single';

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
      <ScreenHeader name="ARA Plant Dashboard" />
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
          <Module name="Reactor 1 Avg. Temp (°C)" spanColumn={3} spanRow={1}>
            <Figure value={avg1} unit="" />
          </Module>

          <CharcodesList
            charcodes={bagRows}
            expanded={expanded}
            onToggle={() => setExpanded(prev => !prev)}
          />

          <Module name="Reactor 2 Avg. Temp (°C)" spanColumn={3} spanRow={1}>
            <Figure value={avg2} unit="" />
          </Module>

          <Module name="Reactor 1 Temp" spanColumn={12} spanRow={4}>
            <ChartMod
              isTimeAxis={mode === 'single'}
              title={mode === 'single'
                ? 'Reactor 1 Temps by Time'
                : 'Avg Reactor 1 Temp by Day'}
              labels={mode === 'single' ? r1SingleLabels : r1RangeLabels}
              dataPoints={mode === 'single'
                ? r1SingleLabels.map((t, i) => ({ x:`${singleDate}T${t}`, y: r1SingleData[i] }))
                : r1RangeLabels.map((d, i) => ({ x: d, y: r1RangeData[i] }))}
              unit="Temperature °C"
              extraLines={[
                { label: 'Upper Bound', value: specHigh },
                { label: 'Lower Bound', value: specLow }
              ]}
            />
          </Module>

          <Module name="Reactor 2 Temp" spanColumn={12} spanRow={4}>
            <ChartMod
              isTimeAxis={mode === 'single'}
              title={mode === 'single'
                ? 'Reactor 2 Temps by Time'
                : 'Avg Reactor 2 Temp by Day'}
              labels={mode === 'single' ? r2SingleLabels : r2RangeLabels}
              dataPoints={mode === 'single'
                ? r2SingleLabels.map((t, i) => ({ x:`${singleDate}T${t}`, y: r2SingleData[i] }))
                : r2RangeLabels.map((d, i) => ({ x: d, y: r2RangeData[i] }))}
              unit="Temperature °C"
              extraLines={[
                { label: 'Upper Bound', value: specHigh },
                { label: 'Lower Bound', value: specLow }
              ]}
            />
          </Module>

          <Module name="Total Biochar Produced (kg)" spanColumn={4} spanRow={2}>
            <Figure value={totalWeight} variant="2" unit="" decimals={0} />
          </Module>

          <Module name="Avg. Energy Generated (MWh)" spanColumn={4} spanRow={2}>
            <Figure value={avgHeatGenerated} variant="2" unit="" />
          </Module>

          <Module name="Total Heat Generated (MWh)" spanColumn={4} spanRow={2}>
            <Figure value={meterDelta} variant="2" unit="" />
          </Module>
          <Module name="Heat Monitor" spanColumn={12} spanRow={4}>
            <ChartMod
              isTimeAxis={mode === 'single'}
              title={mode === 'single'
                ? 'Instantaneous Power Output'
                : 'Instantaneous Power Output'}
              labels={mode === 'single'
                ? powerLabels.map(t => t.slice(0, 5)).reverse()
                : powerLabels}
              dataPoints={mode === 'single'
                ? powerLabels.map((timestamp, i) => ({
                    x: new Date(timestamp),
                    y: 1000*(powerData[i]),
                  })).reverse()
                : powerLabels.map((d, i) => ({
                    x: d,
                    y: 1000*(powerData[i]),
                  }))}
              unit="Power Output (kW)"
            />
          </Module>
          <Module name="Fault Messages" spanColumn={8} spanRow={2}>
            <FaultMessagesContainer  wrapperSize="lol" siteCode="ARA" />
          </Module>

          <Module name="Avg. Biomass MC (%)" spanColumn={4} spanRow={2}>
            <Figure value={bagAvgMC} variant="2" unit="" />
          </Module>
        </div>
      </ModuleMain>
    </div>
  );
};

export default DataAnalysisPage;
