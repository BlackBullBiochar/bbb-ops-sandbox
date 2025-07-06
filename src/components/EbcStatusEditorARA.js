import React, { useState, useContext } from 'react';
import styles from './EbcStatusEditor.module.css';
import { UserContext } from '../UserContext.js';
import { API } from '../config/api';

const statusOptions = ['Flagged', 'Rejected', 'Post-Approved'];

const EbcStatusEditor = ({ charcodeId, currentStatus, currentReason, onSaved }) => {
  const { user } = useContext(UserContext);
  const [status, setStatus] = useState('Flagged');
  const [reason, setReason] = useState(currentReason || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
    const site = ('ara');

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Step 2: PATCH ebcstatus history
      const res2 = await fetch(`${API}/ebc/status/append`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ site, charcodeId, status, reason }),
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
          placeholder="Enter your reason here…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
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
