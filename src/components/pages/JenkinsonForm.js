import React from 'react';
import Form from '../Form';
import styles from './AhlstromForm.module.css';
import { useSubmitForm } from '../../hooks/useSubmitFormJNR';

const now = new Date();
const pad = (n) => n.toString().padStart(2, '0');

const JenkinsonForm = () => {
  const { submitForm, loading, error } = useSubmitForm();
  const fields = [
    { name: 'C500_fault_messages', label: 'C500 fault messages', type: 'radio+text', options: ['No'], required: true},
    { name: 'C500_heat_meter_reading', label: 'C500-I Heat Meter Reading (kWh conversion - INCLUDE DECIMALS)', type: 'text', required: true },
    { name: 'running_hours_total', label: 'Running Hours Total (Hrs)', type: 'text', required: true },
    { name: 'system_pressure_healthy', label: 'System Pressure Healthy?', type: 'radio', options: ['Yes', 'No'], required: true },
    { name: 'STB_healthy', label: 'SBT Healthy?', type: 'radio', options: ['Yes', 'No'], required: true },
    { name: 'STB_entry_healthy', label: 'SBT Entry Healthy?', type: 'radio', options: ['Yes', 'No'], required: true },
    { name: 'STB_discharge_healthy', label: 'SBT Discharge Healthy?', type: 'radio', options: ['Yes', 'No'], required: true },
    { name: 'plant_OK', label: 'Plant OK?', type: 'radio', options: ['Yes', 'No'], required: true },
    { name: 'secondary_air_flap_percentage', label: 'Secondary Air Flap Percentage (%)', type: 'text', required: true },
    { name: 'exhaust_fan_running_percentage', label: 'Exhaust Fan Running Percentage (%)', type: 'text', required: true },
    { name: 'exhaust_gas_flap_percentage', label: 'Exhaust Gas Flap Percentage (%)', type: 'text', required: true },
    { name: 'conveter_pressure', label: 'Converter Pressure (mBar)', type: 'text', required: true },
    { name: 'starter_blower', label: 'Starter Blower Percentage (%)', type: 'text', required: true },
    { name: 't1_reading', label: 'T1 Reading (750 - 850°C)', type: 'text', required: true },
    { name: 't2_reading', label: 'T2 Reading (500 - 600°C)', type: 'text', required: true },
    { name: 't3_reading', label: 'T3 Reading (Above 585°C)', type: 'text', required: true },
    { name: 't4_reading', label: 'T4 Reading (Above 585°C)', type: 'text', required: true },
    { name: 't5_reading', label: 'T5 Reading (Above 585°C)', type: 'text', required: true },
    { name: 't6_reading', label: 'T6 Reading (Above 65°C)', type: 'text', required: true },
    { name: 't7_reading', label: 'T7 Reading (Max 90°C)', type: 'text', required: true },
    { name: 't8_reading', label: 'T8 Reading (80°C)', type: 'text', required: true },
    { name: 't9_reading', label: 'T9 Reading (°C)', type: 'text', required: true },
    { name: 't10_reading', label: 'T10 Reading (°C)', type: 'text', required: true },
    { name: 't11_reading', label: 'T11 Reading (°C)', type: 'text', required: true },
    { name: 't12_reading', label: 'T12 Reading (°C)', type: 'text', required: true },
    { name: 'mixing_valve_percentage', label: 'Mixing Valve Percentage (%)', type: 'text', required: true },
    { name: 'vacuum_fan_percentage', label: 'Vacuum Fan Percentage (%)', type: 'text', required: true },
    { name: 'lamda_percentage', label: 'Lamda Percentage (6-10%)', type: 'text', required: true },
    { name: 'lamda_02_level', label: 'Lambda (O2) Level (<2%)', type: 'text', required: true },
    { name: 'entry_system_healthy', label: 'Entry System Healthy?', type: 'radio', options: ['Yes', 'No'], required: true },
    { name: 'converter_speed_percentage', label: 'Converter Speed Percentage (%)', type: 'text', required: true },
    { name: 'biomass_moisture_content', label: 'Biomass Moisture Content (%)', type: 'text', required: true },
    { name: 'biomass_dryer_heat_meter', label: 'EOW | Biomass Dryer Heat Meter (kWh)', type: 'text', required: true },
    { name: 'sports_hall_heat_meter', label: 'EOW | Sports Hall Heat Meter (kWh)', type: 'text', required: true },
    { name: 'grizedale_heat_meter', label: 'EOW | Grizedale Heat Meter (kWh)', type: 'text', required: true },  
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