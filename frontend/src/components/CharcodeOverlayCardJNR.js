// CharcodeOverlayCardJNR.jsx
import React, { useEffect, useState } from 'react';
import Figure from './Figure';
import styles from './CharcodeOverlayCard.module.css';
import ChartMod from './ChartMod';
import Module from './Module';
import FaultMessages from './FaultMessages';
import EbcStatusList from './EBCStatusList';
import EbcStatusEditor from './EbcStatusEditorJNR';

// Import the JNR helper
import { fetchJnrOverlayData } from './DataAnalysisLocal';

const CharcodeOverlayCardJNR = ({ parsed, onClose }) => {
  // 1) Normalize bagDate to "YYYY-MM-DD"
  const rawBagDate = parsed.bagging_date || parsed.Produced || '';
  const bagDate = String(rawBagDate.split('T')[0] || '');
  const producedDate = bagDate;

  // 2) Normalize charcodeId
  const charcodeId = String(parsed.charcode || parsed.ID || '').trim();

  // 3) Local state for JNR-only data
  const [temps1, setTemps1] = useState([]);
  const [temps2, setTemps2] = useState([]);
  const [faults, setFaults] = useState([]);
  const [ebcHistory, setEbcHistory] = useState([]);

  useEffect(() => {
    if (!bagDate) return;

    // Call the JNR helper
    fetchJnrOverlayData(bagDate, charcodeId)
      .then(({ temps1, temps2, faults, ebcHistory }) => {
        setTemps1(temps1);
        setTemps2(temps2);
        setFaults(faults);
        setEbcHistory(ebcHistory);
      })
      .catch((err) => {
        console.error('CharcodeOverlayCardJNR fetch error:', err);
      });
  }, [bagDate, charcodeId]);

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
