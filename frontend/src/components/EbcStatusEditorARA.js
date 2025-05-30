import React, { useState } from 'react';
import styles from './EbcStatusEditor.module.css';

const statusOptions = ['Flagged', 'Rejected', 'Post-Approved'];

const EbcStatusEditor = ({ charcodeId, currentStatus, currentReason, onSaved }) => {
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState(currentReason || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
    const site = ('ara');

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Step 2: PATCH ebcstatus history
      const res2 = await fetch('http://localhost:5000/api/ebcstatus/append', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, charcodeId, status, reason })
      });

      const data2 = await res2.json();
      if (!res2.ok) throw new Error(data2.error || 'EBC history append failed');

      if (onSaved) onSaved(data2.updatedRow);
    } catch (err) {
      console.error('❌ Save error:', err.message);
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
