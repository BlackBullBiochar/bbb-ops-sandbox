import React, { useState, useRef } from "react";
import styles from "./DataAnalysisPage.module.css";
import ScreenHeader from "../ScreenHeader";
import ModuleMain from "../ModuleMain";
import Module from "../Module";
import DateSelector2 from "../DateSelector2";
import SiteSelector from "../SiteSelector";
import ChartMod from "../ChartMod";
import EditableFigure from "../EditableFigure.js";
import PhotoOfTheWeek from "../PhotoOfTheWeek.js";
import kpiStyles from "./PlantSummary.module.css";
import FaultMessageListContainer from "../FaultMessageListContainer.js";
import Button from "../Button.js";
import { useFilterDispatch, useFilters, ACTIONS } from "../../contexts/FilterContext";
import { useTempDataRows } from "../../hooks/useTempDataRows";
import { useBagDataRows } from "../../hooks/useBagDataRows";
import { useSingleRangeTempChart } from "../../hooks/useSingleRangeTempChart";
import { useRangeTempChart } from "../../hooks/useRangeTempChart";
import { useBagStats } from "../../hooks/useBagTotal.js";
import { useRunningHours } from "../../hooks/useTempTotal.js";
import { useSensorReadings } from "../../hooks/useSensorReadings";
import { useHeatTotal } from "../../hooks/useHeatTotal.js";

// Helper function to get ISO week number
const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Helper function to get the previous week in ISO format
const getPreviousWeek = () => {
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentYear = now.getFullYear();

  let prevWeek = currentWeek - 1;
  let prevYear = currentYear;

  if (prevWeek < 1) {
    prevWeek = 52;
    prevYear = currentYear - 1;
  }

  return `${prevYear}-W${prevWeek.toString().padStart(2, "0")}`;
};

const PlantSummaryView = () => {
  const dispatch = useFilterDispatch();
  const contentRef = useRef(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isWeek, setIsWeek] = useState(true);
  const [week, setWeek] = useState(getPreviousWeek());
  const [specHigh] = useState(780);
  const [specLow] = useState(520);
  const [localFetchTrigger, setLocalFetchTrigger] = useState(0);

  const [selectedSite, setSelectedSite] = useState("ARA");

  // editable KPIs (persist to localStorage)
  const [heatOutputInput, setHeatOutputInput] = useState(0);
  const [co2RemovedInput] = useState(0);
  const [biocharInput] = useState(0);

  const handleToggleSite = (site) => {
    const k = `ps_heatOutput_${selectedSite}`;
    try {
      localStorage.setItem(k, String(heatOutputInput));
    } catch {}
    setSelectedSite(site);
  };

  const handleKpiBlur = (key, val, setter) => {
    setter(val);
    try {
      localStorage.setItem(`ps_${key}`, String(val));
    } catch {}
  };

  const ARAbagRows = useBagDataRows("ARA", localFetchTrigger > 0 && selectedSite.includes("ARA"));
  const JNRbagRows = useBagDataRows("JNR", localFetchTrigger > 0 && selectedSite.includes("JNR"));

  const ARAtempRows = useTempDataRows("ARA", localFetchTrigger > 0 && selectedSite.includes("ARA"));
  const JNRtempRows = useTempDataRows("JNR", localFetchTrigger > 0 && selectedSite.includes("JNR"));

  // ✅ now returns array with normalized timestamp strings (from your updated hook)
  const sensorRows = useSensorReadings(localFetchTrigger > 0);

  const rawTempRows = selectedSite === "ARA" ? ARAtempRows : JNRtempRows;
  const rawBagRows = selectedSite === "ARA" ? ARAbagRows : JNRbagRows;

  // KPI: heat delta over selected window (MWh)
  const meterDelta = useHeatTotal(sensorRows, "energy");

  // KPI: bags
  const { totalWeight, bagCount } = useBagStats(rawBagRows);
  const biocharProduced = totalWeight / 1000;

  // KPI: running hours
  const { hours: ARArunningHours } = useRunningHours(rawTempRows, 520, 720, ["r1_temp", "r2_temp"]);
  const { hours: JNRrunningHours } = useRunningHours(rawTempRows, 520, 720, ["t5_temp"]);
  const runningHours = selectedSite === "ARA" ? ARArunningHours : JNRrunningHours;

  // CO2 calc (unchanged)
  const calculateCO2Removed = (bagRows, siteCode) => {
    if (!Array.isArray(bagRows) || bagRows.length === 0) return 0;

    const CORC_FACTORS = { ARA: 2.466, JNR: 3.02 };

    const totalDryWeight = bagRows.reduce((sum, bag) => {
      const bagWeight = parseFloat(bag.weight) || 0;
      const bagMC = parseFloat(bag.moisture_content) || 0;
      const dryFraction = 1 - bagMC / 100;
      return sum + (bagWeight * dryFraction) / 1000;
    }, 0);

    return totalDryWeight * (CORC_FACTORS[siteCode] || 0);
  };

  const totalCO2 = calculateCO2Removed(rawBagRows, selectedSite);

  const displayCO2 = rawBagRows.length > 0 ? totalCO2 : co2RemovedInput;
  const displayBiochar = rawBagRows.length > 0 ? biocharProduced : biocharInput;
  const displayHeat = meterDelta !== null ? meterDelta : heatOutputInput;

  // ===== charts =====
  const chartRows = rawTempRows;

  const { labels: r1WeekLabels, data: r1WeekData } = useSingleRangeTempChart(chartRows, "r1_temp");
  const { labels: r2WeekLabels, data: r2WeekData } = useSingleRangeTempChart(
    chartRows,
    selectedSite === "ARA" ? "r2_temp" : "t5_temp"
  );

  const { labels: r1RangeLabels, data: r1RangeData } = useRangeTempChart(chartRows, "r1_temp");
  const { labels: r2RangeLabels, data: r2RangeData } = useRangeTempChart(
    chartRows,
    selectedSite === "ARA" ? "r2_temp" : "t5_temp"
  );

// adjustable number of hours averaged ABSOLUTE heat meter readings
const hourlyEnergy = (() => {
  const rows = Array.isArray(sensorRows) ? sensorRows : [];

  const pts = rows
    .map(r => ({
      t: r?.timestamp,
      e: Number(r?.energy),
    }))
    .filter(p => p.t && Number.isFinite(p.e))
    .sort((a, b) => new Date(a.t) - new Date(b.t));

  if (pts.length === 0) {
    return { labels: [], energyAvg: [] };
  }

  const BUCKET_HOURS = 3;
  const MS_PER_HOUR = 60 * 60 * 1000;

  const buckets = new Map(); // bucketStartISO -> { sum, count }

  for (const p of pts) {
    const d = new Date(p.t);

    // floor timestamp to nearest 3-hour boundary (UTC)
    const bucketStartMs =
      Math.floor(d.getTime() / (BUCKET_HOURS * MS_PER_HOUR)) *
      (BUCKET_HOURS * MS_PER_HOUR);

    const bucketStartISO = new Date(bucketStartMs).toISOString();

    const prev = buckets.get(bucketStartISO) || { sum: 0, count: 0 };
    prev.sum += p.e;
    prev.count += 1;
    buckets.set(bucketStartISO, prev);
  }

  const sorted = Array.from(buckets.entries()).sort(
    (a, b) => new Date(a[0]) - new Date(b[0])
  );

  const labels = sorted.map(([iso]) => iso);
  const energyAvg = sorted.map(([, b]) => b.sum / b.count);

  return { labels, energyAvg };
})();

const energyLabels = hourlyEnergy.labels;
const energyData = hourlyEnergy.energyAvg;

// mode for the plant summary is either "week" or "range" (default to week)
  const mode = isWeek ? "week" : "range";

  const isoWeekToDateRange = (iso) => {
    const [y, w] = iso.split("-W").map(Number);
    const d = new Date(Date.UTC(y, 0, 4));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day + (w - 1) * 7);
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - (d.getUTCDay() || 7) + 1);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const fmt = (dt) => dt.toISOString().slice(0, 10);
    return { fromDate: fmt(monday), toDate: fmt(sunday) };
  };

  const handleFetch = () => {
    if (mode === "week" && !week) return alert("Pick a week");
    if (mode === "range" && (!fromDate || !toDate)) return alert("Pick both start and end dates");

    dispatch({ type: ACTIONS.SET_MODE, payload: mode });

    if (mode === "week") {
      const { fromDate: f, toDate: t } = isoWeekToDateRange(week);
      dispatch({ type: ACTIONS.SET_FROM_DATE, payload: f });
      dispatch({ type: ACTIONS.SET_TO_DATE, payload: t });
    } else {
      dispatch({ type: ACTIONS.SET_FROM_DATE, payload: fromDate });
      dispatch({ type: ACTIONS.SET_TO_DATE, payload: toDate });
    }

    setLocalFetchTrigger((prev) => prev + 1);
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
            if (!isWeek) window.location.reload();
            else setIsWeek(false);
          }}
          onChange={(type, value) => {
            if (type === "week") setWeek(value);
            if (type === "from") setFromDate(value);
            if (type === "to") setToDate(value);
          }}
        />

        <SiteSelector
          selected={[selectedSite]}
          onToggle={handleToggleSite}
          options={[
            { key: "ARA", label: "Ahlstrom" },
            { key: "JNR", label: "Jenkinson" },
          ]}
          singleSelect
        />

        <Button name="Fetch Data" onPress={handleFetch} />
      </div>

      <div ref={contentRef} className={styles.contentGrid}>
        <Module name="Plant Updates" spanColumn={12} spanRow={2} bannerHeader={true}>
          <FaultMessageListContainer siteCode={selectedSite} variant="editable" showDate showSite />
        </Module>

        {/* KPIs */}
        <div className={kpiStyles.darkCard} style={{ gridColumn: "13 / -1", gridRow: "1 / 3" }}>
          <div className={kpiStyles.kpiItem}>
            <div className={kpiStyles.kpiLabel}>Running Hours</div>
            <div className={kpiStyles.kpiValue}>
              <span style={{ color: "#fff", fontSize: "2.8rem", fontFamily: "RobotoCondensed, Arial, sans-serif" }}>
                {runningHours.toFixed(1)}
              </span>
            </div>
          </div>

          <div className={kpiStyles.kpiItem}>
            <div className={kpiStyles.kpiLabel}>{selectedSite === "ARA" ? "Heat Output (MWh)" : "Heat Output (MWh)"}</div>
            <div className={kpiStyles.kpiValue}>
              {selectedSite === "ARA" ? (
                <span style={{ color: "#F06F53", fontSize: "2.8rem", fontFamily: "RobotoCondensed, Arial, sans-serif" }}>
                  {displayHeat.toFixed(1)}
                </span>
              ) : (
                <EditableFigure
                  initialValue={heatOutputInput}
                  decimals={1}
                  onChange={(v) => handleKpiBlur(`heatOutput_${selectedSite}`, v, setHeatOutputInput)}
                  color="#F06F53"
                  placeholder="Enter Value"
                />
              )}
            </div>
          </div>

          <div className={kpiStyles.kpiItem}>
            <div className={kpiStyles.kpiLabel}>Est. CO₂ removed (t)</div>
            <div className={kpiStyles.kpiValue}>
              <span style={{ color: "#B0E000", fontSize: "2.8rem", fontFamily: "RobotoCondensed, Arial, sans-serif" }}>
                {displayCO2.toFixed(1)}
              </span>
            </div>
          </div>

          <div className={kpiStyles.kpiItem}>
            <div className={kpiStyles.kpiLabel}>Biochar Produced (t)</div>
            <div className={kpiStyles.kpiValue}>
              <span style={{ color: "#34B61F", fontSize: "2.8rem", fontFamily: "RobotoCondensed, Arial, sans-serif" }}>
                {displayBiochar.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Temps */}
        {selectedSite === "ARA" && (
          <Module name="Reactor Temperatures" spanColumn={12} spanRow={4} bannerHeader={true}>
            <ChartMod
              isTimeAxis={false}
              title={isWeek ? "Reactor Temps Over Week" : "Avg Reactor Temp by Day"}
              labels={isWeek ? r1WeekLabels : r1RangeLabels}
              unit="Temperature °C"
              extraLines={[
                { label: "High", value: specHigh, borderWidth: 1 },
                { label: "Low", value: specLow, color: "#FF8C00" },
              ]}
              tickFormat={(iso) => iso.split("T")[0]}
              isWeekMode={isWeek}
              multipleDatasets={[
                {
                  label: "Avg R1 Temp by Day",
                  dataPoints: (isWeek ? r1WeekLabels : r1RangeLabels).map((d, i) => ({
                    x: d,
                    y: (isWeek ? r1WeekData : r1RangeData)[i],
                  })),
                },
                {
                  label: "Avg R2 Temp by Day",
                  dataPoints: (isWeek ? r2WeekLabels : r2RangeLabels).map((d, i) => ({
                    x: d,
                    y: (isWeek ? r2WeekData : r2RangeData)[i],
                  })),
                },
              ]}
            />
          </Module>
        )}

        {selectedSite === "JNR" && (
          <Module name="T5 Temp" spanColumn={12} spanRow={4} bannerHeader={true}>
            <ChartMod
              isTimeAxis={false}
              title={isWeek ? "T5 Temps Over Week" : "Avg T5 Temp by Day"}
              labels={isWeek ? r2WeekLabels : r2RangeLabels}
              dataPoints={(isWeek ? r2WeekLabels : r2RangeLabels).map((d, i) => ({
                x: d,
                y: (isWeek ? r2WeekData : r2RangeData)[i],
              }))}
              unit="Temperature °C"
              extraLines={[
                { label: "High", value: specHigh, borderWidth: 1 },
                { label: "Low", value: specLow, color: "#FF8C00" },
              ]}
              isWeekMode={isWeek}
            />
          </Module>
        )}

        {/* ARA: Heat meter total chart (period total) | JNR: Photo */}
        {selectedSite === "ARA" ? (
          <Module name="Heat Meter Monitor" spanColumn={12} spanRow={4} bannerHeader={true} bannerType="secondary">
            <ChartMod
              isTimeAxis={isWeek}
              title="Heat Meter Reading"
              labels={isWeek ? energyLabels.map(t => t.slice(0, 5)) : energyLabels}
              dataPoints={
                isWeek
                  ? energyLabels.map((timestamp, i) => ({
                      x: new Date(timestamp),
                      y: energyData[i], // 🔥 ABSOLUTE MWh
                    }))
                  : energyLabels.map((d, i) => ({
                      x: d,
                      y: energyData[i],
                    }))
              }
              unit="Energy (MWh)"
            />
          </Module>
        ) : (
          <Module name="Photo of the Week" spanColumn={12} spanRow={4} bannerHeader={true} bannerType="secondary">
            <PhotoOfTheWeek siteCode={selectedSite} />
          </Module>
        )}
      </div>
    </div>
  );
};

const PlantSummary = () => (
  <div className={styles.mainWhiteContainer}>
    <ScreenHeader iconName="FaIndustry" name="Plant Summary" />
    <ModuleMain>
      <PlantSummaryView />
    </ModuleMain>
  </div>
);

export default PlantSummary;
