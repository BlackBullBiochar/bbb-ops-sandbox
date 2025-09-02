// pages/CharcodeSummary.jsx
import React, { useState } from "react";
import styles from "./CharcodeSummary.module.css";
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from "../ModuleMain.js";
import Module from "../Module.js";
import DateSelector2 from "../DateSelector2";
import Figure2 from "../Figure2.js"
import PieChart from '../PieChart';  
import { ACTIONS, useFilterDispatch } from "../../contexts/FilterContext.js";
import { useBagPerformanceCount } from "../../hooks/useBagPerformanceRows.js";
import { useLateBags } from "../../hooks/useLateBags.js";
import { useUniqueAppliedUsers } from "../../hooks/useUniqueAppliedUsers.js";
import { useOrderPerformance } from "../../hooks/useOrderPerformance.js";

const CharcodeSummaryView = () => {
  const dispatch = useFilterDispatch();
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [fetchToggle, setFetchToggle] = useState(false)
    const [isWeek, setIsWeek]     = useState(true);
    const [week, setWeek]         = useState("");  
    const { lateBags: ARAlateBags, count: ARAcount } = useLateBags('ARA', fetchToggle);
    const { lateBags: JNRlateBags, count: JNRcount } = useLateBags('JNR', fetchToggle);
    const { count: ARAUserCount, uniqueUserIds: ARAuniqueUserIds } = useUniqueAppliedUsers('ARA', fetchToggle);
    const { count: JNRUserCount, uniqueUserIds: JNRuniqueUserIds } = useUniqueAppliedUsers('JNR', fetchToggle);
    const { orders, statusCounts, totalAmount, loading, error } = useOrderPerformance(fetchToggle);

    const computeWeightedSameDayRate = (araCounts, jnrCounts) => {
      const araRate = Number(araCounts.sameDayRate);
      const jnrRate = Number(jnrCounts.sameDayRate);

      const araTotal = araCounts.sameDayCount / (araRate / 100 || 1);
      const jnrTotal = jnrCounts.sameDayCount / (jnrRate / 100 || 1);

      const totalBags = araTotal + jnrTotal;

      if (totalBags === 0) return '0.00';

      const weightedAvg = ((araRate * araTotal) + (jnrRate * jnrTotal)) / totalBags;

      return weightedAvg.toFixed(2);
    };

    const labels = ['Good Bags', 'Late Bags'];
      
    const { counts: araCounts, rows: araRows } = useBagPerformanceCount(
      'ARA',
      fetchToggle
    );

    const { counts: jnrCounts, rows: jnrRows } = useBagPerformanceCount(
      'JNR',
      fetchToggle
    );

    const pickupTotal = (araCounts.pickup + jnrCounts.pickup) || 0;
    const sheduledBags = totalAmount || 0;
    const scheduledPecent = (pickupTotal/sheduledBags * 100).toFixed(1);
    const ARAData = [(araCounts.bagging-ARAcount), ARAcount];
    const JNRData = [(jnrCounts.bagging - JNRcount), JNRcount];
    const ARAPercent = ((ARAcount / (araCounts.bagging)) * 100).toFixed(1);
    const JNRPercent = ((JNRcount / (jnrCounts.bagging)) * 100).toFixed(1);
    const appliedBags = araCounts.application + jnrCounts.application;
    const appUsers = ARAUserCount + JNRUserCount;

    const SameDayPercentage = computeWeightedSameDayRate(araCounts, jnrCounts);

    const safeNumbers = [
      +SameDayPercentage,
      +scheduledPecent,
      +ARAPercent,
      +JNRPercent
    ].filter(n => !isNaN(n));

    const TotalSuccessPercent = safeNumbers.length
      ? (safeNumbers.reduce((a, b) => a + b, 0) / safeNumbers.length).toFixed(1)
      : '0.00';

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
    <div className={styles.mainWhiteContainer}>
      <ScreenHeader name="Charcode Performance Summary" />
      <ModuleMain>
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
          </div>
          <div className={styles.contentGrid}>
                    <Module name="Ahlstrom Bagging Performance" spanColumn={12} spanRow={1}>
                      <Figure2 title="ARA" value={ARAcount} unit="" blurb="Bags logged more than 3 days after production"/>
                    </Module>
                    <Module name="Ahlstrom Bags" spanColumn={6} spanRow={3}>
                      <PieChart data={ARAData} labels={labels}/>
                      <Figure2 title="ARA" value={ARAPercent} unit="%" blurb="of bags were late"/>
                    </Module>
                    <Module name="Jenkinson Bags" spanColumn={6} spanRow={3}>
                      <PieChart data={JNRData} labels={labels}/>
                      <Figure2 title="ARA" value={JNRPercent} unit="%" blurb="of bags were late"/>
                    </Module>
                    <Module name="Jenkinson Bagging Performance" spanColumn={12} spanRow={1}>
                      <Figure2 title="ARA" value={JNRcount} unit="" blurb="Bags logged more than 3 days after production"/>
                    </Module>
                    <Module name="Scheduled Delivery Performance" spanColumn={12}>
                      <Figure2 title="ARA" value={scheduledPecent} unit="%" blurb="Bags scheduled for shipping were picked up"/>
                    </Module>
                    <Module name="Shipping Performance" spanColumn={12}>
                      <Figure2 title="ARA" value={SameDayPercentage} unit="%" blurb="Picked-up bags were delivered on the same day"/>
                    </Module>
                    <Module name="Applied Bags" spanColumn={12}>
                      <Figure2 title="ARA" value={appliedBags} unit="" blurb="Bags applied"/>
                    </Module>
                    <Module name="Form Users" spanColumn={12}>
                      <Figure2 title="ARA" value={appUsers} unit="" blurb="Farmers submitted an 'applied' form"/>
                    </Module>
                    <Module name="Total Success" spanColumn={12}>
                      <Figure2 title="All" value={TotalSuccessPercent} unit="%" blurb="of Charcodes were Successful"/>
                    </Module>
            </div>
        </div>
      </ModuleMain>
    </div>
  );
};

export default CharcodeSummaryView;
