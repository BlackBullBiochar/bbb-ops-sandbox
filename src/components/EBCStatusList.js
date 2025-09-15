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
          <col style={{ width: '35%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Status</th>
            <th>Reason</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {ebcEntries.slice().map((entry) => (
            <tr key={`${entry.date}-${entry.time}-${entry.status}`}> 
              <td>{entry.status}</td>
              <td>{entry.reason}</td>
              <td>{entry.created_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EbcStatusList;
