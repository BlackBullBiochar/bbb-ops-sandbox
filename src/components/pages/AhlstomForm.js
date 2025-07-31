import React from 'react';
import Form from '../Form';
import styles from './AhlstromForm.module.css';
import { useSubmitForm } from '../../hooks/useSubmitForm';


const now = new Date();
const pad = (n) => n.toString().padStart(2, '0');
const todayWithTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;


const AhlstromForm = () => {
  const { submitForm, loading, error } = useSubmitForm();
  const fields = [
    { name: 'P500HMT', label: 'P500 Heat Meter Total (m³)', type: 'text', required: true },
    { name: 'P500HMFR', label: 'P500 Heat Meter Flow Rate (°C)', type: 'text', required: true },
    { name: 'P500HMST', label: 'P500 Heat Meter Supply Temp (°C)', type: 'text', required: true },
    { name: 'P500HMRT', label: 'P500 Heat Meter Return Temp (°C)', type: 'text', required: true },
    { name: 'p500Fault', label: 'P500 fault messages', type: 'radio+text', options: ['No'], required: true},
    { name: 'FeedL', label: 'Feeder Level (30-50%)', type: 'text' },
    { name: 'FS1PT', label: 'Feeding Screw 1 Pulse Time (0.1 - 9.9sec)', type: 'text', required: true },
    { name: 'FS2PT', label: 'Feeding Screw 2 Pulse Time (0.1 - 9.9sec)', type: 'text', required: true },
    { name: 'R1Temp', label: 'Reactor 1 Temperature (600 - 700°C)', type: 'text', required: true },
    { name: 'R1Press', label: 'Reactor 1 Pressure (40Pa)', type: 'text', required: true },
    { name: 'R1ExTemp', label: 'Reactor 1 Exhaust Temperature (Max 750°C)', type: 'text', required: true },
    { name: 'R2DPT', label: 'Reactor 2 Drive Pulse Time (0.1 - 5.9sec)', type: 'text', required: true },
    { name: 'R2Temp', label: 'Reactor 2 Temperature (600 - 700°C)', type: 'text', required: true },
    { name: 'R2Press', label: 'Reactor 2 Pressure (40Pa)', type: 'text', required: true },
    { name: 'R2ExTemp', label: 'Reactor 2 Exhaust Temperature (Max 750°C)', type: 'text', required: true },
    { name: 'ExPress', label: 'Exhaust Pressure (Pa)', type: 'text', required: true },
    { name: 'BomatTemp', label: 'Bomat Heat Exchanger Temperature (Max 550°C)', type: 'text', required: true },
    { name: 'Ex1Cap', label: 'Exhaust Fan 1 Capacity (50 - 75%)', type: 'text', required: true },
    { name: 'Ex2Cap', label: 'Exhaust Fan 2 Capacity (50 - 75%)', type: 'text', required: true },
    { name: 'AGRCap', label: 'AGR Fan Capacity (%)', type: 'text', required: true },
    { name: 'CombustCT', label: 'Combustion Chamber Temperature (Max. 1100°C)', type: 'text', required: true },
    { name: 'CombustFC', label: 'Combustion Air Fan Capacity (%)', type: 'text', required: true },
    { name: 'CombustACD', label: 'Combustion Air Control Damper (°)', type: 'text', required: true },
    { name: 'Lam02', label: 'Lambda (O2) Level (<2%)', type: 'text', required: true },
    { name: 'HGCycloneTemp', label: 'HG Cyclone Temperature (Max. 1050°C)', type: 'text', required: true },
    { name: 'PGCycloneTemp', label: 'PG Cyclone Temperature (°C)', type: 'text', required: true },
    { name: 'QuenchTime', label: 'Quench Spraying Time (sec)', type: 'text', required: true },
    { name: 'BioBin', label: 'Biomass Bin in Service', type: 'radio', options: ['1', '2'], required: true },
    { name: 'biomassBinChanged', label: 'Biomass bin changed?', type: 'radio+compound', options: ['No', 'Yes'], required: true, compound: { showIf: 'Yes',
    fields: [
      {name: 'biomassChangeTime', label: 'Change Date & Time', type: 'datetime-local', defaultValue: new Date().toISOString().slice(0, 16), required: true},
      { name: 'biomassMC', label: 'Biomass MC (%)', type: 'text', placeholder: 'e.g. 25', required: true}
    ]}}
    ];

  const handleSubmit = async (formData) => {
    const response = await submitForm(formData);
    if (response) {
      alert('Form submitted!');
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Ahlstrom Daily Form</h1>
      <Form fields={fields} onSubmit={handleSubmit} />
    </div>
  );
};

export default AhlstromForm;
