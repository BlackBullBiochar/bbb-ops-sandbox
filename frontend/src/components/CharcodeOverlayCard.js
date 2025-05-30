import { useContext } from 'react';
import { DataAnalysisContext } from './DataAnalysisContext';
import Figure from './Figure';
import styles from './CharcodeOverlayCard.module.css';
import ChartMod from './ChartMod';
import Module from './Module';
import FaultMessages from './FaultMessages';
import EbcStatusEditor from './EbcStatusEditorARA';
import EbcStatusList from './EBCStatusList';

const CharcodeOverlayCard = ({ parsed, onClose }) => {
  const bagDate = String((parsed.bagging_date).split('T')[0]|| parsed.Produced || '');
  const producedDate = bagDate
  const site = (parsed.site || '').toLowerCase(); // Note: `_site` handled outside
  const isARA = site === 'ARA';

  const {
    chart1LabelsARA, chart2LabelsARA,
    chart1DataARA, chart2DataARA,
    dataTempsARA, dataTempsARA2, 
    dataBioMCARA, faultMessagesARA,
    ebcLookupARA
  } = useContext(DataAnalysisContext);

  const labels1 = chart1LabelsARA;
  const labels2 = chart2LabelsARA;
  const data1 = chart1DataARA;
  const data2 = chart2DataARA;
  const dataTemps = Array.isArray(dataTempsARA) ? dataTempsARA[0] : dataTempsARA;
  const dataTemps2 = Array.isArray(dataTempsARA2) ? dataTempsARA2[0] : dataTempsARA2;
  const dataBioMC = Array.isArray(dataBioMCARA) ? dataBioMCARA[0] : dataBioMCARA;
  const faultMessages = faultMessagesARA;

  const charcodeId = String(parsed.charcode || '').trim();
  const ebcEntries = ebcLookupARA[charcodeId] || [];

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard}>
        <div className={styles.contentGrid}>
          <button className={styles.closeBtn} onClick={onClose}>×</button>

           <Module name="Charcode Info" spanColumn={4} spanRow={3}>
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

          <Module name="Reactor 1 Avg. Temp" spanColumn={4} spanRow={1}>
            <Figure title="Reactor 1 Avg. Temp" value={dataTemps} />
          </Module>

          <Module name="EBC Cert. Status" spanColumn={16} spanRow={2}>
            <EbcStatusList ebcEntries={ebcEntries} />
          </Module>

          <Module name="Reactor 2 Avg. Temp" spanColumn={4} spanRow={1}>
            <Figure title="Reactor 2 Avg. Temp" value={dataTemps2} />
          </Module>

          <Module name="Biomass MC" spanColumn={4} spanRow={1}>
            <Figure value={dataBioMC} />
          </Module>

          <Module name="Fault Messages" spanColumn={16} spanRow={1}>
            <FaultMessages messages={faultMessages} />
          </Module>

          <Module name="Pyrolysis Temp" spanColumn={12} spanRow={3}>
            <ChartMod
              isTimeAxis
              title={`Reactor 1 Temp. on ${producedDate}`}
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

          <Module name="Pyrolysis Temp" spanColumn={12} spanRow={3}>
            <ChartMod
              isTimeAxis
              title={`Reactor 2 Temp. on ${producedDate}`}
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
