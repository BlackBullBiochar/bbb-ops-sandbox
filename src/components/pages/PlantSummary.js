import React, { useContext, useState, useRef } from "react";
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
import PhotoOfTheWeek from "../PhotoOfTheWeek.js";
import kpiStyles from "./PlantSummary.module.css";
import FaultMessageListContainer from "../FaultMessageListContainer.js";
import PdfExporter from "../PdfExporter.js";
import Button from "../Button.js";
import { useFilterDispatch, useFilters, ACTIONS } from '../../contexts/FilterContext';
import { useTempDataRows } from '../../hooks/useTempDataRows';
import { useBagDataRows } from '../../hooks/useBagDataRows';
import { useSingleRangeTempChart } from '../../hooks/useSingleRangeTempChart'
import { useRangeTempChart } from '../../hooks/useRangeTempChart';
import { useBagStats } from '../../hooks/useBagTotal.js';
import { useRunningHours } from '../../hooks/useTempTotal.js';
import { useSensorReadings } from '../../hooks/useSensorReadings';
import { useHeatTotal } from '../../hooks/useHeatTotal.js';


// Helper function to get the previous week in ISO format
const getPreviousWeek = () => {
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentYear = now.getFullYear();
  
  // Calculate previous week
  let prevWeek = currentWeek - 1;
  let prevYear = currentYear;
  
  // Handle year boundary
  if (prevWeek < 1) {
    prevWeek = 52; // Last week of previous year
    prevYear = currentYear - 1;
  }
  
  return `${prevYear}-W${prevWeek.toString().padStart(2, '0')}`;
};

// Helper function to get ISO week number
const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const PlantSummaryView = () => {
  const dispatch = useFilterDispatch();
  const { shouldFetch } = useFilters();
  const contentRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isWeek, setIsWeek]     = useState(true);
  const [week, setWeek]         = useState(getPreviousWeek());  
  const [specHigh, setSpecHigh] = useState(780); 
  const [specLow, setSpecLow] = useState(520);
  const [localFetchTrigger, setLocalFetchTrigger] = useState(0);

  
  const [selectedSite, setSelectedSite] = useState('ARA');

  // editable KPIs (persist to localStorage) - reset to 0 for fresh start
  const [runningHoursInput, setRunningHoursInput] = useState(0);
  const [heatOutputInput, setHeatOutputInput] = useState(0);
  const [co2RemovedInput, setCo2RemovedInput] = useState(0);
  const [biocharInput, setBiocharInput] = useState(0);

  const handleToggleSite = (site) => {
    const k = `ps_heatOutput_${selectedSite}`;
    try { localStorage.setItem(k, String(heatOutputInput)); } catch {}
    setSelectedSite(site);
  };

  // persist on blur
  const handleKpiBlur = (key, val, setter) => {
    setter(val);
    try { localStorage.setItem(`ps_${key}`, String(val)); } catch {}
  };
  
  const ARAbagRows = useBagDataRows(
    'ARA',
    localFetchTrigger > 0 && selectedSite.includes('ARA')
  );
  const JNRbagRows = useBagDataRows(
    'JNR',
    localFetchTrigger > 0 && selectedSite.includes('JNR')
  );

  const ARAtempRows = useTempDataRows(
    'ARA',
    localFetchTrigger > 0 && selectedSite.includes('ARA')
  );
  const JNRtempRows = useTempDataRows(
    'JNR',
    localFetchTrigger > 0 && selectedSite.includes('JNR')
  );

  const rawSensoreReadings = useSensorReadings(
    localFetchTrigger > 0
  );

  // Both hooks return flattened arrays already
  const rawTempRows = selectedSite === 'ARA' ? ARAtempRows : JNRtempRows;
  const rawBagRows = selectedSite === 'ARA' ? ARAbagRows : JNRbagRows;
  
  // Use the data directly since hooks already flatten them
  const chartRows = rawTempRows;
  const sensorRows = rawSensoreReadings;

  const meterDelta = useHeatTotal(sensorRows, 'energy');
  const { totalWeight, bagCount } = useBagStats(rawBagRows);
  
  // Calculate biochar produced (sum of weights of bags in time period)
  const biocharProduced = totalWeight / 1000; // Convert kg to tonnes
  
  
  // Calculate CO2 removed using correct formula
  const calculateCO2Removed = (bagRows, siteCode) => {
    if (!Array.isArray(bagRows) || bagRows.length === 0) {
      console.log('No bag rows available for CO2 calculation');
      return 0;
    }
    
    console.log('Bag rows for CO2 calculation:', bagRows.length, 'rows');
    console.log('Sample bag data:', bagRows[0]);
    
    const CORC_FACTORS = {
      'ARA': 2.466, // tCO2/dry t biochar
      'JNR': 3.02   // tCO2/dry t biochar
    };
    
    const totalDryWeight = bagRows.reduce((sum, bag) => {
      const bagWeight = parseFloat(bag.weight) || 0; // in kg
      const bagMC = parseFloat(bag.moisture_content) || 0; // moisture content %
      
      // bagDryWeight (in tonnes) = bagWeight*(1-bagMC/100)/1000
      const bagDryWeight = bagWeight * (1 - bagMC / 100) / 1000;
      
      console.log(`Bag: weight=${bagWeight}kg, MC=${bagMC}%, dryWeight=${bagDryWeight}t`);
      
      return sum + bagDryWeight;
    }, 0);
    
    const corcFactor = CORC_FACTORS[siteCode] || 0;
    const co2Removed = totalDryWeight * corcFactor;
    
    console.log(`Total dry weight: ${totalDryWeight}t, CORC factor: ${corcFactor}, CO2 removed: ${co2Removed}t`);
    
    return co2Removed;
  };
  
  const totalCO2 = calculateCO2Removed(rawBagRows, selectedSite);
  
  // Fallback to manual input if no data is available
  const displayCO2 = rawBagRows.length > 0 ? totalCO2 : co2RemovedInput;
  
  // Fallback values when no data is fetched
  const displayBiochar = rawBagRows.length > 0 ? biocharProduced : biocharInput;
  const displayHeat = rawBagRows.length > 0 && meterDelta !== null ? meterDelta : heatOutputInput;
  
  const { hours: ARArunningHours } = useRunningHours(rawTempRows, 520, 720, ['r1_temp','r2_temp']);
  const { hours: JNRrunningHours } = useRunningHours(rawTempRows, 520, 720, ['t5_temp']);

  const runningHours = selectedSite === 'ARA' ? ARArunningHours : JNRrunningHours;

  // Debug logs after all variables are initialized
  console.log('Debug - Selected site:', selectedSite);
  console.log('Debug - Local fetch trigger:', localFetchTrigger);
  console.log('Debug - Raw bag rows length:', rawBagRows?.length);
  console.log('Debug - Raw bag rows sample:', rawBagRows?.[0]);
  console.log('Debug - ARA bag rows length:', ARAbagRows?.length);
  console.log('Debug - JNR bag rows length:', JNRbagRows?.length);
  console.log('Debug - Sensor rows length:', sensorRows?.length);
  console.log('Debug - Sensor rows sample:', sensorRows?.[0]);
  console.log('Debug - Meter delta (heat):', meterDelta);
  console.log('Debug - Total weight (kg):', totalWeight);
  console.log('Debug - Biochar produced (t):', biocharProduced);
  console.log('Debug - Total CO2 calculated:', totalCO2);
  console.log('Debug - Display CO2:', displayCO2);
  console.log('Debug - Display Biochar:', displayBiochar);
  console.log('Debug - Display Heat:', displayHeat);
  console.log('Debug - Running hours:', runningHours);

  // for week mode we need full timestamps; build two series of {x:Date,y:number}
  // for week‐mode we use our new hook:
  const { labels: r1WeekLabels, data: r1WeekData } = useSingleRangeTempChart(chartRows, 'r1_temp');
  const { labels: r2WeekLabels, data: r2WeekData } = useSingleRangeTempChart(chartRows, selectedSite === 'ARA' ? 'r2_temp' : 't5_temp');

// still keep the hooks for range mode
  const { labels: r1RangeLabels, data: r1RangeData } = useRangeTempChart(chartRows, 'r1_temp');
  const { labels: r2RangeLabels, data: r2RangeData } = useRangeTempChart(chartRows, selectedSite === 'ARA' ? 'r2_temp' : 't5_temp');

  const {labels: sensorWeekLabels, data: sensorWeekData} = useSingleRangeTempChart(sensorRows,'energy');
  const {labels: sensorRangeLabels, data: sensorRangeData} = useRangeTempChart(sensorRows,'energy');

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
      // Add one day to toDate to include the last day (API treats toDate as exclusive)
      const extendedToDate = new Date(new Date(t).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      console.log(ACTIONS.SET_FROM_DATE, f);
      console.log(ACTIONS.SET_TO_DATE, extendedToDate);
      dispatch({ type: ACTIONS.SET_FROM_DATE, payload: f });
      dispatch({ type: ACTIONS.SET_TO_DATE, payload: extendedToDate });
    } else {
     dispatch({ type: ACTIONS.SET_FROM_DATE, payload: fromDate });
     dispatch({ type: ACTIONS.SET_TO_DATE,   payload: toDate });
    }

    // trigger data fetch using local trigger
    console.log('Triggering data fetch with local trigger...');
    setLocalFetchTrigger(prev => prev + 1);
  };
  return (
    <div>
      <div className={kpiStyles.topRow}>
        <DateSelector2
          isWeek={isWeek}
          week={week}
          fromDate={fromDate}
          toDate={toDate}
          onToggle={() => {
            if (!isWeek) {
              window.location.reload();
            } else {
              setIsWeek(false);
            }
          }}
          onChange={(type, value) => {
            if (type === 'week') setWeek(value);
            if (type === 'from') setFromDate(value);
            if (type === 'to') setToDate(value);
          }}
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
        <Button name="Fetch Data" onPress={handleFetch} />
        {/* <PdfExporter
          elementRef={contentRef}
          filename="Plant_Summary"
          title="Plant Summary"
          subtitle={`${selectedSite} - ${isWeek ? `Week ${week}` : `${fromDate} to ${toDate}`}`}
          buttonText="Export"
        /> */}
      </div>

      <div ref={contentRef} className={styles.contentGrid}>
        <Module name="Plant Updates" spanColumn={12} spanRow={2} bannerHeader={true}>
          <FaultMessageListContainer siteCode={selectedSite} variant="editable" showDate showSite />
        </Module>

        {/* Dark KPIs container */}
        <div className={kpiStyles.darkCard} style={{ gridColumn: '13 / -1', gridRow: '1 / 3' }}>
          {/* Running Hours */}
          <div className={kpiStyles.kpiItem}>
            <div className={kpiStyles.kpiLabel}>Running Hours</div>
            <div className={kpiStyles.kpiValue}>
              {selectedSite === "ARA" ? (
                <EditableFigure initialValue={runningHoursInput} onChange={(v) => handleKpiBlur('runningHours', v, setRunningHoursInput)} color="#fff" placeholder="Enter Value" />
              ) : (
                <span style={{ color: '#fff', fontSize: '2.8rem', fontFamily: 'RobotoCondensed, Arial, sans-serif' }}>
                  {runningHours.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          
          {/* Heat Output */}
          <div className={kpiStyles.kpiItem}>
            <div className={kpiStyles.kpiLabel}>
              {selectedSite === "ARA" ? "Heat Output (MWh)" : "Heat Usage (kWh)"}
            </div>
            <div className={kpiStyles.kpiValue}>
              {selectedSite === "ARA" ? (
                <span style={{ color: '#F06F53', fontSize: '2.8rem', fontFamily: 'RobotoCondensed, Arial, sans-serif' }}>
                  {displayHeat.toFixed(1)}
                </span>
              ) : (
                <EditableFigure initialValue={heatOutputInput} decimals={1} onChange={(v) => handleKpiBlur(`heatOutput_${selectedSite}`, v, setHeatOutputInput)} color="#F06F53" placeholder="Enter Value" />
              )}
            </div>
          </div>
          
          {/* CO2 Removed - Always calculated */}
          <div className={kpiStyles.kpiItem}>
            <div className={kpiStyles.kpiLabel}>Est. CO₂ removed (t)</div>
            <div className={kpiStyles.kpiValue}>
              <span style={{ color: '#B0E000', fontSize: '2.8rem', fontFamily: 'RobotoCondensed, Arial, sans-serif' }}>
                {displayCO2.toFixed(1)}
              </span>
            </div>
          </div>
          
          {/* Biochar Produced - Always calculated */}
          <div className={kpiStyles.kpiItem}>
            <div className={kpiStyles.kpiLabel}>Biochar Produced (t)</div>
            <div className={kpiStyles.kpiValue}>
              <span style={{ color: '#34B61F', fontSize: '2.8rem', fontFamily: 'RobotoCondensed, Arial, sans-serif' }}>
                {displayBiochar.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Combined Reactor Temps for Ahlstrom */}
        {selectedSite === "ARA" && (
          <Module name="Reactor Temperatures" spanColumn={12} spanRow={4} bannerHeader={true}>
            <ChartMod
              isTimeAxis={false}
              title={
                isWeek 
                  ? 'Reactor Temps Over Week' 
                  : 'Avg Reactor Temp by Day'
              }
              labels={isWeek ? r1WeekLabels : r1RangeLabels}
              unit="Temperature °C"
              extraLines={[
                { label: 'High', value: specHigh, borderWidth: 1 },
                { label: 'Low',  value: specLow, color: '#FF8C00' }
              ]}
              tickFormat={iso => iso.split('T')[0]}
              isWeekMode={isWeek}
              multipleDatasets={[
                {
                  label: 'Avg R1 Temp by Day',
                  dataPoints: (isWeek ? r1WeekLabels : r1RangeLabels).map((d, i) => ({
                    x: d,
                    y: (isWeek ? r1WeekData : r1RangeData)[i],
                  }))
                },
                {
                  label: 'Avg R2 Temp by Day',
                  dataPoints: (isWeek ? r2WeekLabels : r2RangeLabels).map((d, i) => ({
                    x: d,
                    y: (isWeek ? r2WeekData : r2RangeData)[i],
                  }))
                }
              ]}
            />
          </Module>
        )}
        
        {/* T5 Temps for Jenkinson */}
        {selectedSite === "JNR" && (
          <Module name="T5 Temp" spanColumn={12} spanRow={4} bannerHeader={true}>
            <ChartMod
              // always use category axis
              isTimeAxis={false}
              title={
                isWeek
                  ? 'T5 Temps Over Week'
                  : 'Avg T5 Temp by Day'
              }
              labels={isWeek ? r2WeekLabels : r2RangeLabels}
              dataPoints={
                (isWeek ? r2WeekLabels : r2RangeLabels).map((d, i) => ({
                  x: d,
                  y: (isWeek ? r2WeekData : r2RangeData)[i],
                }))
              }
              unit="Temperature °C"
              extraLines={[
                { label: 'High', value: specHigh, borderWidth: 1 },
                { label: 'Low',  value: specLow, color: '#FF8C00' }
              ]}
              isWeekMode={isWeek}
            />
          </Module>
        )}
        
        {/* Photo of the Week - for both Jenkinson and Ahlstrom */}
        <Module name="Photo of the Week" spanColumn={12} spanRow={4} bannerHeader={true} bannerType="secondary">
          <PhotoOfTheWeek siteCode={selectedSite} />
        </Module>
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
