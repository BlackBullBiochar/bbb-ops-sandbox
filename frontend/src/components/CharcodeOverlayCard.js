// CharcodeOverlayCard.jsx
import React, { useEffect, useState } from 'react';
import Figure from './Figure';
import styles from './CharcodeOverlayCard.module.css';
import ChartMod from './ChartMod';
import Module from './Module';
import FaultMessages from './FaultMessages';
import EbcStatusList from './EBCStatusList';
import EbcStatusEditor from './EbcStatusEditorARA';

const CharcodeOverlayCard = ({ parsed, onClose }) => {
  // 1) Normalize bagDate (YYYY-MM-DD)
  const rawBagDate = parsed.bagging_date || parsed.Produced || '';
  const bagDate = String(rawBagDate.split('T')[0] || '');
  const producedDate = bagDate;
  const charcodeId = String(parsed.charcode || '').trim();
  const site = (parsed.site || '').toUpperCase(); // "ARA" or "JNR"

  // 2) Local state for “just this bag’s” data
  const [temps1, setTemps1] = useState([]);   // reactor 1 temps for this date
  const [temps2, setTemps2] = useState([]);   // reactor 2 temps for this date
  const [faults, setFaults] = useState([]);   // fault messages for this date
  const [ebcHistory, setEbcHistory] = useState([]); // full EBC history for this charcode

  useEffect(() => {
    if (!bagDate) return;

    /** 
     * 3) Fetch raw data once and filter to “inWindow = date === bagDate” 
     *    (similar logic to your Context, but we never call Context setters)
     **/
    const fetchRaw = async () => {
      try {
        // a) Temp Data
        const dataRes = await fetch('http://localhost:5000/api/tempData');
        const dataJson = await dataRes.json();
        const dataDocs = dataJson.uploads || dataJson.data || dataJson;
        const allTempRows = dataDocs.flatMap(doc => doc.data || []);

        // Filter to rows whose datePart === bagDate
        const raw1 = [], raw2 = [];
        allTempRows.forEach(row => {
          const [datePart, timePart] = String(row.timestamp || '').split(' ');
          if (datePart !== bagDate) return;

          const t1 = parseFloat(row['Reactor 1 Temperature (°C)']);
          const t2 = parseFloat(row['Reactor 2 Temperature (°C)']);
          if (!isNaN(t1)) raw1.push({ time: timePart, temp: t1 });
          if (!isNaN(t2)) raw2.push({ time: timePart, temp: t2 });
        });

        // Sort by time ascending, then extract arrays
        raw1.sort((a, b) => a.time.localeCompare(b.time));
        raw2.sort((a, b) => a.time.localeCompare(b.time));
        setTemps1(raw1); 
        setTemps2(raw2);

        // b) Forms (to get fault messages for this date+site)
        const formRes = await fetch('http://localhost:5000/api/forms');
        const formJson = await formRes.json();
        const formDocs = formJson.data || formJson.forms || formJson;
        const thisDayFaults = [];
        formDocs.forEach(doc => {
          doc.data?.forEach(row => {
            // Assuming row.Date is "YYYY-DD-MM" or "YYYY-MM-DD" — normalize to YYYY-MM-DD
            const [year, dayOrMonth, maybeMonth] = String(row.Date || '').split('-');
            // If your date format is "YYYY-DD-MM", swap. Adjust as needed.
            // Here I assume row.Date is "YYYY-DD-MM" so month=maybeMonth, day=dayOrMonth:
            const iso = `${year}-${maybeMonth.padStart(2,'0')}-${dayOrMonth.padStart(2,'0')}`;
            if (iso !== bagDate) return;

            // Pull heat or fault message depending on site
            if (site === 'ARA') {
              const msg = row['P500 Fault Message(s)'];
              if (msg && !['','0','N/A','None'].includes(msg.trim())) {
                thisDayFaults.push({ date: row.Date, message: msg });
              }
            }
            if (site === 'JNR') {
              const msg = row['C500-I Fault Messages'];
              if (
                msg &&
                !['', '0', 'N/A', 'None', 'clear', 'CLEAR', 'n/a'].includes(msg.trim())
              ) {
                thisDayFaults.push({ date: row.Date, message: msg });
              }
            }
          });
        });
        setFaults(thisDayFaults);

        // c) EBC Status
        const ebcRes = await fetch('http://localhost:5000/api/ebcstatus');
        const ebcJson = await ebcRes.json();
        const ebcDocs = ebcJson.sites;
        const siteDoc = ebcDocs.find((d) => d.site.toLowerCase() === site.toLowerCase());
        if (siteDoc) {
          // Filter history rows where charcodeId matches, then sort by time
          const historyRows = siteDoc.data
            .filter((row) => String(row.charcodeId || '').trim() === charcodeId)
            .map((row) => ({
              date: row['EBC Date'],
              time: row['EBC Time'],
              status: row['EBC Cert Status'],
              reason: row['EBC Status Reason']
            }));
          historyRows.sort((a, b) => {
            // sort by date, then time (lexicographically is fine if format is HH:MM)
            if (a.date < b.date) return -1;
            if (a.date > b.date) return 1;
            return a.time.localeCompare(b.time);
          });
          setEbcHistory(historyRows);
        } else {
          setEbcHistory([]);
        }
      } catch (err) {
        console.error('Overlay fetch error:', err);
      }
    };

    fetchRaw();
  }, [bagDate, site, charcodeId]);

  // 4) Now consume local state (`temps1`, `temps2`, `faults`, `ebcHistory`) for rendering:
  //    • ChartMod for Reactor 1 uses temps1
  //    • ChartMod for Reactor 2 uses temps2
  //    • FaultMessages uses faults
  //    • EbcStatusList uses ebcHistory

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

          <Module name="Reactor 1 Avg. Temp" spanColumn={4} spanRow={1}>
            <Figure
              title="Reactor 1 Avg. Temp"
              value={
                temps1.length
                  ? temps1.reduce((sum, r) => sum + r.temp, 0) / temps1.length
                  : null
              }
            />
          </Module>

          <Module name="EBC Cert. Status" spanColumn={16} spanRow={2}>
            <EbcStatusList ebcEntries={ebcHistory} />
          </Module>

          <Module name="Reactor 2 Avg. Temp" spanColumn={4} spanRow={1}>
            <Figure
              title="Reactor 2 Avg. Temp"
              value={
                temps2.length
                  ? temps2.reduce((sum, r) => sum + r.temp, 0) / temps2.length
                  : null
              }
            />
          </Module>

          <Module name="Fault Messages" spanColumn={20} spanRow={1}>
            <FaultMessages messages={faults} />
          </Module>

          <Module name="Pyrolysis Temp" spanColumn={12} spanRow={3}>
            <ChartMod
              isTimeAxis
              title={`Reactor 1 Temp. on ${producedDate}`}
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

          <Module name="Pyrolysis Temp" spanColumn={12} spanRow={3}>
            <ChartMod
              isTimeAxis
              title={`Reactor 2 Temp. on ${producedDate}`}
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

export default CharcodeOverlayCard;
