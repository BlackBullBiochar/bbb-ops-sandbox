import { useContext } from 'react';
import { DataAnalysisContext } from './DataAnalysisContext';
import Figure from './Figure';
import styles from './CharcodeOverlayCard.module.css';
import ChartMod from './ChartMod';
import Module from './Module';
import FaultMessages from './FaultMessages';
import EbcStatusEditor from './EbcStatusEditor';
import EbcStatusList from './EBCStatusList';

const CharcodeOverlayCardJNR = ({ parsed, onClose }) => {
  const producedDate = String(parsed.Produced);
  const site = (parsed.site || '').toLowerCase();
  const isARA = site === 'ara';

  const {
    // JNR site data
    chart1LabelsJNR, chart2LabelsJNR,
    chart1DataJNR, chart2DataJNR,
    dataTempsJNR, dataTempsJNR2, 
    charcodesJNR, formTempsJNR,
    dataBioMCJNR,dailyHeatGenJNR,
    faultMessagesJNR, ebcReasonsJNR,
    ebcStatusJNR,
  } = useContext(DataAnalysisContext);
  
  // Choose site-specific data
  const labels1 =  chart1LabelsJNR;
  const labels2 = chart2LabelsJNR;
  const data1 =  chart1DataJNR;
  const data2 = chart2DataJNR;
  const dataTemps = dataTempsJNR;
  const dataTemps2 = dataTempsJNR2;
  const faultMessages = faultMessagesJNR;
  const dataBioMC = dataBioMCJNR;

  console.log('📊 labels1 (first 5):', labels1?.slice(0, 5));
  console.log('📊 data1 (first 5):', data1?.slice(0, 5));
  console.log('ebcReasonsJNR:', ebcReasonsJNR);


  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard}>
        <div className={styles.contentGrid}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
            <Module name={"Charcode Info"} spanColumn={4} spanRow={2}>
                {Object.entries(parsed).map(([key, val], i) => (
                <div key={i} className={styles.row}>
                    <strong>{key}:</strong> {val}
                </div>
                ))}
            </Module>
            <Module name={"T5 Avg. Temp"} spanColumn={4} spanRow={1}>
                <Figure title="Reactor 1 Avg. Temp" value={dataTemps}/>
            </Module>
            <Module name={"EBC Cert. Reason"} spanColumn={16} spanRow={1}>
                <EbcStatusList entry1 = {ebcStatusJNR} entry2={ebcReasonsJNR} />  
            </Module>
            <Module name={"T5 Avg. Temp"} spanColumn={4} spanRow={1}>
                <Figure title="Reactor 1 Avg. Temp" value={dataTemps2}/>
            </Module>
            <Module name={"Biomass MC"} spanColumn={4} spanRow={1}>
                <Figure value={dataBioMC} unit = {""}/>
            </Module>
            <Module name={"Fault Messages"} spanColumn={12} spanRow={1}>
                <FaultMessages messages={faultMessages} />
            </Module>
            <Module name={"T5 Temp"} spanColumn={12} spanRow={3}>
                <ChartMod
                    isTimeAxis={true}
                    title={`T5 temp on ${producedDate}`}
                    labels={labels1.map(time => time.split(':').slice(0, 2).join(':')).reverse()}
                    dataPoints={labels1.map((time, i) => ({
                    x: new Date(`${producedDate} ${time}`),
                    y: Number(data1[i])
                    })).reverse()}
                    unit="°C"
                    extraLines={[
                    { label: 'Upper Bound', value: 780 },
                    { label: 'Lower Bound', value:  520}
                    ]}
                />
            </Module>
            <Module name={"T5 Temp"} spanColumn={12} spanRow={3}>
                <ChartMod
                    isTimeAxis={true}
                    title={`T5 temp on ${producedDate}`}
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
            <Module name={"EBC Status"} spanColumn={24} spanRow={2} marginBottom={'1rem'}>

            <EbcStatusEditor
            charcodeId={parsed.ID || parsed['Charcode ID']}
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
