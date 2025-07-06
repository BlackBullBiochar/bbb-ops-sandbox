import React, { useContext } from 'react';
import styles from './EBCStatusList.module.css';
import { UserContext } from '../UserContext.js';
import Button from './Button.js';
import { API } from '../config/api';

const EbcStatusList = ({ charcodeId, ebcEntries = [], onDeleted }) => {
  const { user } = useContext(UserContext);

  if (!Array.isArray(ebcEntries) || ebcEntries.length === 0) {
    return <div className={styles.empty}>No EBC Data</div>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <colgroup>
          <col style={{ width: '15%' }} />
          <col style={{ width: '50%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Status</th>
            <th>Reason</th>
            <th>Date</th>
            <th>Time</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ebcEntries.slice().reverse().map((entry) => (
            <tr key={`${entry.date}-${entry.time}-${entry.status}`}> 
              <td>{entry.status}</td>
              <td>{entry.reason}</td>
              <td>{entry.date}</td>
              <td>{entry.time}</td>
              <td>
                <Button
                  name="Delete"
                  color="Error"
                  size="small"
                  onPress={async () => {
                    if (!window.confirm("Delete this status entry?")) return;
                    try {
                      const res = await fetch(
                        `${API}/ebc/status/${charcodeId}/${encodeURIComponent(entry.date)}/${encodeURIComponent(entry.time)}`,
                        {
                          method: 'DELETE',
                          headers: {
                            Authorization: `Bearer ${user.token}`,
                          },
                        }
                      );
                      if (!res.ok) {
                        console.error("Failed to delete status entry");
                        return;
                      }
                      onDeleted(entry._id);
                    } catch (err) {
                      console.error("❌ Delete error:", err);
                    }
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EbcStatusList;
