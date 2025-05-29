import { useContext } from 'react';
import { DataAnalysisContext } from './DataAnalysisContext';
import Figure from './Figure';
import styles from './CharcodeOverlayCard.module.css';
import ChartMod from './ChartMod';
import Module from './Module';
import FaultMessages from './FaultMessages';
import EbcStatusEditor from './EbcStatusEditorJNR';
import EbcStatusList from './EBCStatusList';

const CharcodeOverlayCardJNR = ({ parsed, onClose }) => {
  const bagDate = String((parsed.bagging_date).split('T')[0]|| parsed.Produced || '');
  const producedDate = bagDate
  const charcodeId = String(parsed.charcode || parsed.ID || '').trim();

  const {
    chart1LabelsJNR, chart2LabelsJNR,
    chart1DataJNR, chart2DataJNR,
    dataTempsJNR, dataTempsJNR2,
    dataBioMCJNR, faultMessagesJNR,
    ebcLookupJNR
  } = useContext(DataAnalysisContext);

  const labels1 = chart1LabelsJNR;
  const labels2 = chart2LabelsJNR;
  const data1 = chart1DataJNR;
  const data2 = chart2DataJNR;
  const dataTemps = Array.isArray(dataTempsJNR) ? dataTempsJNR[0] : dataTempsJNR;
  const dataTemps2 = Array.isArray(dataTempsJNR2) ? dataTempsJNR2[0] : dataTempsJNR2;
  const dataBioMC = Array.isArray(dataBioMCJNR) ? dataBioMCJNR[0] : dataBioMCJNR;
  const faultMessages = faultMessagesJNR;
  const ebcEntries = ebcLookupJNR[charcodeId] || [];

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard}>
        <div className={styles.contentGrid}>
          <button className={styles.closeBtn} onClick={onClose}>×</button>


           <Module name="Charcode Info" spanColumn={4} spanRow={2}>
            {[
                { label: 'Charcode', value: parsed.charcode},
                {label: 'status', value: parsed.status},
                {label: 'site', value: parsed.site},
                {label: 'Bagging Date', value: parsed.bagging_date
                    ? new Date(parsed.bagging_date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })
                    : '—',},
                { label: 'Operator', value: parsed.operator },
                { label: 'Feedstock Source', value: parsed.feedstock_source },
                { label: 'Biomass Type', value: parsed.biomass_type },
                { label: 'Biochar Weight (kg)', value: parsed.weight },
                { label: 'Batch ID', value: parsed.batch_id },
            ].map(({ label, value }, i) => (
                <div key={i} className={styles.row}>
                <strong>{label}:</strong>{' '}
                {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value || '—')}
                </div>
            ))}
          </Module>

          <Module name="T5 Avg. Temp" spanColumn={4} spanRow={1}>
            <Figure title="T5 Avg. Temp 1" value={dataTemps} />
          </Module>

          <Module name="EBC Cert. Reason" spanColumn={16} spanRow={1}>
            <EbcStatusList ebcEntries={ebcEntries} />
          </Module>

          <Module name="T5 Avg. Temp" spanColumn={4} spanRow={1}>
            <Figure title="T5 Avg. Temp 2" value={dataTemps2} />
          </Module>

          <Module name="Biomass MC" spanColumn={4} spanRow={1}>
            <Figure value={dataBioMC} />
          </Module>

          <Module name="Fault Messages" spanColumn={12} spanRow={1}>
            <FaultMessages messages={faultMessages} />
          </Module>

          <Module name="T5 Temp" spanColumn={12} spanRow={3}>
            <ChartMod
              isTimeAxis
              title={`T5 Temp on ${producedDate}`}
              labels={labels1.map(time => time.split(':').slice(0, 2).join(':')).reverse()}
              dataPoints={labels1.map((time, i) => ({
                x: new Date(`1970-01-01T${time}`),
                y: Number(data1[i])
              })).reverse()}
              unit="°C"
              extraLines={[
                { label: 'Upper Bound', value: 780 },
                { label: 'Lower Bound', value: 520 }
              ]}
            />
          </Module>

          <Module name="T5 Temp" spanColumn={12} spanRow={3}>
            <ChartMod
              isTimeAxis
              title={`T5 Temp on ${producedDate}`}
              labels={labels2.map(time => time.split(':').slice(0, 2).join(':')).reverse()}
              dataPoints={labels2.map((time, i) => ({
                x: new Date(`1970-01-01T${time}`),
                y: Number(data2[i])
              })).reverse()}
              unit="°C"
              extraLines={[
                { label: 'Upper Bound', value: 780 },
                { label: 'Lower Bound', value: 520 }
              ]}
            />
          </Module>

          <Module name="EBC Status" spanColumn={24} spanRow={2} marginBottom="1rem">
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
