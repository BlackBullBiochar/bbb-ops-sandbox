// CharcodeOverlayCardJNR.jsx
import React, { useEffect, useState } from 'react';
import Figure from './Figure';
import styles from './CharcodeOverlayCard.module.css';
import ChartMod from './ChartMod';
import Module from './Module';
import FaultMessages from './FaultMessages';
import EbcStatusList from './EBCStatusList';
import EbcStatusEditor from './EbcStatusEditorJNR';

const CharcodeOverlayCardJNR = ({ parsed, onClose }) => {
  // 1) Normalize bagDate to "YYYY-MM-DD"
  const rawBagDate = parsed.bagging_date || parsed.Produced || '';
  const bagDate = String(rawBagDate.split('T')[0] || '');
  const producedDate = bagDate;

  // 2) Normalize charcodeId
  const charcodeId = String(parsed.charcode || parsed.ID || '').trim();
  const siteCode = 'JNR'; // because this is the JNR overlay

  // 3) Local state for JNR-only data
  const [temps1, setTemps1] = useState([]);       // “T5” temp series #1
  const [temps2, setTemps2] = useState([]);       // “T5” temp series #2 (often the same as temps1)
  const [faults, setFaults] = useState([]);       // JNR fault messages
  const [ebcHistory, setEbcHistory] = useState([]); // Full EBC history for this charcode

  useEffect(() => {
    if (!bagDate) return;

    const fetchLocalData = async () => {
      try {
        // --- a) Fetch & filter tempData for bagDate ---
        const dataRes = await fetch('http://localhost:5000/api/tempData');
        const dataJson = await dataRes.json();
        const dataDocs = dataJson.uploads || dataJson.data || dataJson;
        const allTempRows = dataDocs.flatMap(doc => doc.data || []);

        const rawTemps1 = [];
        const rawTemps2 = [];
        allTempRows.forEach(row => {
          const [datePart, timePart] = String(row.timestamp || '').split(' ');
          if (datePart !== bagDate) return;

          // JNR uses “T5 Pyrolysis Temperature (°C)” for both temp channels:
          const t5 = parseFloat(row['T5 Pyrolysis Temperature (°C)']);
          if (!isNaN(t5)) {
            rawTemps1.push({ time: timePart, temp: t5 });
            rawTemps2.push({ time: timePart, temp: t5 });
          }
        });

        // Sort ascending by time (HH:MM) before setting
        rawTemps1.sort((a, b) => a.time.localeCompare(b.time));
        rawTemps2.sort((a, b) => a.time.localeCompare(b.time));

        setTemps1(rawTemps1);
        setTemps2(rawTemps2);

        // --- b) Fetch & filter forms for bagDate (JNR faults) ---
        const formRes = await fetch('http://localhost:5000/api/forms');
        const formJson = await formRes.json();
        const formDocs = formJson.data || formJson.forms || formJson;

        const thisDayFaults = [];
        formDocs.forEach(doc => {
          doc.data?.forEach(row => {
            // Assume row.Date is "YYYY-DD-MM" or "YYYY-MM-DD"; adjust accordingly.
            // Here we handle the “YYYY-DD-MM” format by swapping day & month:
            const [year, dayOrMonth, maybeMonth] = String(row.Date || '').split('-');
            const isoDate = `${year}-${maybeMonth.padStart(2,'0')}-${dayOrMonth.padStart(2,'0')}`;
            if (isoDate !== bagDate) return;

            // Pull JNR‐specific fault message field:
            const msg = row['C500-I Fault Messages'];
            if (
              msg &&
              !['', '0', 'N/A', 'None', 'clear', 'CLEAR', 'n/a'].includes(msg.trim())
            ) {
              thisDayFaults.push({ date: row.Date, message: msg });
            }
          });
        });
        setFaults(thisDayFaults);

        // --- c) Fetch & filter EBC status history for this charcode ---
        const ebcRes = await fetch('http://localhost:5000/api/ebcstatus');
        const ebcJson = await ebcRes.json();
        const ebcDocs = ebcJson.sites || [];

        const siteDoc = ebcDocs.find(
          d => d.site.toLowerCase() === siteCode.toLowerCase()
        );

        if (siteDoc) {
          // Filter to rows matching this charcodeId, sort by date/time:
          const historyRows = siteDoc.data
            .filter(row => String(row.charcodeId || '').trim() === charcodeId)
            .map(row => ({
              date: row['EBC Date'],
              time: row['EBC Time'],
              status: row['EBC Cert Status'],
              reason: row['EBC Status Reason'],
            }));
          historyRows.sort((a, b) => {
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            return a.time.localeCompare(b.time);
          });
          setEbcHistory(historyRows);
        } else {
          setEbcHistory([]);
        }
      } catch (err) {
        console.error('CharcodeOverlayCardJNR fetch error:', err);
      }
    };

    fetchLocalData();
  }, [bagDate, charcodeId]);

  // 4) Render using local state (temps1, temps2, faults, ebcHistory)
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard}>
        <div className={styles.contentGrid}>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>

          <Module name="Charcode Info" spanColumn={4} spanRow={3}>
            {[
              { label: 'Charcode', value: parsed.charcode },
              { label: 'Status', value: parsed.status },
              { label: 'Site', value: parsed.site },
              {
                label: 'Bagging Date',
                value: bagDate
                  ? new Date(bagDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—',
              },
              { label: 'Operator', value: parsed.operator },
              { label: 'Feedstock Source', value: parsed.feedstock_source },
              { label: 'Biomass Type', value: parsed.biomass_type },
              { label: 'Biochar Weight (kg)', value: parsed.weight },
              { label: 'Batch ID', value: parsed.batch_id },
            ].map(({ label, value }, i) => (
              <div key={i} className={styles.row}>
                <strong>{label}:</strong>{' '}
                {typeof value === 'object' && value !== null
                  ? JSON.stringify(value)
                  : String(value || '—')}
              </div>
            ))}
          </Module>

          <Module name="T5 Avg. Temp" spanColumn={4} spanRow={1}>
            <Figure
              title="T5 Avg. Temp 1"
              value={
                temps1.length
                  ? temps1.reduce((sum, r) => sum + r.temp, 0) / temps1.length
                  : null
              }
            />
          </Module>

          <Module name="EBC Cert. Reason" spanColumn={16} spanRow={2}>
            <EbcStatusList ebcEntries={ebcHistory} />
          </Module>

          <Module name="T5 Avg. Temp" spanColumn={4} spanRow={1}>
            <Figure
              title="T5 Avg. Temp 2"
              value={
                temps2.length
                  ? temps2.reduce((sum, r) => sum + r.temp, 0) / temps2.length
                  : null
              }
            />
          </Module>

          <Module name="Biomass MC" spanColumn={4} spanRow={1}>
            <Figure value={parsed.biomasstype || null} />
          </Module>

          <Module name="Fault Messages" spanColumn={16} spanRow={1}>
            <FaultMessages messages={faults} />
          </Module>

          <Module name="T5 Temp" spanColumn={12} spanRow={3}>
            <ChartMod
              isTimeAxis
              title={`T5 Temp on ${producedDate}`}
              labels={temps1.map((r) => r.time).reverse()}
              dataPoints={temps1
                .map((r) => ({
                  x: new Date(`1970-01-01T${r.time}`),
                  y: r.temp,
                }))
                .reverse()}
              unit="°C"
              extraLines={[
                { label: 'Upper Bound', value: 780 },
                { label: 'Lower Bound', value: 520 },
              ]}
            />
          </Module>

          <Module name="T5 Temp" spanColumn={12} spanRow={3}>
            <ChartMod
              isTimeAxis
              title={`T5 Temp on ${producedDate}`}
              labels={temps2.map((r) => r.time).reverse()}
              dataPoints={temps2
                .map((r) => ({
                  x: new Date(`1970-01-01T${r.time}`),
                  y: r.temp,
                }))
                .reverse()}
              unit="°C"
              extraLines={[
                { label: 'Upper Bound', value: 780 },
                { label: 'Lower Bound', value: 520 },
              ]}
            />
          </Module>

          <Module name="EBC Status" spanColumn={24} spanRow={3} marginBottom="1rem">
            <EbcStatusEditor
              charcodeId={charcodeId}
              currentStatus={parsed['EBC Cert Status']}
              currentReason={parsed['EBC Status Reason']}
            />
          </Module>
        </div>
      </div>
    </div>
  );
};

export default CharcodeOverlayCardJNR;
