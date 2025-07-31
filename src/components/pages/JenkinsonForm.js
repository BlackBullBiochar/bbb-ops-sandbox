import React from 'react';
import Form from '../Form';
import styles from './AhlstromForm.module.css';
import { useSubmitForm } from '../../hooks/useSubmitFormJNR';

const now = new Date();
const pad = (n) => n.toString().padStart(2, '0');
const todayWithTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;


const JenkinsonForm = () => {
  const { submitForm, loading, error } = useSubmitForm();
  const fields = [
    { name: 'C500HMR', label: 'C500-I Heat Meter Reading (kWh conversion - INCLUDE DECIMALS)', type: 'text', required: true },
    { name: 'RunningHoursTotal', label: 'Running Hours Total (Hrs)', type: 'text', required: true },
    { name: 'sysPressHealth', label: 'System Pressure Healthy?', type: 'radio', options: ['Yes', 'No'], required: true },
    { name: 'SBTHealth', label: 'SBT Healthy?', type: 'radio', options: ['Yes', 'No'], required: true },
    { name: 'SBTEntryHealth', label: 'SBT Entry Healthy?', type: 'radio', options: ['Yes', 'No'], required: true },
    { name: 'SBTDischargeHealth', label: 'SBT Discharge Healthy?', type: 'radio', options: ['Yes', 'No'], required: true },
    { name: 'plantOK', label: 'Plant OK?', type: 'radio', options: ['Yes', 'No'], required: true },
    { name: 'secondaryAirFlap', label: 'Secondary Air Flap Percentage (%)', type: 'text', required: true },
    { name: 'conveterPressure', label: 'Converter Pressure (mBar)', type: 'text', required: true },
    { name: 'starterBlower', label: 'Starter Blower Percentage (%)', type: 'text', required: true },
    { name: 't1Reading', label: 'T1 Reading (750 - 850°C)', type: 'text', required: true },
    { name: 't2Reading', label: 'T2 Reading (500 - 600°C)', type: 'text', required: true },
    { name: 't3Reading', label: 'T3 Reading (Above 585°C)', type: 'text', required: true },
    { name: 't4Reading', label: 'T4 Reading (Above 585°C)', type: 'text', required: true },
    { name: 't5Reading', label: 'T5 Reading (Above 585°C)', type: 'text', required: true },
    { name: 't6Reading', label: 'T6 Reading (Above 65°C)', type: 'text', required: true },
    { name: 't7Reading', label: 'T7 Reading (Max 90°C)', type: 'text', required: true },
    { name: 't8Reading', label: 'T8 Reading (80°C)', type: 'text', required: true },
    { name: 't9Reading', label: 'T9 Reading (°C)', type: 'text', required: true },
    { name: 't10Reading', label: 'T10 Reading (°C)', type: 'text', required: true },
    { name: 't11Reading', label: 'T11 Reading (°C)', type: 'text', required: true },
    { name: 't12Reading', label: 'T12 Reading (°C)', type: 'text', required: true },
    { name: 'mixingValve', label: 'Mixing Valve Percentage (%)', type: 'text', required: true },
    { name: 'vacuumFan', label: 'Vacuum Fan Percentage (%)', type: 'text', required: true },
    { name: 'lamda', label: 'Lamda Percentage (6-10%)', type: 'text', required: true },
    { name: 'entrySystemHealth', label: 'Entry System Healthy?', type: 'radio', options: ['Yes', 'No'], required: true },
    { name: 'converterSpeed', label: 'Converter Speed Percentage (%)', type: 'text', required: true },
    { name: 'biomassMC', label: 'Biomass Moisture Content (%)', type: 'text', required: true },
    { name: 'biomassDryerHeatMeter', label: 'EOW | Biomass Dryer Heat Meter (kWh)', type: 'text', required: true },
    { name: 'sportsHallHeatMeter', label: 'EOW | Sports Hall Heat Meter (kWh)', type: 'text', required: true },
    { name: 'grizedaleHeatMeter', label: 'EOW | Grizedale Heat Meter (kWh)', type: 'text', required: true },
    { name: 'Lam02', label: 'Lambda (O2) Level (<2%)', type: 'text', required: true },
    { name: 'operator', label: 'Completed By', type: 'text', required: true },
    ];

  const handleSubmit = async (formData) => {
    const response = await submitForm(formData);
    if (response) {
      alert('Form submitted!');
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Jenkinson Daily Form</h1>
      <Form fields={fields} onSubmit={handleSubmit} />
    </div>
  );
};

export default JenkinsonForm;
