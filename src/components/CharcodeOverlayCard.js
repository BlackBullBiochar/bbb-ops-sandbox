// CharcodeOverlayCard.jsx
import React, { useEffect, useState, useContext } from 'react';
import Figure from './Figure';
import styles from './CharcodeOverlayCard.module.css';
import ChartMod from './ChartMod';
import Module from './Module';
import FaultMessages from './FaultMessages';
import EbcStatusList from './EBCStatusList';
import EbcStatusEditor from './EbcStatusEditorARA';
import { UserContext } from '../UserContext.js';

// Import the ARA helper
import { fetchAraOverlayData } from './DataAnalysisLocal';

const CharcodeOverlayCard = ({ parsed, onClose }) => {
  const { user } = useContext(UserContext);
  // 1) Normalize bagDate (YYYY-MM-DD) and charcodeId
  const rawBagDate = parsed.bagging_date || parsed.Produced || '';
  const bagDate = String(rawBagDate.split('T')[0] || '');
  const producedDate = bagDate;
  const charcodeId = String(parsed.charcode || '').trim();

  // 2) Local state: only for this overlay’s data
  const [temps1, setTemps1] = useState([]);
  const [temps2, setTemps2] = useState([]);
  const [faults, setFaults] = useState([]);
  const [ebcHistory, setEbcHistory] = useState([]);

   useEffect(() => {
    // don’t run until we have bagDate, charcodeId, and user
    if (!bagDate || !charcodeId || !user) return;

    // pass `user` as first argument
    fetchAraOverlayData(user, bagDate, charcodeId)
      .then(({ temps1, temps2, faults, ebcHistory }) => {
        setTemps1(temps1);
        setTemps2(temps2);
        setFaults(faults);
        setEbcHistory(ebcHistory);
      })
      .catch((err) => {
        console.error('CharcodeOverlayCard (ARA) fetch error:', err);
      });
  }, [bagDate, charcodeId, user]);

  const handleEntryDeleted = (deletedDate, deletedTime) => {
  setEbcHistory(entries =>
    entries.filter(e => !(e.date === deletedDate && e.time === deletedTime))
  );
};

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
            <EbcStatusList 
              charcodeId={charcodeId}
              ebcEntries={ebcHistory}
              onDeleted={handleEntryDeleted} 
            />
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
