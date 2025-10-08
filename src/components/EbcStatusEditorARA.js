import React, { useState, useContext } from 'react';
import styles from './EbcStatusEditor.module.css';
import { UserContext } from '../UserContext.js';
import { API } from '../config/api';
import Button from './Button.js';

const statusOptions = ['Flagged', 'Rejected', 'Post-Approved'];

/**
 * EbcStatusEditor
 * Props:
 * - charcodeId: string
 * - bagId: string (ObjectId)
 * - siteId: string (ObjectId)
 * - baggingDate: string (YYYY-MM-DD)
 * - currentStatus: string
 * - currentReason: string
 * - onSaved: function(newStatus)
 */
const EbcStatusEditor = ({
  charcodeId,
  bagId,
  siteId,
  baggingDate,
  currentStatus,
  currentReason,
  onSaved
}) => {
  const { user } = useContext(UserContext);
  const [status, setStatus] = useState(currentStatus || statusOptions[0]);
  const [reason, setReason] = useState(currentReason || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${API}/ebc/ebcstatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          bagId,
          siteId,
          charcode: charcodeId,
          baggingDate,
          status,
          reason
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save EBC status');

      if (onSaved) onSaved(data);
    } catch (err) {
      console.error('❌ Save error:', err);
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
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
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
        <Button
          name={saving ? 'Saving...' : 'Save Status'}
          onPress={handleSave}
          disabled={saving}
        />
        {error && <div className={styles.error}>❌ {error}</div>}
      </div>
    </div>
  );
};

export default EbcStatusEditor;
