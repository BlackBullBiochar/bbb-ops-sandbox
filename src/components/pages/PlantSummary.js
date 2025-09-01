import React, { useContext, useState } from "react";
import styles from "./DataAnalysisPage.module.css";
import ScreenHeader from "../ScreenHeader";
import ModuleMain from "../ModuleMain";
import Module from "../Module";
import DateSelector2 from "../DateSelector2";
import SiteSelector from "../SiteSelector";
import Figure2 from "../Figure2";
import Figure from "../Figure";
import ChartMod from "../ChartMod";
import EditableFigure from "../EditableFigure.js";
import EditableParagraph from "../EditableParagraph";
import { useFilterDispatch, useFilters, ACTIONS } from '../../contexts/FilterContext';
import { useTempDataRows } from '../../hooks/useTempDataRows';
import { useBagDataRows } from '../../hooks/useBagDataRows';
import { useSingleRangeTempChart } from '../../hooks/useSingleRangeTempChart'
import { useRangeTempChart } from '../../hooks/useRangeTempChart';
import { useBagStats } from '../../hooks/useBagTotal.js';
import { useRunningHours } from '../../hooks/useTempTotal.js';
import { useSensorReadings } from '../../hooks/useSensorReadings';
import { useHeatTotal } from '../../hooks/useHeatTotal.js';
import usePowerFromSensorRows from '../../hooks/usePowerFromSensorRows.js'


const PlantSummaryView = () => {
  const dispatch = useFilterDispatch();
  const [expanded, setExpanded] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fetchToggle, setFetchToggle] = useState(false)
  const [isWeek, setIsWeek]     = useState(true);
  const [week, setWeek]         = useState("");  
  const [specHigh, setSpecHigh] = useState(780); 
  const [specLow, setSpecLow] = useState(520);

  
  const [selectedSite, setSelectedSite] = useState('ARA');

  const handleToggleSite = (site) => {
    setSelectedSite(site);
  };
  
  const ARAbagRows = useBagDataRows(
    'ARA',
    fetchToggle && selectedSite.includes('ARA')
  );
  const JNRbagRows = useBagDataRows(
    'JNR',
    fetchToggle && selectedSite.includes('JNR')
  );

  const ARAtempRows = useTempDataRows(
    'ARA',
    fetchToggle && selectedSite.includes('ARA')
  );
  const JNRtempRows = useTempDataRows(
    'JNR',
    fetchToggle && selectedSite.includes('JNR')
  );

  const rawSensoreReadings = useSensorReadings(
  fetchToggle
  );

  // flatten the object-of-arrays into a single array for charting
  const rawTempRows = selectedSite === 'ARA' ? ARAtempRows : JNRtempRows;
  const rawBagRows = selectedSite === 'ARA' ? ARAbagRows : JNRbagRows;
  // flatten the bagRows for stats
  const chartRows    = Object.values(rawTempRows).flat();
  const sensorRows    = Object.values(rawSensoreReadings).flat();

  const meterDelta = useHeatTotal(sensorRows, 'energy');
  const { totalWeight, bagCount } = useBagStats(rawBagRows);
  const { hours: ARArunningHours } = useRunningHours(rawTempRows, 520, 720, ['r1_temp','r2_temp']);
  const { hours: JNRrunningHours } = useRunningHours(rawTempRows, 520, 720, ['t5_temp']);
  const CO2perBag = 2.5003; // CO₂ removed per bag in tonnes
  const totalCO2 = (totalWeight/1000 * CO2perBag).toFixed(2);

  const runningHours = selectedSite === 'ARA' ? ARArunningHours : JNRrunningHours;

  // for week mode we need full timestamps; build two series of {x:Date,y:number}
  // for week‐mode we use our new hook:
  const { labels: r1WeekLabels, data: r1WeekData } = useSingleRangeTempChart(chartRows, 'r1_temp');
  const { labels: r2WeekLabels, data: r2WeekData } = useSingleRangeTempChart(chartRows, selectedSite === 'ARA' ? 'r2_temp' : 't5_temp');

// still keep the hooks for range mode
  const { labels: r1RangeLabels, data: r1RangeData } = useRangeTempChart(chartRows, 'r1_temp');
  const { labels: r2RangeLabels, data: r2RangeData } = useRangeTempChart(chartRows, selectedSite === 'ARA' ? 'r2_temp' : 't5_temp');

  const {labels: sensorWeekLabels, data: sensorWeekData} = useSingleRangeTempChart(sensorRows,'energy');
  const {labels: sensorRangeLabels, data: sensorRangeData} = useRangeTempChart(sensorRows,'energy');
    const { powerData, powerLabels } = usePowerFromSensorRows(sensorRows);

  const mode = isWeek ? 'week' : 'range';

  const isoWeekToDateRange = (iso) => {
    const [y, w] = iso.split("-W").map(Number);
    const d = new Date(Date.UTC(y, 0, 4));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day + (w - 1) * 7);
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - (d.getUTCDay() || 7) + 1);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const fmt = (d) => d.toISOString().slice(0, 10);
    return { fromDate: fmt(monday), toDate: fmt(sunday) };
  };
  
  const handleFetch = () => {
    if (mode === 'week' && !week) return alert('Pick a week');
    console.log('Fetching data for mode:', mode, 'week:', week, 'fromDate:', fromDate, 'toDate:', toDate);
    if (mode === 'range' && (!fromDate || !toDate)) return alert('Pick both start and end dates');

    dispatch({ type: ACTIONS.SET_MODE, payload: mode });

    if (mode === 'week') {
      const { fromDate: f, toDate: t } = isoWeekToDateRange(week);
      dispatch({ type: ACTIONS.SET_FROM_DATE, payload: f });
      dispatch({ type: ACTIONS.SET_TO_DATE,   payload: t });
    } else {
     dispatch({ type: ACTIONS.SET_FROM_DATE, payload: fromDate });
     dispatch({ type: ACTIONS.SET_TO_DATE,   payload: toDate });
    }
    setTimeout(() => { dispatch({ type: ACTIONS.RESET_FILTERS }); }, 10);

    // toggle to re-trigger data hooks
    setFetchToggle(true);
    setTimeout(() => setFetchToggle(false), 10); 
  };
  return (
    <div>
      <div className={styles.topRow}>
        <DateSelector2
          isWeek={isWeek}
          week={week}
          fromDate={fromDate}
          toDate={toDate}
          onToggle={() => setIsWeek(prev => !prev)}
          onChange={(type, value) => {
            if (type === 'week') setWeek(value);
            if (type === 'from') setFromDate(value);
            if (type === 'to') setToDate(value);
          }}
          onFetch={handleFetch}
        />
        <SiteSelector
          selected={[selectedSite]}
          onToggle={handleToggleSite}
          options={[
            { key: 'ARA', label: 'Ahlstrom' },
            { key: 'JNR', label: 'Jenkinson' }
          ]}
          singleSelect
        />
      </div>

      <div className={styles.contentGrid}>
        <Module name="Plant Updates" spanColumn={9} spanRow={2}>
          <EditableParagraph
            initialText="Plant operating smoothly."
            onSave={newText =>  newText}
          />
        </Module>

        <Module name="Running Hours" spanColumn={5} spanRow={1}>
          <Figure variant='3' value={runningHours} unit="" />
        </Module>

        {selectedSite === "ARA" && (
        <Module name="Heat Output" spanColumn={5} spanRow={1}>
          <Figure variant='3' value={meterDelta} unit="MWh"/>
        </Module>
        )}

        {selectedSite === "JNR" && (
        <Module name="Heat Usage (*Not Stored)" spanColumn={5} spanRow={1}>
          <EditableFigure
            initialValue={0}
            unit="kWh"
            variant="3"
            decimals={1}
          />
        </Module>
        )}

        <Module name="Biochar Produced (t)" spanColumn={5} spanRow={1}>
          <Figure variant='3' value={totalWeight/1000} unit="t" />
        </Module>

        <Module name="Equivalent CO₂ removed (t)" spanColumn={5} spanRow={1}>
          <Figure variant='3' value={parseFloat(totalCO2)} unit="t" />
        </Module>

        <Module name="Bags Produced" spanColumn={5} spanRow={1}>
          <Figure variant='3' value={bagCount} unit=""/>
        </Module>

        <Module name="Biomass Delivered (*Not Stored)" spanColumn={5} spanRow={1}>
          <EditableFigure
            initialValue={0}
            unit="t"
            variant="3"
            decimals={1}
          />
        </Module>

        {/* Reactor 1 Temps */}
        {selectedSite === "ARA" && (
          <Module name="Reactor 1 Temp" spanColumn={12} spanRow={4}>
            <ChartMod
              isTimeAxis={false}
              title={isWeek ? 'R1 Temps Over Week' : 'Avg R1 Temp by Day'}
              labels={isWeek ? r1WeekLabels : r1RangeLabels}
              dataPoints={(isWeek ? r1WeekLabels : r1RangeLabels).map((d,i)=>({
                x: d,
                y: (isWeek ? r1WeekData : r1RangeData)[i],
              }))}
              unit="°C"
              extraLines={[
                { label: 'High', value: specHigh },
                { label: 'Low',  value: specLow }
              ]}
              tickFormat={iso => iso.split('T')[0]}
            />
          </Module>
        )}

        
        {/* Reactor 2 or T5 Temps */}
        <Module name={selectedSite === 'ARA' ? 'Reactor 2 Temp' : 'T5 Temp'} spanColumn={12} spanRow={4}>
          <ChartMod
            // always use category axis
            isTimeAxis={false}
            title={
              isWeek
                ? selectedSite === 'ARA'
                  ? 'R2 Temps Over Week'
                  : 'T5 Temps Over Week'
                : selectedSite === 'ARA'
                ? 'Avg R2 Temp by Day'
                : 'Avg T5 Temp by Day'
            }
            labels={isWeek ? r2WeekLabels : r2RangeLabels}
            dataPoints={
              (isWeek ? r2WeekLabels : r2RangeLabels).map((d, i) => ({
                x: d,
                y: (isWeek ? r2WeekData : r2RangeData)[i],
              }))
            }
            unit="°C"
            extraLines={[
              { label: 'High', value: specHigh },
              { label: 'Low',  value: specLow }
            ]}
            // if you need to override default tickFormat:
            tickFormat={(iso) => iso.split('T')[0]}
          />
        </Module>
        <Module name="Photo of the Week" spanColumn={12} spanRow={4} />

        {selectedSite === "ARA" && (
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
                    y: powerData[i],
                  })).reverse()
                : powerLabels.map((d, i) => ({
                    x: d,
                    y: powerData[i],
                  }))}
              unit="MW"
            />
          </Module>
        )}
      </div>
    </div>
  );
};

const PlantSummary = () => (
  <div className={styles.mainWhiteContainer}>
    <ScreenHeader name="Plant Summary" />
    <ModuleMain>
      <PlantSummaryView />
    </ModuleMain>
  </div>
);

export default PlantSummary;
