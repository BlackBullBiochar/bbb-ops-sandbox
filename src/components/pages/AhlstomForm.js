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
    { name: 'login_pin', label: 'Login Pin', type: 'text', required: true },
    { name: 'P500_heat_meter_total', label: 'P500 Heat Meter Total (m³)', type: 'text', required: true },
    { name: 'P500_heat_meter_flow_rate', label: 'P500 Heat Meter Flow Rate (°C)', type: 'text', required: true },
    { name: 'P500_heat_meter_supply_temperature', label: 'P500 Heat Meter Supply Temp (°C)', type: 'text', required: true },
    { name: 'P500_heat_meter_return_temp', label: 'P500 Heat Meter Return Temp (°C)', type: 'text', required: true },
    { name: 'P500_fault_messages', label: 'P500 fault messages', type: 'radio+text', options: ['No'], required: true},
    { name: 'feed_level', label: 'Feeder Level (30-50%)', type: 'text' },
    { name: 'feed_screw_1_pulse_time', label: 'Feeding Screw 1 Pulse Time (0.1 - 9.9sec)', type: 'text', required: true },
    { name: 'feed_screw_2_pulse_time', label: 'Feeding Screw 2 Pulse Time (0.1 - 9.9sec)', type: 'text', required: true },
    { name: 'r1_temperature', label: 'Reactor 1 Temperature (600 - 700°C)', type: 'text', required: true },
    { name: 'r1_pressure', label: 'Reactor 1 Pressure (40Pa)', type: 'text', required: true },
    { name: 'r1_exhaust_temperature', label: 'Reactor 1 Exhaust Temperature (Max 750°C)', type: 'text', required: true },
    { name: 'r1_drive_pulse_time', label: 'Reactor 1 Drive Pulse Time (0.1 - 5.9sec)', type: 'text', required: true },
    { name: 'r2_drive_pulse_time', label: 'Reactor 2 Drive Pulse Time (0.1 - 5.9sec)', type: 'text', required: true },
    { name: 'r2_temperature', label: 'Reactor 2 Temperature (600 - 700°C)', type: 'text', required: true },
    { name: 'r2_pressure', label: 'Reactor 2 Pressure (40Pa)', type: 'text', required: true },
    { name: 'r2_exhaust_temperature', label: 'Reactor 2 Exhaust Temperature (Max 750°C)', type: 'text', required: true },
    { name: 'exhaust_pressure', label: 'Exhaust Pressure (Pa)', type: 'text', required: true },
    { name: 'bomat_heat_exchanger_temperature', label: 'Bomat Heat Exchanger Temperature (Max 550°C)', type: 'text', required: true },
    { name: 'exhaust_1_capacity', label: 'Exhaust Fan 1 Capacity (50 - 75%)', type: 'text', required: true },
    { name: 'exhaust_2_capacity', label: 'Exhaust Fan 2 Capacity (50 - 75%)', type: 'text', required: true },
    { name: 'AGR_fan_capacity', label: 'AGR Fan Capacity (%)', type: 'text', required: true },
    { name: 'combustion_chamber_temperature', label: 'Combustion Chamber Temperature (Max. 1100°C)', type: 'text', required: true },
    { name: 'combustion_air_fan_1_capacity', label: 'Combustion Air Fan Capacity (%)', type: 'text', required: true },
    { name: 'combustion_air_control_dampener', label: 'Combustion Air Control Damper (°)', type: 'text', required: true },
    { name: 'lamda_02_level', label: 'Lambda (O2) Level (<2%)', type: 'text', required: true },
    { name: 'HG_cyclone_temperature', label: 'HG Cyclone Temperature (Max. 1050°C)', type: 'text', required: true },
    { name: 'PG_cyclone_temperature', label: 'PG Cyclone Temperature (°C)', type: 'text', required: true },
    { name: 'quench_spraying_time', label: 'Quench Spraying Time (sec)', type: 'text', required: true },
    { name: 'biochar_post_quench_temperature', label: 'Post Quench Temperature (°C)', type: 'text', required: true },
    { name: 'biomass_bin_in_service', label: 'Biomass Bin in Service', type: 'radio', options: ['1', '2'], required: true },
    { name: 'biomassBinChanged', label: 'Biomass bin changed?', type: 'radio+compound', options: ['No', 'Yes'], required: true, compound: { showIf: 'Yes',
    fields: [
      {name: 'biomass_bin_changed_time', label: 'Date', type: 'datetime-local', defaultValue: new Date().toISOString().slice(0, 16), required: true},
      { name: 'biomass_bin_changeover_time', label: 'Time (00:00)', type: 'text'},
      { name: 'biomass_bin_moisture_content', label: 'Biomass MC (%)', type: 'text'}
    ]}}
    ];

  const handleSubmit = async (formData) => {
    const response = await submitForm(formData);
      if (response.ok) {
        alert('Form submitted');
      } else if (response.status === 401) {
        alert('Invalid PIN');
      } else {
        alert('Error submitting form - please try again.');
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
