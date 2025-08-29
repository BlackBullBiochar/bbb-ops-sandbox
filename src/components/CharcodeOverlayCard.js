"use client";

import React, { useEffect, useState } from "react";
import styles from './CharcodeOverlayCard.module.css';
import Module from './Module';
import Figure from './Figure';
import ChartMod from './ChartMod';
import FaultMessages2 from './FaultMessages2';
import EbcStatusList from './EBCStatusList';
import EbcStatusEditor from './EBCStatusEditorARA';
import { useFilterDispatch, ACTIONS } from '../contexts/FilterContext';
import { useTempDataRows } from '../hooks/useTempDataRows';
import { useSingleTempChart } from '../hooks/useSingleTempChart';

// ---------- LOGGING HELPERS ----------
const NS = "CharcodeOverlay";
const log = (...args) => console.log(`[%c${NS}%c]`, "color:#34B61F;font-weight:bold", "color:inherit", ...args);
const warn = (...args) => console.warn(`[%c${NS}%c]`, "color:#B0E000;font-weight:bold", "color:inherit", ...args);
const err = (...args) => console.error(`[%c${NS}%c]`, "color:#ff5555;font-weight:bold", "color:inherit", ...args);

const CharcodeOverlayCard = ({ parsed, onClose }) => {
  const dispatch = useFilterDispatch();
  const [shouldFetch, setShouldFetch] = useState(false);

  log("mount props:", parsed);

  // --- Basics
  const bagDate = parsed?.bagging_date ? parsed.bagging_date.slice(0, 10) : "";
  const explicitCode = (parsed?._siteCode || parsed?.siteCode || parsed?.site)?.toString().toUpperCase();

  // Known ObjectIds
  const ARA_ID = "6661c6cc2e943e2babeca581";
  const JNR_ID = "6661c6bd2e943e2babec9b4d";

  let siteName = "Unknown Site";
  if (explicitCode === "ARA" || explicitCode === "JNR") siteName = explicitCode;
  else if (parsed?._site === ARA_ID) siteName = "ARA";
  else if (parsed?._site === JNR_ID) siteName = "JNR";

  const siteObjectId =
    siteName === "ARA" ? ARA_ID :
    siteName === "JNR" ? JNR_ID :
    parsed?._site || null;

  log("derived:", { bagDate, siteName, siteObjectId, explicitCode });

  // --- EBC history
  const [ebcHistory, setEbcHistory] = useState(parsed?.ebcStatuses || []);
  useEffect(() => {
    log("ebcHistory set from props:", parsed?.ebcStatuses?.length || 0);
    setEbcHistory(parsed?.ebcStatuses || []);
  }, [parsed?.ebcStatuses]);

  // --- Kick the FilterContext fetch for the chosen site/date
  useEffect(() => {
    const validSite = siteName === "ARA" || siteName === "JNR";
    log("kick fetch?", { bagDate, siteName, validSite });
    if (!bagDate || !validSite) return;

    dispatch({ type: ACTIONS.SET_SITE, payload: siteName });
    dispatch({ type: ACTIONS.SET_MODE, payload: 'single' });
    dispatch({ type: ACTIONS.SET_SINGLE_DATE, payload: bagDate });
    dispatch({ type: ACTIONS.FETCH_DATA });

    setShouldFetch(true);
    const t = setTimeout(() => setShouldFetch(false), 10);
    return () => clearTimeout(t);
  }, [bagDate, siteName, dispatch]);

  // --- Temp data + charts
  const tempRows = useTempDataRows(siteName, shouldFetch);
  useEffect(() => { log("tempRows length:", tempRows?.length ?? 0); }, [tempRows]);

  const araR1 = useSingleTempChart(tempRows, 'r1_temp');
  const araR2 = useSingleTempChart(tempRows, 'r2_temp');
  const jnrT5 = useSingleTempChart(tempRows, 't5_temp');

  let r1Labels = [], r1Data = [], r2Labels = [], r2Data = [];
  if (siteName === 'ARA') {
    ({ labels: r1Labels, data: r1Data } = araR1);
    ({ labels: r2Labels, data: r2Data } = araR2);
  } else if (siteName === 'JNR') {
    ({ labels: r1Labels, data: r1Data } = jnrT5);
    ({ labels: r2Labels, data: r2Data } = jnrT5);
  }
  useEffect(() => {
    log("chart series sizes:", {
      r1Labels: r1Labels.length, r1Data: r1Data.length,
      r2Labels: r2Labels.length, r2Data: r2Data.length
    });
  }, [r1Labels, r1Data, r2Labels, r2Data]);

  // --- Stats
  const average = (arr) => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;
  const avgR1 = average(r1Data.filter(v => v != null));
  const avgR2 = average(r2Data.filter(v => v != null));
  useEffect(() => { log("averages:", { avgR1, avgR2 }); }, [avgR1, avgR2]);

  const handleEntryDeleted = (delDate, delTime) => {
    log("delete EBC entry:", delDate, delTime);
    setEbcHistory(current =>
      current.filter(e =>
        !(e.created_date.startsWith(delDate) && e.time === delTime)
      )
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard}>
        <button className={styles.closeBtn} onClick={() => { log("close click"); onClose(); }}>×</button>
        <div className={styles.contentGrid}>

          {/* Charcode Info */}
          <Module name="Charcode Info" spanColumn={4} spanRow={2}>
            {[
              { label: 'Charcode', value: parsed?.charcode },
              { label: 'Status', value: parsed?.status },
              { label: 'Site', value: siteName },
              { label: 'Bagging Date', value: bagDate },
              { label: 'Feedstock', value: 'will code this in' },
              { label: 'Weight (kg)', value: parsed?.weight },
              { label: 'Batch ID', value: parsed?.batch_id }
            ].map((field, idx) => (
              <div key={idx} className={styles.row}>
                <strong>{field.label}:</strong> {field.value || '—'}
              </div>
            ))}
          </Module>

          {/* Average Temperatures */}
          <Module name="Reactor 1 Avg Temp" spanColumn={4} spanRow={1}>
            <Figure title="R1 Avg Temp" value={avgR1} unit="°C" />
          </Module>

          {/* Fault Messages */}
          <Module name="Fault Messages" spanColumn={4} spanRow={2}>
            <FaultMessages2 messages={['example messages', 'plant was not producing biochar between 12:00 and 4:00']} />
          </Module>

          {/* EBC Status History */}
          <Module name="EBC Cert History" spanColumn={12} spanRow={2}>
            <EbcStatusList
              charcodeId={parsed?.charcode}
              ebcEntries={ebcHistory}
              onDeleted={handleEntryDeleted}
            />
          </Module>

          <Module name="Reactor 2 Avg Temp" spanColumn={4} spanRow={1}>
            <Figure title="R2 Avg Temp" value={avgR2} unit="°C" />
          </Module>

          {/* Time-series Charts */}
          <Module name="Reactor 1 Temp" spanColumn={12} spanRow={4}>
            <ChartMod
              isTimeAxis={true}
              title="R1 Temps Over Time"
              labels={r1Labels}
              dataPoints={r1Labels.map((t, i) => ({
                x: new Date(`${bagDate}T${t}`),
                y: r1Data[i]
              }))}
              unit="°C"
              extraLines={[{ label: 'High', value: 780 }, { label: 'Low', value: 520 }]}
            />
          </Module>
          <Module name="Reactor 2 Temp" spanColumn={12} spanRow={4}>
            <ChartMod
              isTimeAxis={true}
              title="R2 Temps Over Time"
              labels={r2Labels}
              dataPoints={r2Labels.map((t, i) => ({
                x: new Date(`${bagDate}T${t}`),
                y: r2Data[i]
              }))}
              unit="°C"
              extraLines={[{ label: 'High', value: 780 }, { label: 'Low', value: 520 }]}
            />
          </Module>

          {/* EBC Status Editor */}
          <Module name="Update EBC Status" spanColumn={24} spanRow={3}>
            <EbcStatusEditor
              bagId={parsed?._id}
              siteId={siteObjectId}
              charcode={parsed?.charcode}
              baggingDate={bagDate}
              currentStatus={parsed?.ebcCertStatus}
              currentReason={parsed?.ebcStatusReason}
              onSaved={(newStatus) => {
                log("EBC onSaved:", newStatus);
                setEbcHistory(h => [newStatus, ...h]);
              }}
            />
          </Module>

        </div>
      </div>
    </div>
  );
};

export default CharcodeOverlayCard;
