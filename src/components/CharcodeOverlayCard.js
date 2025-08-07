import React, { useEffect, useState, useContext } from 'react';
import styles from './CharcodeOverlayCard.module.css';
import Module from './Module';
import Figure from './Figure';
import ChartMod from './ChartMod';
import FaultMessages2 from './FaultMessages2';
import EbcStatusList from './EBCStatusList';
import EbcStatusEditor from './EbcStatusEditorARA';
import { UserContext } from '../UserContext';
import { useFilters, useFilterDispatch, ACTIONS } from '../contexts/FilterContext';
import { useTempDataRows } from '../hooks/useTempDataRows';
import { useSingleTempChart } from '../hooks/useSingleTempChart';
import { useSiteNames } from '../hooks/useSiteNames';

const CharcodeOverlayCard = ({ parsed, onClose }) => {
  const dispatch = useFilterDispatch();
  const [ shouldFetch, setShouldFetch ] = useState(false);

  // Derive bagDate and site ID from parsed object
  const bagDate = parsed.bagging_date
    ? parsed.bagging_date.slice(0, 10)
    : '';
    console.log('Parsed bagging date:', bagDate);
  const siteId = parsed._site;
  const siteName =
    siteId === '6661c6cc2e943e2babeca581' ? 'ARA' :
    siteId === '6661c6bd2e943e2babec9b4d' ? 'JNR' :
    'Unknown Site';

  console.log('Resolved site name:', siteName);


  // Initialize EBC history from parsed data
  const [ebcHistory, setEbcHistory] = useState(parsed.ebcStatuses || []);
  useEffect(() => {
    setEbcHistory(parsed.ebcStatuses || []);
  }, [parsed.ebcStatuses]);

  // Configure FilterContext to fetch single-date data on mount
  useEffect(() => {
    if (!bagDate || !siteName) return;
    dispatch({ type: ACTIONS.SET_SITE, payload: siteName });
    dispatch({ type: ACTIONS.SET_MODE, payload: 'single' });
    dispatch({ type: ACTIONS.SET_SINGLE_DATE, payload: bagDate });
    dispatch({ type: ACTIONS.FETCH_DATA });
    setShouldFetch(true);
    setTimeout(() => {setShouldFetch(false);}, 10);
  }, [bagDate, siteId, dispatch]);

  // Fetch temperature rows and chart data
// inside your component…
const tempRows = useTempDataRows(siteName, shouldFetch);

// always call these hooks
const araR1 = useSingleTempChart(tempRows, 'r1_temp');
const araR2 = useSingleTempChart(tempRows, 'r2_temp');
const jnrT5 = useSingleTempChart(tempRows, 't5_temp');

// then pick your labels/data based on siteName
let r1Labels, r1Data, r2Labels, r2Data;

if (siteName === 'ARA') {
  ({ labels: r1Labels, data: r1Data } = araR1);
  ({ labels: r2Labels, data: r2Data } = araR2);
} else if (siteName === 'JNR') {
  ({ labels: r1Labels, data: r1Data } = jnrT5);
  ({ labels: r2Labels, data: r2Data } = jnrT5);
} else {
  console.warn('Unknown site for temperature data:', siteName);
  r1Labels = r1Data = r2Labels = r2Data = [];
}


  // Compute average temperatures
  const average = arr => arr.length ? arr.reduce((sum, x) => sum + x, 0) / arr.length : null;
  const avgR1 = average(r1Data.filter(v => v != null));
  const avgR2 = average(r2Data.filter(v => v != null));

  // Fault messages from parsed or empty
  const faults = parsed.faultMessages || [];

  // Handler for deleting an EBC status entry
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
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        <div className={styles.contentGrid}>

          {/* Charcode Info */}
          <Module name="Charcode Info" spanColumn={4} spanRow={2}>
            {[
              { label: 'Charcode', value: parsed.charcode },
              { label: 'Status', value: parsed.status },
              { label: 'Site ID', value: siteName },
              { label: 'Bagging Date', value: bagDate },
              { label: 'Feedstock', value: 'will code this in' },
              { label: 'Weight (kg)', value: parsed.weight },
              { label: 'Batch ID', value: parsed.batch_id }
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
              charcodeId={parsed.charcode}
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
              bagId={parsed._id}                    // Mongoose _id of the Bag
              siteId={parsed._site}                 // Mongoose _site ObjectId
              charcode={parsed.charcode}
              baggingDate={parsed.bagging_date.slice(0,10)}
              currentStatus={parsed.ebcCertStatus}
              currentReason={parsed.ebcStatusReason}
              onSaved={(newStatus) => setEbcHistory(h => [newStatus, ...h])}
            />
          </Module>

        </div>
      </div>
    </div>
  );
};

export default CharcodeOverlayCard;
