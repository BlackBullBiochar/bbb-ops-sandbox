import { useContext } from 'react';
import { DataAnalysisContext } from './DataAnalysisContext';
import Figure from './Figure';
import styles from './CharcodeOverlayCard.module.css';
import ChartMod from './ChartMod';
import Module from './Module';
import FaultMessages from './FaultMessages';
import EbcStatusEditor from './EbcStatusEditor';
import EbcStatusList from './EBCStatusList';

const CharcodeOverlayCard = ({ parsed, onClose }) => {
  const producedDate = String(parsed.Produced);
  const site = (parsed.site || '').toLowerCase();
  const isARA = site === 'ara';

  const {

    // ARA site data
    chart1LabelsARA, chart2LabelsARA,
    chart1DataARA, chart2DataARA,
    dataTempsARA, dataTempsARA2, 
    charcodesARA, formTempsARA,
    dataBioMCARA, dailyHeatGenARA,
    faultMessagesARA, ebcReasonsARA,
    ebcStatusARA
    
  } = useContext(DataAnalysisContext);

  // Choose site-specific data
  const labels1 = chart1LabelsARA;
  const labels2 = chart2LabelsARA;
  const data1 = chart1DataARA;
  const data2 = chart2DataARA;
  const dataTemps = dataTempsARA;
  const dataTemps2 = dataTempsARA2;
  const faultMessages = faultMessagesARA;
  const dataBioMC = dataBioMCARA;

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayCard}>
        <div className={styles.contentGrid}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
            <Module name={"Charcode Info"} spanColumn={4} spanRow={3}>
                {Object.entries(parsed).map(([key, val], i) => (
                <div key={i} className={styles.row}>
                    <strong>{key}:</strong> {val}
                </div>
                ))}
            </Module>
            <Module name={"Reactor 1 Avg. Temp"} spanColumn={4} spanRow={1}>
                <Figure title="Reactor 1 Avg. Temp" value={dataTemps}/>
            </Module>
            <Module name={"EBC Cert. Status"} spanColumn={16} spanRow={2}>
                <EbcStatusList entry1 = {ebcStatusARA} entry2={ebcReasonsARA} />     
            </Module>
            <Module name={"Reactor 2 Avg. Temp"} spanColumn={4} spanRow={1}>
                <Figure title="Reactor 1 Avg. Temp" value={dataTemps2}/>
            </Module>
            <Module name={"Biomass MC"} spanColumn={4} spanRow={1}>
                <Figure value={dataBioMC} unit = {""}/>
            </Module>
            <Module name={"Fault Messages"} spanColumn={16} spanRow={1}>
                <FaultMessages messages={faultMessages} />
            </Module>
            <Module name={"Pyrolysis Temp"} spanColumn={12} spanRow={3}>
                <ChartMod
                    isTimeAxis={true}
                    title={`Reactor 1 Temp. on ${producedDate}`}
                    labels={labels1.map(time => time.split(':').slice(0, 2).join(':')).reverse()}
                    dataPoints={labels1.map((time, i) => ({
                    x: new Date(`1970-01-01T${time}`),
                    y: Number(data1[i])
                    })).reverse()}
                    unit="°C"
                    extraLines={[
                    { label: 'Upper Bound', value: 780 },
                    { label: 'Lower Bound', value:  520}
                    ]}
                />
            </Module>
            <Module name={"Pyrolysis Temp"} spanColumn={12} spanRow={3}>
                <ChartMod
                    isTimeAxis={true}
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

export default CharcodeOverlayCard;
