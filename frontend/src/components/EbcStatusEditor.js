import React, { useState } from 'react';
import styles from './EbcStatusEditor.module.css';

const statusOptions = ['Flagged', 'Rejected', 'Post-Approved'];

const EbcStatusEditor = ({ charcodeId, currentStatus, currentReason, onSaved }) => {
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState(currentReason || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
  
    console.log('📄 Sending PATCH:', {
      charcodeId,
      status,
      reason,
    });
  
    try {
      const res = await fetch('http://localhost:5000/api/charcodes/update-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charcodeId, status, reason }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Update failed');

      console.log('📡 Sending PATCH request:', {
        charcodeId,
        status,
        reason
      });
      
  
      if (onSaved) onSaved(data.updatedRow);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };  

  return (
    <div className={styles.editor}>
      <label>
        Status:
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {statusOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>

      <label>
        Reason:
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason (optional)"
        />
      </label>
      <div className={styles.buttonRow}>
      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Status'}
      </button>

      {error && <div className={styles.error}>❌ {error}</div>}
      </div>
    </div>
  );
};

export default EbcStatusEditor;
