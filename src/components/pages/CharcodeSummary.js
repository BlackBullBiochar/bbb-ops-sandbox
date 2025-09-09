// pages/CharcodeSummary.jsx
import React, { useState } from "react";
import styles from "./CharcodeSummary.module.css";
import ScreenHeader from "../ScreenHeader.js";
import ModuleMain from "../ModuleMain.js";
import Module from "../Module.js";
import DateSelector2 from "../DateSelector2";
import Figure2 from "../Figure2.js";
import PieChart from "../PieChart";
import { ACTIONS, useFilterDispatch } from "../../contexts/FilterContext.js";
import { useBagPerformanceCount } from "../../hooks/useBagPerformanceRows.js";
import { useLateBags } from "../../hooks/useLateBags.js";
import { useUniqueAppliedUsers } from "../../hooks/useUniqueAppliedUsers.js";
import { useOrderPerformance } from "../../hooks/useOrderPerformance.js";

const CharcodeSummaryView = () => {
  const dispatch = useFilterDispatch();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fetchToggle, setFetchToggle] = useState(false);
  const [isWeek, setIsWeek] = useState(true);
  const [week, setWeek] = useState("");
  const [searched, setSearched] = useState(false);

  const { lateBags: ARAlateBags, count: ARAcount } = useLateBags("ARA", fetchToggle);
  const { lateBags: JNRlateBags, count: JNRcount } = useLateBags("JNR", fetchToggle);

  const { count: ARAUserCount } = useUniqueAppliedUsers("ARA", fetchToggle);
  const { count: JNRUserCount } = useUniqueAppliedUsers("JNR", fetchToggle);

  const { orders, statusCounts, totalAmount, loading, error } = useOrderPerformance(fetchToggle);

  const computeWeightedSameDayRate = (araCounts, jnrCounts) => {
    const araRate = Number(araCounts.sameDayRate);
    const jnrRate = Number(jnrCounts.sameDayRate);

    const araTotal = araCounts.sameDayCount / (araRate / 100 || 1);
    const jnrTotal = jnrCounts.sameDayCount / (jnrRate / 100 || 1);

    const totalBags = (araTotal || 0) + (jnrTotal || 0);
    if (totalBags === 0) return "0.00";

    const weightedAvg =
      ((araRate || 0) * (araTotal || 0) + (jnrRate || 0) * (jnrTotal || 0)) / totalBags;

    return Number.isFinite(weightedAvg) ? weightedAvg.toFixed(2) : "0.00";
  };

  const labels = ["Good Bags", "Late Bags"];

  const { counts: araCounts, rows: araRows } = useBagPerformanceCount("ARA", fetchToggle);
  const { counts: jnrCounts, rows: jnrRows } = useBagPerformanceCount("JNR", fetchToggle);

  // Derived numbers with safety/empty handling
  const pickupTotal = ((araCounts?.pickup || 0) + (jnrCounts?.pickup || 0)) || 0;
  const sheduledBags = totalAmount || 0; // keep original var name
  const scheduledPecent =
    sheduledBags > 0 ? ((pickupTotal / sheduledBags) * 100).toFixed(1) : "0.0";

  const ARAData = [
    Math.max((araCounts?.bagging || 0) - (ARAcount || 0), 0),
    ARAcount || 0,
  ];
  const JNRData = [
    Math.max((jnrCounts?.bagging || 0) - (JNRcount || 0), 0),
    JNRcount || 0,
  ];

  const ARAPercent =
    (araCounts?.bagging || 0) > 0
      ? (((ARAcount || 0) / (araCounts.bagging || 1)) * 100).toFixed(1)
      : "";

  const JNRPercent =
    (jnrCounts?.bagging || 0) > 0
      ? (((JNRcount || 0) / (jnrCounts.bagging || 1)) * 100).toFixed(1)
      : "";

  const appliedBags = (araCounts?.application || 0) + (jnrCounts?.application || 0);
  const appUsers = (ARAUserCount || 0) + (JNRUserCount || 0);

  const SameDayPercentage = computeWeightedSameDayRate(
    araCounts || {},
    jnrCounts || {}
  );

  const safeNumbers = [ +SameDayPercentage, +scheduledPecent, +ARAPercent, +JNRPercent ]
    .filter((n) => !isNaN(n));

  const TotalSuccessPercent = safeNumbers.length
    ? (safeNumbers.reduce((a, b) => a + b, 0) / safeNumbers.length).toFixed(1)
    : "0.00";

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
    const fmt = (d) => d.toISOString().slice(0, 10);
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

    setTimeout(() => {
      dispatch({ type: ACTIONS.RESET_FILTERS });
    }, 10);

    // re-trigger hooks
    setFetchToggle(true);
    setTimeout(() => setFetchToggle(false), 10);

    // mark that a real search was made
    setSearched(true);
  };

  // Empty-state blurbs driven by `searched`
  const ARAcountBlurb =
    searched && (ARAcount || 0) === 0
      ? "No bags were logged this week"
      : "Bags logged more than 3 days after production";

  const JNRcountBlurb =
    searched && (JNRcount || 0) === 0
      ? "No bags were logged this week"
      : "Bags logged more than 3 days after production";

  const JNRCountPlaceholder = searched && JNRcount === 0 && ARAPercent === "" ? "" : JNRcount;
  const ARACountPlaceholder = searched && ARAcount === 0 && JNRPercent === ""? "" : ARAcount;

  const ARAPercentBlurb =
    searched && (araCounts?.bagging || 0) === 0
      ? "No bags were logged this week"
      : "of bags were late";

  const JNRPercentBlurb =
    searched && (jnrCounts?.bagging || 0) === 0
      ? "No bags were logged this week"
      : "of bags were late";

  const ARAPercentUnit =
    searched && (araCounts?.bagging || 0) === 0
      ? ""
      : "%";

  const JNRPercentUnit =
    searched && (jnrCounts?.bagging || 0) === 0
      ? ""
      : "%";

  const scheduledBlurb =
    searched && (sheduledBags || 0) === 0
      ? "No bags were scheduled for shipping this week"
      : "Bags scheduled for shipping were picked up";
  
  const scheduledPlaceholder = searched && sheduledBags === 0 ? "" : sheduledBags;

  const scheduledUnit =
    searched && (sheduledBags || 0) === 0
      ? ""
      : "%";

  const sameDayUnit =
    searched && (pickupTotal || 0) === 0
      ? ""
      : "%";

  const sameDayBlurb =
    searched && (pickupTotal || 0) === 0
      ? "No bags were picked up this week"
      : "Picked-up bags were delivered on the same day";
  
  const sameDayPlaceholder = searched && pickupTotal === 0 ? "" : pickupTotal;

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
              onToggle={() => {
                if (!isWeek) {
                  window.location.reload();
                } else {
                  setIsWeek(false);
                }
              }}
              onChange={(type, value) => {
                if (type === "week") setWeek(value);
                if (type === "from") setFromDate(value);
                if (type === "to") setToDate(value);
              }}
              onFetch={handleFetch}
            />
          </div>

          <div className={styles.contentGrid}>
            <Module name="Ahlstrom Bagging Performance" spanColumn={12} spanRow={1}>
              <Figure2 title="ARA" value={ARACountPlaceholder} unit="" blurb={ARAcountBlurb} />
            </Module>

            <Module name="Ahlstrom Bags" spanColumn={6} spanRow={3}>
              <PieChart data={ARAData} labels={labels} />
              <Figure2 title="ARA" value={ARAPercent} unit={ARAPercentUnit} blurb={ARAPercentBlurb} />
            </Module>

            <Module name="Jenkinson Bags" spanColumn={6} spanRow={3}>
              <PieChart data={JNRData} labels={labels} />
              <Figure2 title="ARA" value={JNRPercent} unit={JNRPercentUnit} blurb={JNRPercentBlurb} />
            </Module>

            <Module name="Jenkinson Bagging Performance" spanColumn={12} spanRow={1}>
              <Figure2 title="ARA" value={JNRCountPlaceholder} unit="" blurb={JNRcountBlurb} />
            </Module>

            <Module name="Scheduled Delivery Performance" spanColumn={12}>
              <Figure2 title="ARA" value={scheduledPlaceholder} unit={scheduledUnit} blurb={scheduledBlurb} />
            </Module>

            <Module name="Shipping Performance" spanColumn={12}>
              <Figure2 title="ARA" value={sameDayPlaceholder} unit={sameDayUnit} blurb={sameDayBlurb} />
            </Module>

            <Module name="Applied Bags" spanColumn={12}>
              <Figure2 title="ARA" value={appliedBags || 0} unit="" blurb="Bags applied" />
            </Module>

            <Module name="Form Users" spanColumn={12}>
              <Figure2 title="ARA" value={appUsers || 0} unit="" blurb="Farmers submitted an 'applied' form" />
            </Module>

            <Module name="Total Success" spanColumn={12}>
              <Figure2 title="All" value={TotalSuccessPercent} unit="%" blurb="of Charcodes were Successful" />
            </Module>
          </div>
        </div>
      </ModuleMain>
    </div>
  );
};

export default CharcodeSummaryView;
