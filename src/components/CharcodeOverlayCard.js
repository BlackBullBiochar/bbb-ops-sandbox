"use client";

import React, { useEffect, useState } from "react";
import styles from './CharcodeOverlayCard.module.css';
import Module from './Module';
import Button from './Button.js';
import Figure from './Figure';
import ChartMod from './ChartMod';
import FaultMessagesContainer from './FaultMessagesContainer';
import EbcStatusList from './EBCStatusList';
import EbcStatusEditor from './EbcStatusEditorARA';
import { useFilterDispatch, ACTIONS } from '../contexts/FilterContext';
import { useTempDataRows } from '../hooks/useTempDataRows';
import { useSingleTempChart } from '../hooks/useSingleTempChart';

// ---------- LOGGING HELPERS ----------
const NS = "CharcodeOverlay";

const CharcodeOverlayCard = ({ parsed, onClose }) => {
  const dispatch = useFilterDispatch();
  const [shouldFetch, setShouldFetch] = useState(false);


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

  // --- EBC history
  const [ebcHistory, setEbcHistory] = useState(parsed?.ebcStatuses || []);
  useEffect(() => {
    setEbcHistory(parsed?.ebcStatuses || []);
  }, [parsed?.ebcStatuses]);

  // --- Kick the FilterContext fetch for the chosen site/date
  useEffect(() => {
    const validSite = siteName === "ARA" || siteName === "JNR";
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

  // --- Stats
  const average = (arr) => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;
  const avgR1 = average(r1Data.filter(v => v != null));
  const avgR2 = average(r2Data.filter(v => v != null));

  const handleEntryDeleted = (delDate, delTime) => {
    setEbcHistory(current =>
      current.filter(e =>
        !(e.created_date.startsWith(delDate) && e.time === delTime)
      )
    );
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard}>
        <Button
          name="×"
          onPress={() => {onClose(); }}
          color="Coal"
          size="small"
          customStyle={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
        />
        <div className={styles.contentGrid}>

          {/* Charcode Info */}
          <Module name="Charcode Info" spanColumn={4} spanRow={2}>
            {[
              { label: 'Charcode', value: parsed?.charcode },
              { label: 'Status', value: parsed?.status },
              { label: 'Site', value: siteName },
              { label: 'Bagging Date', value: bagDate },
              { label: 'Weight (kg)', value: parsed?.weight },
              { label: 'Batch ID', value: parsed?.batch_id }
            ].map((field, idx) => (
              <div key={idx} className={styles.row}>
                <strong>{field.label}:</strong> {field.value || '—'}
              </div>
            ))}
          </Module>

          {siteName === 'ARA' ? (
          <Module name="Reactor 1 Avg Temp" spanColumn={4} spanRow={1}>
            <Figure title="R1 Avg Temp" value={avgR1} unit="°C" />
          </Module>
          ):(
          <Module name="Reactor 1 Avg Temp" spanColumn={4} spanRow={2}>
            <Figure title="R1 Avg Temp" variant="2" value={avgR1} unit="°C" />
          </Module>
          )}

          {/* Fault Messages */}
          <Module name="Fault Messages" spanColumn={6} spanRow={2}>
            <FaultMessagesContainer  wrapperSize="full" siteCode={siteName} />
          </Module>

          {/* EBC Status History */}
          <Module name="EBC Cert History" spanColumn={10} spanRow={2}>
            <EbcStatusList
              charcodeId={parsed?.charcode}
              ebcEntries={ebcHistory}
              onDeleted={handleEntryDeleted}
              batchId={parsed?.batch_id}
            />
          </Module>
          {siteName === 'ARA' ? (
          <Module name="Reactor 2 Avg Temp" spanColumn={4} spanRow={1}>
            <Figure title="R2 Avg Temp" value={avgR2} unit="°C" />
          </Module>
          ) : null}

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
          {siteName === 'ARA' ? (
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
          ) : null}

          {/* EBC Status Editor */}
          {siteName === 'ARA' ? (
          <Module name="Update EBC Status" spanColumn={24} spanRow={3}>
            <EbcStatusEditor
              bagId={parsed?._id}
              siteId={siteObjectId}
              charcodeId={parsed?.charcode}
              baggingDate={bagDate}
              currentStatus={parsed?.ebcCertStatus}
              currentReason={parsed?.ebcStatusReason}
              onSaved={(newStatus) => {
                setEbcHistory(h => [newStatus, ...h]);
              }}
            />
          </Module>
          ) : (
         <Module name="Update EBC Status" spanColumn={12} spanRow={4}>
            <EbcStatusEditor
              bagId={parsed?._id}
              siteId={siteObjectId}
              charcodeId={parsed?.charcode}
              baggingDate={bagDate}
              currentStatus={parsed?.ebcCertStatus}
              currentReason={parsed?.ebcStatusReason}
              onSaved={(newStatus) => {
                setEbcHistory(h => [newStatus, ...h]);
              }}
            />
          </Module>   
          )}

        </div>
      </div>
    </div>
  );
};

export default CharcodeOverlayCard;
