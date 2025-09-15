/*
This is the form for Jenkinsons's daily data submission. uses the form.js component. If any changes made to this file then the model in the server model must also be updated.
*/
import React from 'react';
import Form from '../Form';
import styles from './AhlstromForm.module.css';
import { useSubmitForm } from '../../hooks/useSubmitFormJNR';

const now = new Date();
const pad = (n) => n.toString().padStart(2, '0');

const JenkinsonForm = () => {
  const { submitForm, loading, error } = useSubmitForm();
  const fields = [
    { name: 'login_pin', label: 'Login Pin', type: 'text', required: true },
    { name: 'C500_fault_messages', label: 'C500 fault messages', type: 'radio+text', options: ['No'], required: true},
    { name: 't1_reading', label: 'T1 Reading (750 - 850°C)', type: 'text', required: true },
    { name: 't2_reading', label: 'T2 Reading (500 - 600°C)', type: 'text', required: true },
    { name: 't5_reading', label: 'T5 Reading (Above 585°C)', type: 'text', required: true },
    { name: 'C500_heat_meter_reading', label: 'C500-I Heat Meter Reading (kWh conversion - INCLUDE DECIMALS)', type: 'text', required: true },
    { name: 'biomass_dryer_heat_meter', label: 'EOW | Biomass Dryer Heat Meter (kWh)', type: 'text', required: true },
    { name: 'sports_hall_heat_meter', label: 'EOW | Sports Hall Heat Meter (kWh)', type: 'text', required: true },
    { name: 'grizedale_heat_meter', label: 'EOW | Grizedale Heat Meter (kWh)', type: 'text', required: true }, 
    { name: 'biomass_moisture_content', label: 'Biomass Moisture Content (%)', type: 'text', required: true }, 
    { name: 'biochar_moisture_content', label: 'Biochar Moisture Content (%)', type: 'text', required: true },
    { name: 'biochar_retention_log_complete', label: 'Biochar Retention Sample Log Complete?', type: 'radio', options: ['yes','No'], required: true },
    { name: 'operator', label: 'Completed By (Initials)', type: 'text', required: true },
    ];

  const handleSubmit = async (formData) => {
    console.log('Submitting form data:', formData);
    const rsp = await submitForm(formData);
    if (rsp.ok) {
      alert('Form submitted');
    } else if (rsp.status === 401) {
      alert(rsp.error || 'Invalid PIN');
    } else {
      alert('Error submitting form - please try again.');
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